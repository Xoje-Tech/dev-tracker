# Troubleshooting Runbook

Operational guide for diagnosing and resolving common dev-tracker issues.

## Quick diagnostics

Run these first — they cover 80% of "something's wrong" tickets:

```bash
# Is the container running?
podman ps | grep dev-tracker        # or: docker ps | grep dev-tracker

# Is the app responding?
curl -fsS http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"..."}

# What do the logs say?
podman logs --tail 50 dev-tracker

# Is the volume mounted correctly?
podman exec dev-tracker ls -la /app/data/
# Expected: dev.db, sessions.db

# Resource usage?
podman stats --no-stream dev-tracker
```

If `curl /api/health` returns **HTTP 200** → app is healthy, problem is downstream (browser, auth, data).
If **HTTP 000** (connection refused) → container isn't accepting connections (see Container issues).
If **HTTP 5xx** → app is up but erroring (see Logs section).

---

## Container issues

### Container won't start

```bash
# Check why it exited
podman logs dev-tracker

# Common causes:
# 1. SESSION_SECRET not set / too short (< 16 chars)
#    Fix: export SESSION_SECRET=$(openssl rand -hex 32)
#
# 2. Port 3000 already in use
#    Fix: lsof -i :3000 (find the process); either kill it or change ports in docker-compose.yml
#
# 3. Volume permissions issue
#    Fix: podman compose down && podman volume rm dev-tracker-data && podman compose up -d
```

### Container keeps restarting

```bash
# Look at the logs for the actual error
podman logs --tail 100 dev-tracker
# Look for: "Error:", "ERR_", "Aborted", or repeated startup attempts

# Common cause: docker-entrypoint.sh failing
# The entrypoint runs `prisma db push` then `node ...`
# If prisma fails, container exits, restarts, fails again

# Check: can prisma actually find the schema?
podman exec dev-tracker ls -la /app/prisma/schema.prisma
podman exec dev-tracker ls -la /app/data/  # volume mountpoint
```

### Container is unhealthy (compose healthcheck failing)

The healthcheck in docker-compose.yml polls `/api/health` every 30s.

```bash
# Is the app actually responding?
curl -i http://localhost:3000/api/health

# If yes but healthcheck says unhealthy: check timing
# start_period is 15s — the container is given 15s before healthcheck matters
# After 15s, if healthcheck fails 3x in a row, status = unhealthy

# Check resource exhaustion
podman stats --no-stream dev-tracker
# If CPU or memory pegged → app is busy/deadlocked → see Performance section
```

### Podman-specific: docker-compose warnings

Podman uses Docker Compose as an external provider. You may see warnings like:

```
HEALTHCHECK is not supported for OCI image format and will be ignored. Must use `docker` format
```

This is **cosmetic** — the compose-level healthcheck (in docker-compose.yml) still works.
To silence it, build with podman's docker format: `podman build --format docker`.
This is not required for the app to function.

---

## Database issues

### SQLite is locked (`SQLITE_BUSY`)

Another process holds a write lock.

```bash
# Is there a stray process with the DB open?
podman exec dev-tracker lsof /app/data/dev.db
# Expected: only the node server (PID of dev-tracker)

# Stale lock from a crashed process?
# SQLite uses lock files (dev.db-wal, dev.db-shm). If the container died uncleanly,
# these might be stale. To check:
podman exec dev-tracker ls -la /app/data/
# Files: dev.db, dev.db-journal (optional), dev.db-wal, dev.db-shm

# Recovery: restore from backup (last good state)
podman compose down
podman run --rm -v dev-tracker-data:/data -v $(pwd):/backup \
  alpine cp /backup/dev-tracker-backup-<date>.db /data/dev.db
podman compose up -d
```

### Database is corrupted

```bash
# Try to dump what we can (may fail)
podman exec dev-tracker sqlite3 /app/data/dev.db ".dump" > /tmp/dump.sql
# If dump succeeds: restore from dump
podman compose down
podman run --rm -v dev-tracker-data:/data alpine rm /data/dev.db
podman compose up -d  # entrypoint will create empty DB
podman exec dev-tracker sqlite3 /app/data/dev.db < /tmp/dump.sql
```

If dump fails → restore from backup (see Recovery section).

### Schema drift after upgrade

If the entrypoint's `prisma db push` fails to apply cleanly:

```bash
# Check what prisma says
podman exec dev-tracker npx prisma db push --skip-generate

# If it asks for --accept-data-loss and you accept the risk:
podman exec dev-tracker npx prisma db push --skip-generate --accept-data-loss
```

For production, prefer proper migrations (`prisma migrate`) over `db push`. v1.0 uses `db push` for simplicity.

---

## Auth issues

### Cookies not working in browser

**Production:** Secure cookies (`secure: true` in `NODE_ENV=production`) require HTTPS. If accessing over HTTP, the browser silently drops the cookie.

**Fix:** Deploy behind a TLS-terminating reverse proxy (nginx/traefik/Caddy).

### `401 Unauthorized` on every request despite being logged in

```bash
# Is the session cookie being sent?
# In browser DevTools → Application → Cookies → check for connect.sid

# Check sessions.db has the session
podman exec dev-tracker node -e "
const sqlite3 = require('./node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3');
const db = new sqlite3.Database('/app/data/sessions.db');
db.get('SELECT COUNT(*) as c FROM sessions', (err, row) => {
  console.log('Sessions:', row.c);
  db.close();
});
"
```

If sessions count > 0 but cookie auth fails:
- Cookie might be expired (default: 7 days)
- Session might be tied to a different SESSION_SECRET (changed on restart if you didn't persist it)
- Domain mismatch (cookie set on `localhost` but accessed via IP)

### `SESSION_SECRET must be at least 16 characters` on startup

```bash
# Generate a proper one (32 bytes = 64 chars hex)
export SESSION_SECRET=$(openssl rand -hex 32)
# Persist it in .env so future restarts keep using the same secret
echo "SESSION_SECRET=$SESSION_SECRET" > .env
```

If you change SESSION_SECRET, **all existing sessions are invalidated** (cookies become invalid). Users need to log in again.

---

## Performance issues

### Container is using a lot of memory

```bash
podman stats --no-stream dev-tracker
```

Prisma + SQLite is normally lightweight (<200MB). If it's much higher:
- Check for runaway queries (see logs for repeated slow operations)
- Restart: `podman compose restart dev-tracker`
- If persistent: there's a memory leak somewhere — collect info and report

### App is slow to respond

```bash
# Check healthcheck latency
time curl -fsS http://localhost:3000/api/health

# If healthcheck is fast but specific endpoints are slow: it's a query problem
# Check logs for repeated slow query warnings (if you've added logging)
```

### Container restarts frequently

```bash
# Check OOM events
podman inspect dev-tracker | grep -i oom
dmesg | grep -i "killed process" | tail -5  # on the host

# Increase memory limit if needed (docker-compose.yml)
# Add: deploy.resources.limits.memory: 512M
```

---

## Recovery procedures

### Restore from backup

The backup is a complete copy of `dev.db` (and `sessions.db` if included).

```bash
# 1. Stop the running container
podman compose down

# 2. Restore (WARNING: overwrites current DB)
podman run --rm \
  -v dev-tracker-data:/data \
  -v /var/backups/dev-tracker:/backup \
  alpine cp /backup/dev-tracker-20260630-020000.db /data/dev.db

# 3. Start again
podman compose up -d

# 4. Verify
curl http://localhost:3000/api/health
# Login and check data is restored
```

### Reset to factory state (lose all data)

```bash
podman compose down -v   # -v removes volumes
podman compose up -d
# Database is recreated from schema on first boot
```

### Reset admin password

Currently there's no admin reset mechanism built-in. Workaround:

```bash
# Option 1: register a new user via API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newadmin@example.com","password":"newpassword","name":"New Admin"}'

# Option 2: directly modify the DB (use sqlite3 cli, requires container exec)
podman exec -it dev-tracker sqlite3 /app/data/dev.db
# Then: UPDATE User SET password = '<bcrypt-hash>' WHERE email = '...';
# Generate bcrypt hash externally (Node, python, or online tool)
```

A proper password reset flow is a future enhancement.

---

## Collecting debug info

Before asking for help (or filing an issue), gather this info:

```bash
# 1. Container state
podman ps -a | grep dev-tracker > debug-container.txt

# 2. Recent logs
podman logs --tail 200 dev-tracker > debug-logs.txt 2>&1

# 3. Image info
podman inspect dev-tracker --format 'Image: {{.Image}}\nCreated: {{.Created}}\nState: {{.State.Status}}' > debug-image.txt

# 4. Healthcheck
curl -i http://localhost:3000/api/health > debug-health.txt

# 5. Volume info
podman volume inspect dev-tracker-data > debug-volume.txt

# 6. Recent commits (in case a recent change broke things)
git log --oneline -20 > debug-commits.txt

# 7. Compose file (in case of config drift)
cp docker-compose.yml debug-compose.yml
```

Attach all `debug-*.txt` files when reporting.

---

## Common error messages

| Error | Cause | Fix |
|-------|-------|-----|
| `SESSION_SECRET is required` | Env var not set | `echo "SESSION_SECRET=..." > .env` |
| `SESSION_SECRET must be at least 16 characters` | Secret too short | Use `openssl rand -hex 32` |
| `Invalid environment variables` | Other env var invalid | Check `podman logs` for which field |
| `connect ECONNREFUSED 127.0.0.1:3000` | Container down | `podman compose up -d` |
| `EACCES` on `/app/data` | Volume perms | `podman compose down && podman volume rm dev-tracker-data && podman compose up -d` |
| `SQLITE_BUSY` | Lock contention | Wait + retry; or restore from backup |
| `port 3000 is already allocated` | Another process owns it | `lsof -i :3000` to find; kill it |
| `Prisma schema validation` | schema.prisma drift | `podman exec dev-tracker npx prisma validate` |

---

## When to escalate

If you've gone through this runbook and:
- Healthcheck still failing after restart
- Data corruption after restore from backup
- Reproducible crash on specific input
- Performance degraded >10x with no clear cause

Then:
1. Collect the debug info (above)
2. Note: dev-tracker version, Node version, podman/docker version, OS
3. Note exact reproduction steps
4. Report with all the above

---

Last updated: 2026-06-30 (v1.0.0)
Maintained as part of the dev-tracker v1.0 release.