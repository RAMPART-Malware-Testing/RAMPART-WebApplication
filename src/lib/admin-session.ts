import { cookies } from "next/headers";
import { jwtService } from "@/services/jwt.service";

/** Resolves the caller's raw backend access token AND independently
 * verifies role === "admin" | "master" straight from the (already
 * signature-verified) session cookie payload, before ever calling the
 * backend. This is defense in depth (OWASP A01), not the authoritative
 * check - the backend re-verifies role from a fresh DB read on every
 * request regardless of what this returns. Returns null if the caller is
 * not logged in or is a plain user. */
export async function requireAdminSession(): Promise<{ accessToken: string; role: "admin" | "master" } | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token");
    if (!token) return null;

    const payload = jwtService.verify(token.value);
    if (!payload?.token || !payload.data) return null;

    const role = payload.data.role;
    if (role !== "admin" && role !== "master") return null;

    return { accessToken: payload.token as string, role };
}
