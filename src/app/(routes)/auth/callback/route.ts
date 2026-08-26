import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { jwtService } from "@/services/jwt.service";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";

// Fetch the user profile so the session cookie carries `role` for the
// admin/master route gate in the middleware.
async function fetchProfile(accessToken: string) {
    try {
        const { data } = await axios.post(`${SERVER_URL}/api/profile`, { token: accessToken });
        if (data?.success && data?.data) return data.data;
    } catch { /* ignore */ }
    return null;
}

// This route is hit after the FastAPI backend finishes the OAuth dance and
// 302-redirects the browser to /auth/callback?access_token=...&expires_in=...
// (see backend controller/oauth_controller.py). We persist the backend access
// JWT (wrapped in our own signed cookie, type "session" so the middleware and
// every other proxy route can read verify.token) and then land the user in.
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const accessToken = searchParams.get("access_token");
    const deviceTokenRaw = searchParams.get("device_token");
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error || !accessToken) {
        const base = new URL("/login", request.url);
        if (error) base.searchParams.set("error", error);
        if (message) base.searchParams.set("message", message);
        return NextResponse.redirect(base);
    }

    const profile = await fetchProfile(accessToken);

    const wrapped = jwtService.sign(
        {
            token: accessToken,
            type: "session",
            data: profile || { role: "user" },
        },
        "7d"
    );

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set("access_token", wrapped, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    if (deviceTokenRaw) {
        const wrappedDevice = jwtService.sign({ deviceToken: deviceTokenRaw, type: "device" }, "7d");
        response.cookies.set("deviceToken", wrappedDevice, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });
    }

    return response;
}