# Technical Documentation (export to PDF, 8 to 15 pages)
Fill each section with screenshots from your own run.

1. **Title page**: group name, members, roles (table in README).
2. **Project description and modules**: proxy, frontend, destinations-api, lookup-api, db (table in README "Which folder is which").
3. **Architecture**: `docs/architecture.png`. Explain: only the proxy publishes port 8080; `backend-net` is internal; request flow browser -> proxy -> API -> db; volume `pg-data`.
4. **Stack and justification**: nginx (one entry point, tiny image), Node.js + Express (team knows JS, existing app), PostgreSQL (relational data, real DB container, official alpine image), `node --test` (no extra dependencies), Jenkins + GitHub webhook via ngrok.
5. **Dockerfiles**: multi-stage `base -> test -> production`; pinned `node:22-alpine`, `nginx:1.27-alpine`, `postgres:16-alpine`; `npm ci` after copying package files for layer caching; `USER node`; `HEALTHCHECK`; `.dockerignore`. Note nginx images drop worker processes to the `nginx` user.
6. **Compose**: services, `depends_on: service_healthy`, `frontend-net` / `backend-net (internal)`, `pg-data`, `.env` variables with `:?` guards, `restart: unless-stopped`, top-level `name: travelbucket` so every deploy reuses the same volume.
7. **Jenkins setup**: install steps from README, plugins (suggested, Docker Pipeline, GitHub), credential `travelbucket-env`, trigger config.
8. **Pipeline**: each stage and what happens on failure (Test fails -> no Deploy). Add Stage View screenshot.
9. **Testing strategy**: unit/API tests with a fake repository in both services, validation tests, smoke test through the proxy plus full CRUD on PostgreSQL.
10. **Rollback and persistence proof**: screenshots of steps 6 and 7 in `docs/DEMO-SCRIPT.md`.
11. **Problems and fixes**: use `docs/AUDIT.md` plus your own (e.g. nginx caching container IPs -> runtime DNS resolver; first build needed to register triggers).
12. **Contributions and references**.
