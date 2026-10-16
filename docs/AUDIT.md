# What was wrong in the original system (and what we did)

## Bugs that broke the UI
1. **Missing `POST /api/destinations/reorder`.** The UI calls it on drag and the arrow buttons; the old server had no such route, so "My order" never saved. Added.
2. **Server stored only country, capital, note.** The UI also sends `date, days, tier, status, favorite, region, population, languages, currencies, currencyCode`; all were silently dropped, so favorites, Visited, budget tier, dates and trip length were lost on refresh. All fields are now columns and returned.
3. **Lookup returned only country, capital, region.** The UI reads `flag, population, currencies, currencyCode, languages`, so flags, currency conversion and details never showed. `lookup-api` now returns them (v5 `currencies`/`languages` shapes are parsed defensively because the docs do not show them; check once with your real key).
4. **Old lookup fallback treated "not found" (404) as a server error.** Now returns an empty list so the UI says "No countries found".

## Things that fail the SYSIN guide
5. **Real API key committed in `.env`** (`rc_live_...`) and no `.gitignore`. Treat it as leaked: rotate it on restcountries.com, never commit `.env`. Only `.env.example` is committed now.
6. **JSON file as database** (`data.json`). Not a DB container, lost when a container is recreated, race conditions on concurrent writes, ids from `Date.now()` can collide. Replaced by PostgreSQL 16 in a named volume.
7. **One monolith serving UI + API + lookup.** Guide needs 3+ modules in separate containers. Split into proxy, frontend, destinations-api, lookup-api, db.
8. **No `/health`, no tests.** `npm test` was `echo "Error: no test specified" && exit 1`, which would fail any pipeline. 33 real tests added.
9. **No Dockerfiles, compose, Jenkinsfile, `.dockerignore`, `.env.example`.** Added.

## Smaller smells
10. `cors()` open to everyone: not needed behind the proxy (same origin). Removed.
11. Port hard-coded and `dotenv` loaded after `app` setup. Config now comes from environment variables set by compose.
12. `console.log` of upstream response bodies and a PowerShell tip inside server code. Removed.
13. Unused `axios`; `"main": "New Text Document.js"`; leftover `library.json`, `destinations.json` from the other subject. Dropped.
14. No input validation. Added (country required, days 1-365, real dates, tier/status whitelist, length limits).
15. Express 5 async errors had no handler. Added JSON 400/404/500 handlers.
16. `node_modules` shipped in the zip. Excluded (`.dockerignore`, `.gitignore`).

## Do not
- Do not commit `.env`, API keys or DB passwords.
- Do not publish the DB port or use `postgres:latest` / `node:latest`.
- Do not bind-mount config files in compose (breaks when Jenkins runs it from its own container). Config is baked into images.
- Do not edit the pipeline in the Jenkins UI only; the `Jenkinsfile` is the source of truth.
- Do not run `docker compose down -v` before the persistence demo (deletes `pg-data`).
- Do not click Build Now during the demo; the push must trigger it.

## Left as-is on purpose (UI is frozen)
- Checklist and savings are stored in the browser's `localStorage`, not the database, so they do not survive a different browser and are not part of the persistence demo. Use destination records for that demo.
- `frontend/src/edit.html` is an old standalone page the main UI no longer uses; `index.html` has a leftover "PASTE EVERYTHING BELOW" comment. The UI loads maps, photos and rates from public CDNs/APIs, so the demo needs internet.
- The only visual addition: a small "Build N" label injected by the proxy (required by the guide to prove which version is live). Remove the `sub_filter` line in `proxy/nginx.conf.template` to drop it.
