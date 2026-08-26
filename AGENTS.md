# RAMPART Web Application — AGENTS.md

## Code Style

- **No comments in code.** Never add inline comments, docstrings explaining behavior, or block comments — write self-explanatory code instead. This applies to every file in this repo (`.ts`, `.tsx`, `.js`, `.css`).
- Focus on writing the fix/feature code itself. Do not narrate what the code does.

## Package Manager

- Use **pnpm**: `pnpm install`

## Commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| Build | `pnpm build` |
| Start (prod) | `pnpm start` |
| Type check | `pnpm exec tsc --noEmit` |

## Architecture

- **App Router**: pages/routes live in `app/`.
- **API proxy**: `proxy.ts` (root) and `route.ts` (root) forward requests to the backend API server (`RAMPART-API-SERVERv1`, port 8006).
- **Reusable UI**: `components/`.
- **Client-side API calls**: `services/`.
- **Shared types**: `types/`.
- **Utilities**: `lib/`.

## Key Conventions

- Backend responses follow `{"success": bool, "status": str, "message": str, "data": ...}` — handle this shape consistently in `services/`.
- Backend user-facing messages are in Thai; preserve Thai copy when displaying `message` fields from API responses.
- JWT tokens are passed in the request body to the backend, not an `Authorization` header — mirror this in any new API call.
