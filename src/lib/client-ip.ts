import type { NextRequest } from "next/server";

/**
 * The original caller's address, read from the headers the proxy/edge in front
 * of Next.js sets.
 *
 * This is forwarded to the API as `x-client-ip` because the API's per-IP auth
 * rate limits would otherwise key on this server's address - collapsing every
 * user into one bucket, so 20 login attempts across the whole user base would
 * lock everyone out.
 */
export function clientIp(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        const first = forwarded.split(",")[0].trim();
        if (first) return first;
    }
    return request.headers.get("x-real-ip")?.trim() || "unknown";
}
