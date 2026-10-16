# Demo script (guide section 10, in order)
Before the slot: Jenkins and the stack are already running, ngrok webhook is green, you are on `main`.

1. `docker compose ps` and open http://localhost:8080. Point at the "Build N" label. Add a destination and mark one as favorite.
2. Make a visible change, e.g. edit the `<title>` or heading in `frontend/src/index.html`. `git add -A && git commit -m "demo: heading" && git push`.
3. Do NOT click Build Now. Show Jenkins starting the build by itself; walk through Checkout, Test, Build Images, Deploy, Smoke Test in Stage View.
4. Refresh the browser: change visible, label shows the new build number.
5. Break a test: in `destinations-api/src/validation.js` change the days limit `365` to `36`, commit, push. Pipeline fails at **Test**, app still shows the previous build. `git revert HEAD`, push, pipeline goes green again.
6. Persistence: `docker compose down` then `docker compose up -d` (no `-v`). The destinations you created are still there.
7. Rollback: `./scripts/rollback.sh <older build number>` (or Jenkins Build with Parameters, `ROLLBACK_TAG`). Refresh; label shows the older build.

Tip: record a backup video of a good run.
