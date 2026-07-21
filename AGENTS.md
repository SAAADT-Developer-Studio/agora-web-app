# AGENTS.md

## Cursor Cloud specific instructions

Vidik is a single web app: React Router 7 running on Cloudflare Workers (via the
`@cloudflare/vite-plugin`). It reads news/cluster/provider data from Postgres
through a Cloudflare Hyperdrive binding. Standard commands live in `package.json`
(`dev`, `lint`, `typecheck`, `build`, `preview`, `db:*`) and `README.md`.

### Services and how to run them

- Postgres is required. The Hyperdrive binding's local connection string in
  `wrangler.jsonc` points at `postgresql://vidik_user:vidik_password@localhost:5432/vidik`.
  Docker is installed in the VM; if the daemon is not running, start it with
  `sudo dockerd > /tmp/dockerd.log 2>&1 &` then `docker compose up -d` to start
  the `vidik_postgres` container. (Docker 29 needs `containerd-snapshotter: false`
  in `/etc/docker/daemon.json` for the fuse-overlayfs storage driver used here.)
- Copy `.env.example` to `.env` (git-ignored) before running any `drizzle-kit` /
  `db:*` command — `drizzle.config.ts` and `app/drizzle/seed.ts` read it.
- Dev server: `pnpm run dev` → http://localhost:5173 (Hyperdrive connects to the
  local Postgres). This is the app entry point for development.

### Database gotchas (important, non-obvious)

- `pnpm run db:seed` / `db:reset` pull real rows from the **production** DB and
  require `DB_URL` (+ `DB_CERT`) secrets that are not present in the cloud VM, so
  they cannot seed real data here.
- `drizzle-kit push` (invoked by `db:seed`) currently **fails** against a fresh
  DB: `app/drizzle/schema.ts` applies a `text_ops` opclass to the timestamptz
  `published_at` column, producing `operator class "text_ops" does not accept
  data type timestamp with time zone`. The schema is intentionally read-only
  (synced from the scraper repo), so do not "fix" it as part of unrelated work.
- To get a working local DB without prod access, apply the checked-in dev
  helpers (they mirror `schema.ts` but use the default btree opclass and add
  demo data across every category/provider so the home page, category/provider
  pages and voting all work):
  ```bash
  docker exec -e PGPASSWORD=vidik_password -i vidik_postgres \
    psql -U vidik_user -d vidik < scripts/dev-db/schema.local.sql
  docker exec -e PGPASSWORD=vidik_password -i vidik_postgres \
    psql -U vidik_user -d vidik < scripts/dev-db/seed.local.sql
  ```

### Other notes

- The home page loader also fetches external economy data (SURS GDP/inflation)
  and an AWS Lambda `apiUrl` (see `app/config.ts`, `app/lib/services/external.ts`).
  These are streamed as separate promises; if they fail (e.g. no egress) only the
  `EconomyCard` errors, the rest of the page still renders.
- `pnpm run typecheck` regenerates Cloudflare + React Router types before `tsc`;
  run it after changing `wrangler.jsonc`. `pnpm run lint` currently reports only
  warnings (no errors).
