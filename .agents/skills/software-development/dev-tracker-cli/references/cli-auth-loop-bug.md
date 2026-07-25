# 2026-07-04: CLI auth loop debugging

## Context
When attempting to use `dev-tracker-cli` (the `dt` tool) after a period of inactivity, all commands started returning `Error: Unauthorized (Try: dt auth rotate-key)`. 

## Flow reproduction
1. `dt auth login --email <x> --password <y>`
   - The `/api/auth/login` endpoint returns `200`.
   - The CLI internally triggers `dt auth rotate-key` (to exchange the cookie for an API key).
   - The rotation fails with `Validation failed at auth.rotateApiKey (response)`.
   - The user is left logged in via cookie, but without an API key in `~/.dev-tracker/session.json`.

2. The next command (e.g. `dt projects list`) tries to execute.
   - It sees no valid API key (or an expired one).
   - It hits the API.
   - The API returns `401`.
   - The user is stuck.

## Underlying causes
1. **The CLI's session-forwarding is broken.** When it tries to call `/api/auth/rotate-api-key` immediately after login, the `HttpDevTrackerClient` is not forwarding the newly acquired `connect.sid` cookie correctly. The rotation endpoint demands authentication, sees no cookie, and returns `401`.
2. **The SDK's Zod error masking.** When the `401` comes back, it contains an HTML or generic JSON body. The SDK expects `{ apiKey: "***" }` and tries to parse it via `rotateApiKeyOutputSchema`. Zod throws a validation error, which masks the underlying `401` from the user.

## Workaround
Currently, there is no viable workaround from the CLI itself. If you hit this state, you must file issues and wait for a fix in the `dev-tracker` codebase. Do not attempt to brute-force or retry `auth login` from the CLI, as the cookie-forwarding bug prevents success.
