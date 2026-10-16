#!/bin/sh
set -eu

TAG="${TAG:?TAG must be set}"
ATTEMPTS=20
DELAY=3

retry() {
  n=1
  until "$@" >/dev/null 2>&1; do
    if [ "$n" -ge "$ATTEMPTS" ]; then
      return 1
    fi
    n=$((n + 1))
    sleep "$DELAY"
  done
}

proxy_get() {
  docker compose exec -T proxy wget -qO- "http://127.0.0.1$1"
}

check_page_shows_build() {
  proxy_get / | grep -q "Build ${TAG}"
}

echo "[smoke] proxy health"
retry proxy_get /health || { echo "[smoke] proxy not healthy"; exit 1; }

echo "[smoke] destinations-api health through the proxy"
retry proxy_get /health/destinations || { echo "[smoke] destinations-api not healthy"; exit 1; }

echo "[smoke] lookup-api health through the proxy"
retry proxy_get /health/lookup || { echo "[smoke] lookup-api not healthy"; exit 1; }

echo "[smoke] destinations list is readable through the proxy"
proxy_get /api/destinations | grep -q '^\[' || { echo "[smoke] list endpoint did not return JSON"; exit 1; }

echo "[smoke] page is served and shows Build ${TAG}"
retry check_page_shows_build || { echo "[smoke] build label ${TAG} not found on the page"; exit 1; }

echo "[smoke] full create / read / update / delete against PostgreSQL"
docker compose exec -T destinations-api node scripts/smoke.js

echo "[smoke] all checks passed for build ${TAG}"
