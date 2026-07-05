# MeinHandwerk

React frontend + PocketBase backend, orchestrated with Docker Compose.

```
frontend/   Isolated React (Vite + TypeScript) app — see frontend/README.md
backend/    Isolated PocketBase environment (migrations, hooks, data)
docker-compose.yml   Connects both services
```

For coding conventions and architecture rules, see [AGENTS.md](AGENTS.md).

## Prerequisites

- Node.js 22+ and npm (for local frontend dev)
- Docker Desktop (or compatible) with Compose v2

## Development

In development the backend runs in Docker while the frontend runs locally via Vite for fast HMR.

1. Start PocketBase:

   ```bash
   docker compose up -d pocketbase
   ```

   PocketBase is now reachable at `http://localhost:8090`, and its admin UI at `http://localhost:8090/_/`.

2. On first run, create a superuser account for the admin UI:

   ```bash
   docker compose exec pocketbase /pb/pocketbase superuser create admin@example.com <password>
   ```

3. Set up the frontend env file (only needed once):

   ```bash
   cp frontend/.env.example frontend/.env
   ```

4. Start the frontend dev server:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   The app runs at `http://localhost:5173` and talks to PocketBase via `VITE_POCKETBASE_URL` from `frontend/.env`.

To stop the backend: `docker compose down` (data persists in `backend/pb_data`, which is bind-mounted and gitignored).

## Production

Both services run fully containerized:

```bash
docker compose up -d --build
```

- Frontend (built React app served by nginx): `http://localhost:80`
- PocketBase API + admin UI: `http://localhost:8090`

The frontend image bakes `VITE_POCKETBASE_URL` in at build time (Vite env vars are static once bundled). Override it via a `VITE_POCKETBASE_URL` environment variable before building if PocketBase is reachable at a different URL for end users (e.g. a public domain instead of `localhost`):

```bash
VITE_POCKETBASE_URL=https://api.example.com docker compose up -d --build
```

Stop everything with `docker compose down`.

## Backend schema changes

PocketBase migrations live in `backend/pb_migrations/` and custom server-side logic in `backend/pb_hooks/`. Both are copied into the image at build time, so rebuild the `pocketbase` service (`docker compose up -d --build pocketbase`) after changing either.
