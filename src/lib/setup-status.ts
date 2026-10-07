
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

export async function needsFirstRunSetup(): Promise<boolean | null> {
    return fetchNeedsSetup();
}

export function invalidateSetupStatusCache() {
    cached = null;
}