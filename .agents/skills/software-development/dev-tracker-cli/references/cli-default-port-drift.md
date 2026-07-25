# CLI Default Port Drift (3000 vs 6789)

The `dt` CLI's documented default URL — `http://localhost:3000` — is **stale** in the current podman production deployment. The server actually listens on `http://localhost:6789`. This causes a generic `Error: fetch failed` whenever you run `dt` without `-u` against a podman-deployed server, with no hint that the port is the issue.

**Discovered:** 2026-07-15 while trying to use `dt tasks update` to edit a board task.
**Reported:** `Xoje-Tech/dev-tracker` issue #70 (CLI default port mismatch).
**Workaround:** always pass `-u http://localhost:6789` or `export DEV_TRACKER_URL=http://localhost:6789`.

## Why this happened

The CLI default was set when the server ran on Docker Compose mapping `3000:3000`. The current podman-compose deployment changed the internal port mapping to `127.0.0.1:6789:3000` (binding to loopback only, mapped to non-privileged host port 6789) so the service can run rootless without binding privileged ports. The CLI was never updated to reflect the new default.

## Discovery recipe (when `dt` fails with "fetch failed")

```bash
# 1. Find the running container and its exposed port
podman ps --filter name=dev-tracker
# CONTAINER ID  IMAGE                                        PORTS
# e6271d573258  ghcr.io/xoje-tech/dev-tracker-server:latest  6789/tcp

# 2. Probe the suspected port directly
curl -sI http://localhost:6789/health
# HTTP/1.1 200 OK   ← right port

# 3. Always pass -u to dt
dt -u http://localhost:6789 tasks list
```

The discovery takes ~10 seconds and is worth doing every time you start a new session — the port can change between deployments, and `dt` won't tell you when it does.

## When the default URL is actually right

- **Local development with docker-compose:** server maps `3000:3000`, `dt` works without `-u`.
- **CI test environments:** tests typically set `DEV_TRACKER_URL` to a test server.
- **Production podman deployment:** ALWAYS use `-u http://localhost:6789`.

## Related gotchas

- `gh` CLI in this ecosystem (the wrapper around the same backend) also defaults to a different port. Always check.
- The MCP server config in `~/.hermes/config.yaml` should use `http://localhost:6789/api` for the production deployment. Verify with `cat ~/.hermes/config.yaml | grep DEV_TRACKER_API_URL`.
- If `podman ps` shows no dev-tracker container, the server isn't running. Start it with `~/dev-tracker-server/scripts/deploy.sh` or `systemctl --user start dev-tracker`.
