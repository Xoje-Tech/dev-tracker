# Concrete smoke for dev-tracker

A fully worked example of the api-smoke template, populated for dev-tracker's
HTTP API. Use this as a copy-paste starting point when you need to validate
dev-tracker (the Xoje-Tech Kanban app) end-to-end against a running dev
server.

## When to use this instead of the template

- You're working on dev-tracker specifically (not a generic API).
- You want a smoke that exercises the full CRUD cycle: register -> cookie ->
  rotate-api-key -> project -> board -> task -> tag -> move.
- You want the smoke to assert BOTH the new URL contract and the absence of
  the old one (e.g. after a router refactor -- see PR #42 closing #41).

## How to use

1. Start the dev server: `cd /home/hermes/projects/dev-tracker && pnpm run dev`
2. Save the script below to `/tmp/smoke-dev-tracker.sh` (or anywhere you like).
3. Run: `bash /tmp/smoke-dev-tracker.sh`
4. Watch for `PASS:` / `FAIL:` lines and the final `=== Done. FAILED=... ===`.
5. Exit code 0 = all green. Exit code 1 = something broke.

## The script

```bash
#!/usr/bin/env bash
# Smoke for dev-tracker. Assumes the dev server is on http://localhost:3000.
# Validates the current URL contract -- update expected_status when the
# contract changes.
#
# Exit 0 on full pass, 1 on any failure.

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="smoke-$(date +%s)@test.local"
PASSWORD="SmokeTest123!"
COOKIES=$(mktemp)
RESP=$(mktemp)
BOARD_FILE=$(mktemp)

FAILED=0

cleanup() { rm -f "$COOKIES" "$RESP" "$BOARD_FILE"; }
trap cleanup EXIT

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  PASS: $label (HTTP $actual)"
  else
    echo "  FAIL: $label (expected $expected, got $actual)"
    echo "        body: $(head -c 200 "$RESP")"
    FAILED=1
  fi
}

echo "=== Health ==="
H=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
check "GET /api/health" "200" "$H"
[ "$H" = "200" ] || exit 1

echo ""
echo "=== Auth ==="
curl -sS -c "$COOKIES" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"name\":\"Smoke\",\"password\":\"$PASSWORD\"}" >/dev/null
echo "  Email: $EMAIL"

API_KEY=$(curl -sS -b "$COOKIES" -X POST "$BASE_URL/api/auth/rotate-api-key" | \
  python3 -c "import json,sys; print(json.load(sys.stdin)['apiKey'])")
echo "  API_KEY: ${API_KEY:0:20}..."

echo ""
echo "=== Project ==="
PROJ_ID=$(curl -sS -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: application/json" -H "x-api-key: $API_KEY" \
  -d '{"name":"Smoke Project"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
echo "  Project: $PROJ_ID"

echo ""
echo "=== Board (current URL contract) ==="
B_CODE=$(curl -sS -w "%{http_code}" -o "$BOARD_FILE" \
  "$BASE_URL/api/boards/$PROJ_ID/board" -H "x-api-key: $API_KEY")
check "GET /api/boards/:id/board" "200" "$B_CODE"

# If you're validating a breaking refactor, also assert the OLD URL is gone:
# OLD_CODE=$(curl -sS -o /dev/null -w "%{http_code}" \
#   "$BASE_URL/api/projects/$PROJ_ID/board" -H "x-api-key: $API_KEY")
# check "GET /api/projects/:id/board (should be 404)" "404" "$OLD_CODE"

# Extract column IDs (note: field is `title` not `name`).
COL_ID=$(python3 -c "import json; print(json.load(open('$BOARD_FILE'))['columns'][0]['id'])")
DONE_COL=$(python3 -c "import json; b=json.load(open('$BOARD_FILE')); print([c['id'] for c in b['columns'] if c['title']=='Done'][0])")

echo ""
echo "=== Task ==="
TASK=$(curl -sS -X POST "$BASE_URL/api/tasks" \
  -H "Content-Type: application/json" -H "x-api-key: $API_KEY" \
  -d "{\"projectId\":\"$PROJ_ID\",\"title\":\"Smoke task\",\"description\":\"d\",\"columnId\":\"$COL_ID\"}")
TASK_ID=$(echo "$TASK" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
TASK_ORDER=$(echo "$TASK" | python3 -c "import json,sys; print(json.load(sys.stdin)['order'])")
echo "  Task: $TASK_ID  order: $TASK_ORDER (server-computed)"

echo ""
echo "=== Tag + assign ==="
TAG_ID=$(curl -sS -X POST "$BASE_URL/api/tags" \
  -H "Content-Type: application/json" -H "x-api-key: $API_KEY" \
  -d '{"name":"urgent","color":"#ff0000"}' | \
  python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
echo "  Tag: $TAG_ID"

ASSIGN_CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X POST \
  "$BASE_URL/api/tags/tasks/$TASK_ID/tags/$TAG_ID" -H "x-api-key: $API_KEY")
check "POST /api/tags/tasks/:taskId/tags/:tagId" "200" "$ASSIGN_CODE"

echo ""
echo "=== Move ==="
MOVE_CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X POST \
  "$BASE_URL/api/tasks/$TASK_ID/move" \
  -H "Content-Type: application/json" -H "x-api-key: $API_KEY" \
  -d "{\"targetColumnId\":\"$DONE_COL\",\"newIndex\":0}")
check "POST /api/tasks/:id/move" "200" "$MOVE_CODE"

echo ""
echo "=== Final board state ==="
curl -sS "$BASE_URL/api/boards/$PROJ_ID/board" -H "x-api-key: $API_KEY" | \
  python3 -c "import json,sys; b=json.load(sys.stdin); [print(f'  {c[\"title\"]}: {[t[\"title\"] for t in c[\"tasks\"]]}') for c in b['columns']]"

echo ""
echo "=== Done. FAILED=$FAILED ==="
exit $FAILED
```

## Customization for breaking-change validation

To prove a refactor that changed URLs is complete, uncomment the `OLD_CODE`
check in the script and replace the path with the URL that should now 404.
Two checks per line: one PASS for the new URL, one PASS for the old URL
returning 404. The PR that closed #41 used exactly this pattern.

## Source / lineage

Extracted from the dev-tracker PR #42 verification cycle (closing issue #41,
the router mount convention refactor). The full failure mode that motivated
this skill is documented in:

- `~/.hermes/skills/agent-conduct/delegation-strategies/references/stale-base-recovery-dev-tracker-2026-07-06.md`
- `~/.hermes/skills/software-development/typescript-refactoring/SKILL.md` (sections on DTO contract drift and URL table)
