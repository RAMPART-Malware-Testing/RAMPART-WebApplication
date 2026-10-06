import type { NextResponse } from "next/server";
import { jwtService } from "@/services/jwt.service";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function cookieOptions(maxAge: number) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge,
    };
}

export function applyOAuthSession(
    response: NextResponse,
    accessToken: string,
    profile: RampartUser,
    deviceToken?: string | null,
): boolean {
    if (!accessToken || !profile) return false;

    response.cookies.set(
        "access_token",
        jwtService.sign({ token: accessToken, type: "session", data: profile }, "7d"),
        cookieOptions(SESSION_MAX_AGE),
    );

    if (deviceToken) {
        response.cookies.set(
            "deviceToken",
            jwtService.sign({ deviceToken, type: "device" }, "7d"),
            cookieOptions(SESSION_MAX_AGE),
        );
    }

    return true;
}