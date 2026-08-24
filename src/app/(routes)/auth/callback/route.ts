import { NextRequest, NextResponse } from "next/server";
import { jwtService } from "@/services/jwt.service";

// This route is hit after the FastAPI backend finishes the OAuth dance and
// 302-redirects the browser to /auth/callback?access_token=...&expires_in=...
// (see backend controller/oauth_controller.py). We persist the backend access
// JWT (wrapped in our own signed cookie so every existing proxy route can keep
// reading verify.token) and then land the user in the app.
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const accessToken = searchParams.get("access_token");
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error || !accessToken) {
        const base = new URL("/login", request.url);
        if (error) base.searchParams.set("error", error);
        if (message) base.searchParams.set("message", message);
        return NextResponse.redirect(base);
    }

    const wrapped = jwtService.sign(
        { token: accessToken, type: "login_success" },
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
    return response;
}
