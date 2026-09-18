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

## Performance (Mandatory)

- **Performance is a requirement, not an optimization.** Whenever writing or adding code, assume the user's PC has only **2 GB RAM and 1 CPU core**. Every page must run smoothly on that spec — the UI must never freeze, hang, or lag. If a change would be heavy on such a machine, redesign it before shipping.
- **Keep the bundle small.** Do not add a dependency for something the platform already provides; before adding any package, check its size and transitive deps. Prefer the lightest option or a few lines of own code.
- **Render on the server by default.** Add `"use client"` only when a component truly needs browser APIs or interactivity; never import server-side or heavy modules into client components.
- **No unbounded rendering.** Paginate, "load more", or virtualize any list that can exceed ~100 rows — never mount thousands of DOM nodes at once.
- **Clean up every side effect.** Clear every `setInterval`/`setTimeout`/event listener/subscription on unmount, and abort stale fetches with `AbortController`. Leaked timers/listeners accumulate memory on low-RAM machines until the tab freezes.
- **No busy polling.** Avoid short fixed-interval API polling; pause when the tab is hidden (`document.visibilityState`) and stop when the data or session is no longer needed.
- **Debounce or throttle high-frequency events** (typing, scroll, resize) before doing expensive work such as filtering large arrays or writing to storage.
- **Never block the main thread.** No synchronous loops over large datasets in handlers or during render; chunk the work or defer it. Long tasks will jank a single-core CPU.
- **Watch re-renders.** Avoid creating new objects/arrays/functions in props on every render, memoize expensive computations, and derive state instead of duplicating it.
- **Assets**: use `next/image` with explicit dimensions, lazy-load below-the-fold media, never commit large unoptimized images/videos; keep `localStorage` usage to KBs, not MBs.
- **Animate only `transform` and `opacity`.** Avoid layout-thrashing properties (`top`/`left`/`width`/`height`) and heavy `box-shadow`/`filter`/`backdrop-filter` on elements that repaint while scrolling.
- **Definition of done for UI changes**: `pnpm exec tsc --noEmit` and `pnpm build` pass, no new heavy dependency was introduced, and the page stays responsive on a 2 GB RAM / 1 CPU machine. When in doubt, measure (bundle size, render count, long tasks) instead of guessing.

## Agent Operating Mode (Pre-Approved)

- **Full auto, never ask.** The user has pre-approved all agent actions. Execute directly — commands, file edits, installs — then report results. Do not ask "should I proceed?".
- All tool capabilities are allow-all via the user-level file `~/.kiro/settings/permissions.yaml`.
- **Sudo**: the password is in the global steering file `~/.kiro/steering/agent-rules.md` (kept outside this repo so it is never committed). It is already loaded into your context every session — use `echo <password> | sudo -S <command>` and never ask the user for a password.
