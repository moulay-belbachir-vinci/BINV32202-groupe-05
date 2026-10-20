# AGENTS.md

## Project summary

Gesta is a full-stack internship management app built with a Node.js monorepo:

- Frontend: React + TypeScript + Vite in `frontend/`
- Backend: Express + TypeScript + SQLite in `backend/`
- Shared root commands via npm workspaces in the repository root

This project is intentionally incomplete in places; the documentation and tests describe the expected behavior and the missing features.

## Useful project documentation

Start with the existing project docs instead of re-documenting them here:

- [README.md](README.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/cdc_gesta_developpement.md](docs/cdc_gesta_developpement.md)
- [docs/seed.md](docs/seed.md)
- [backend/API.md](backend/API.md)

## Local setup and commands

Use Node 22.14+ (Node 24 LTS is recommended).

From the repository root:

- `npm ci`
- `npm run setup`
- `npm run dev`

Common commands:

- `npm run setup` — create `backend/.env` and initialize the database
- `npm run dev` — run backend and frontend together
- `npm run db:init` — initialize database and apply migrations
- `npm run db:reset` — rebuild database with demo data
- `npm run lint` — lint all workspaces
- `npm run typecheck` — type-check all workspaces
- `npm test` — run the automated test suite
- `npm run build` — build backend and frontend
- `npm run check` — run lint, typecheck, tests, and build

## Repository layout

- `backend/` — API, database setup, migrations, repositories/services/controllers
- `backend/src/db/` — SQLite initialization, migrations, seed scripts
- `backend/http/` — REST examples for manual API testing
- `frontend/src/` — React app, pages, components, hooks, services
- `docs/` — architecture, requirements, local setup notes, project follow-up docs

## Key conventions

- Keep the backend as the source of truth for authorization and business logic; the frontend should not be treated as the security boundary.
- Prefer the repo-root workspace commands over calling package scripts directly in subfolders unless a targeted command is clearly needed.
- SQLite is local and file-based; database files and migrations are intentionally kept in the repo structure rather than using an external DB service.
- Demo authentication is only for local development; verify that production safeguards remain in place when modifying auth or session flows.
- When changing the schema or API contract, update the relevant tests and documentation together.
- Use the existing patterns for repositories/services/controllers instead of inventing a new abstraction layer for small changes.

## Validation expectations

Before considering a task complete, run the smallest relevant validation for the changed area:

- Backend change: run the relevant backend test(s), or `npm run test -w backend`
- Frontend change: run the relevant frontend test(s), or `npm run test -w frontend`
- Cross-cutting change: run `npm run check` when the change touches shared behavior or multiple workspaces

## Notes for AI coding agents

- Favor surgical fixes and existing project conventions over broad refactors.
- Respect the demo/local-only constraints described in [README.md](README.md).
- Keep changes aligned with the architecture described in [docs/architecture.md](docs/architecture.md).
- If a change affects permissions, routes, or database initialization, check the API docs and the related tests before editing.
