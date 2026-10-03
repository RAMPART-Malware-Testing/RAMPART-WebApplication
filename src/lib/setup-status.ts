/**
 * One place that answers "does this installation still need its first master
 * account?", shared by the middleware (`src/proxy.ts`) and the `/api/setup/status`
 * route handler.
 *
 * Two things make this more than a one-line fetch:
 *
 * - **Caching.** Both callers run on nearly every guest navigation. A 5-second
 *   cache collapses that into one backend call per 5 seconds per process.
 * - **Failing open.** If the backend is unreachable the answer is `null`, not
 *   `true`. `null` means "don't know", and every caller treats it as "show the
 *   login page". Guessing `true` would strand a healthy installation on the
 *   setup page for as long as the API is down.
 */

const CACHE_TTL_MS = 5000;

let cached: { value: boolean | null; expiresAt: number } | null = null;

async function fetchNeedsSetup(): Promise<boolean | null> {
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const serverUrl = process.env.SERVER_URL || "http://localhost:8006";
    try {
        const res = await fetch(`${serverUrl}/api/auth/setup/status`, {
            method: "GET",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return null;
        const body = await res.json();
        if (!body?.success || typeof body?.data?.needs_setup !== "boolean") return null;
        const value = body.data.needs_setup as boolean;
        cached = { value, expiresAt: Date.now() + CACHE_TTL_MS };
        return value;
    } catch {
        return null;
    }
}

/** `true` = no user exists yet, `false` = setup done, `null` = unknown. */
export async function needsFirstRunSetup(): Promise<boolean | null> {
    return fetchNeedsSetup();
}

/** Called after a successful setup so the next navigation doesn't re-ask. */
export function invalidateSetupStatusCache() {
    cached = null;
}