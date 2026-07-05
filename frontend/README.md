# Frontend

React + TypeScript + Vite app for the Handwerkerkalender. See the root [README](../README.md) for how this fits together with the PocketBase backend and Docker.

## Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts the Vite dev server with HMR on `http://localhost:5173`. |
| `npm run build` | Type-checks and builds the production bundle into `dist/`. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | Runs ESLint and checks formatting with Prettier. |
| `npm run format` | Formats the codebase with Prettier. |

## Environment

Copy `.env.example` to `.env` and point it at your PocketBase instance:

```
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

## Structure

- `src/core/` — shared, feature-agnostic code: the PocketBase client singleton, TanStack Query client, auth context, layout, and reusable UI elements.
- `src/features/` — one folder per feature (`auth`, `dashboard`, …), each with its own `api/`, `components/`, `hooks/`, `types/`. Features must not import from each other — shared code belongs in `core/`.
- `src/routes/` — React Router setup and the `ProtectedRoute` guard.
