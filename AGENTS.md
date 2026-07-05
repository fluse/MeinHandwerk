# Frontend & Backend Agent Guide

This file collects the practical knowledge required to work on the React Web App (with PocketBase & Docker) without hunting through the docs or the code. Use it as a checklist before you start coding.

**Full documentation** lives under [`docs/`](https://www.google.com/search?q=docs/). Use the [doc navigation](https://www.google.com/search?q=%23doc-navigation) below to jump to the right guide.

## Commands

Quick reference for local development and Docker orchestration. 

**Crucial:** All `npm` commands MUST be executed inside the `/frontend` directory!

| Command | Directory | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `/frontend` | Starts the Vite development server for React with HMR. |
| `npm run build` | `/frontend` | Builds the React app for production. |
| `npm run lint` | `/frontend` | Runs ESLint and Prettier. |
| `docker-compose up -d` | `/` (Root) | Starts the PocketBase backend and optionally the frontend container. |
| `docker-compose down` | `/` (Root) | Stops and removes Docker containers. |

## Components & Architecture

We strictly separate the visual UI from business and data logic. Components are written in React and TypeScript.
## Monorepo Structure & Separation of Concerns

To prevent conflicts between the frontend build tools and the backend environment, this project uses a strict root-level separation. The repository is divided into two isolated main directories. 

**Never mix frontend and backend files.**
- Frontend dependencies (`package.json`, `node_modules`) only exist inside `/frontend`.
- Backend data (`pb_data`, `pb_migrations`) only exist inside `/backend`.
- Root-level is strictly reserved for orchestration (`docker-compose.yml`), global docs, and global git settings.

## Repository Map

| Path | Purpose |
| :--- | :--- |
| **`/frontend/`** | **Isolated React Application environment** |
| `/frontend/src/features/` | Feature-specific React code (Auth, Dashboard, etc.) |
| `/frontend/src/core/` | Shared UI elements, TanStack Query setup, PB instance |
| `/frontend/package.json` | Frontend dependencies and scripts (run `npm` commands here) |
| **`/backend/`** | **Isolated PocketBase environment** |
| `/backend/pb_migrations/` | PocketBase schema migrations (Go or JS) |
| `/backend/pb_hooks/` | Custom backend logic (JavaScript hooks) |
| `/backend/pb_data/` | SQLite database (ignored in git) |
| `/backend/Dockerfile` | Custom PocketBase build instructions |
| **`/` (Root)** | **Global Orchestration** |
| `/docker-compose.yml` | Connects frontend (Vite/Nginx) and backend (PocketBase) |
| `/docs/` | Global project documentation and this `AGENTS.md` |

## Domains (Folder Structure)

To prevent a massive, unmaintainable `components` folder, we organize our codebase into two main domains:

1. `src/features/`: For feature-specific implementations (e.g., `auth`, `products`, `dashboard`).
2. `src/core/`: For shared functionality, global UI elements, and PocketBase initialization.

**Strict Import Rules:**

* Features **cannot** import from other features. If two features need the same code, move it to `core/`.
* Components can only import from the same level or higher in the hierarchy (Pages -> Organisms -> Molecules -> Elements).
* Each feature module contains its own `/api`, `/components`, `/hooks`, and `/types` folders.

## PocketBase & Data Layer

* **Instance Singleton:** The PocketBase instance (`pb`) is initialized in `src/core/api/pocketbase.ts`. Import this singleton everywhere; do not instantiate `new PocketBase()` multiple times.
* **TanStack Query (React Query):** Wrap all PocketBase calls in TanStack Query hooks.
* Queries (`useQuery`) for fetching data from PocketBase collections.
* Mutations (`useMutation`) for creating, updating, or deleting records.


* **Security & Validation:**
* **API Rules (Backend):** Never trust the client. Ensure PocketBase collection API rules (RLS) are strictly defined (e.g., `id = @request.auth.id`).
* **Zod (Frontend):** Validate all form inputs using `zod` and `react-hook-form` before sending data to PocketBase.



## Docker & Infrastructure

* **Development:** We use `docker-compose.yml` to spin up the PocketBase backend. The React app is typically run locally via Node/Vite during development for faster HMR, but can also be containerized.
* **Production:** Multi-stage `Dockerfiles` are used.
* *Stage 1:* Node image builds the React app (`npm run build`).
* *Stage 2:* Nginx image serves the static React files.
* *Backend:* The official PocketBase alpine image runs the Go-based backend, utilizing an attached volume for the `pb_data` SQLite database.



## Styling & UI Guidelines

* Use our standard design system (e.g., Tailwind CSS or chosen UI library).
* Avoid inline styles.
* Avoid writing raw CSS unless absolutely necessary. Rely on utility classes or pre-built `elements`.

## Authentication

* Authentication is handled exclusively via PocketBase Auth (`pb.authStore`).
* **Session State:** Listen to `pb.authStore.onChange` to update the global React state or Router context when a user logs in or out.
* **Protected Routes:** Use a `<ProtectedRoute>` wrapper component in React Router to redirect unauthenticated users to the `/login` page.
* Logging out clears the local `pb.authStore.clear()` and immediately redirects the user.

## Boundaries & Security Standards

* **Environment Variables:** Never hardcode sensitive data or the PocketBase URL. Use `.env` files (e.g., `VITE_POCKETBASE_URL`).
* **No Third-Party Packages:** Never install additional `npm` packages on your own. You can consider new packages but must ask for approval first.
* **OWASP Top 10:** Ensure inputs are sanitized (prevent XSS) and avoid exposing raw database IDs in URLs if they are meant to be private.

## Repository Map

| Path | Content |
| --- | --- |
| `src/features/` | Feature-specific code (Auth, Profile, etc.) |
| `src/core/` | Shared UI elements, layout, PocketBase instance |
| `src/routes/` | React Router setup & protected routes |
| `docker/` | Dockerfiles and Nginx configurations |
| `pb_migrations/` | PocketBase schema migrations (Go or JS) |
| `docs/` | Full project documentation |

## Documentation & Workflow

Applies to **every** codebase update. Before you consider the work done:

1. **Review:** Check whether your changes require updates to `docs/`, `docker-compose.yml`, or the PocketBase schema.
2. **PocketBase Schema:** If you change a component that requires new database fields, explicitly state: *"I have updated the React component. You must now add the field `X` (Type: `Y`) to the PocketBase collection `Z`."*
3. **Propose First:** Ask for permission before editing architectural documentation or installing packages.