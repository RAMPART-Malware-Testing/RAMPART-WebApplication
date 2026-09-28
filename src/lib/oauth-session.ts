import type { NextResponse } from "next/server";
import axios from "axios";
import { jwtService } from "@/services/jwt.service";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

async function fetchProfile(accessToken: string): Promise<RampartUser | null> {
    try {
        const { data } = await axios.post(`${SERVER_URL}/api/profile`, { token: accessToken });
        if (data?.success && data?.data) return data.data;
    } catch {}
    return null;
}

export async function applyOAuthSession(
    response: NextResponse,
    accessToken: string,
    deviceToken?: string | null,
) {
    const profile = await fetchProfile(accessToken);

    const wrapped = jwtService.sign(
        { token: accessToken, type: "session", data: profile ?? ({ role: "user" } as RampartUser) },
        "7d",
    );
    response.cookies.set("access_token", wrapped, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
    });

    if (deviceToken) {
        const wrappedDevice = jwtService.sign({ deviceToken, type: "device" }, "7d");
        response.cookies.set("deviceToken", wrappedDevice, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: SESSION_MAX_AGE,
        });
    }
}
