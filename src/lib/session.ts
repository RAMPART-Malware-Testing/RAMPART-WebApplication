import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtService } from "@/services/jwt.service";

export interface VerifiedSession {
    accessToken: string;
    data?: RampartUser;
    remainingSeconds: number;
}

export async function requireSession(): Promise<VerifiedSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token");
    if (!token) return null;

    const payload = jwtService.verify(token.value);
    if (!payload?.token) return null;

    const remainingSeconds = payload.exp
        ? Math.max(payload.exp - Math.floor(Date.now() / 1000), 60)
        : 60 * 60 * 24 * 7;

    return {
        accessToken: payload.token as string,
        data: payload.data,
        remainingSeconds,
    };
}

export function refreshSessionCookie(
    response: NextResponse,
    accessToken: string,
    data: RampartUser,
    remainingSeconds: number,
) {
    const jwtPayload = jwtService.sign({ token: accessToken, data, type: "session" }, remainingSeconds);
    response.cookies.set("access_token", jwtPayload, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: remainingSeconds,
    });
}

export function unauthorizedResponse() {
    return NextResponse.json({ success: false, message: "No access token found" }, { status: 401 });
}
