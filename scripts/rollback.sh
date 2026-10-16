#!/bin/sh
set -eu

TARGET="${1:?usage: scripts/rollback.sh <build-number>}"

for service in proxy frontend destinations-api lookup-api db; do
  docker image inspect "travelbucket/${service}:${TARGET}" >/dev/null 2>&1 \
    || { echo "Image travelbucket/${service}:${TARGET} not found. Available tags:"; docker images "travelbucket/${service}" --format '  {{.Tag}}'; exit 1; }
done

TAG="$TARGET" docker compose up -d --no-build --remove-orphans
echo "Rolled back to build ${TARGET}"
