import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "./libs/jwt";

export function proxy(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;
    const { pathname } = request.nextUrl;

    console.log("Middleware Pathname:", pathname);   
    if (pathname.startsWith("/logout")) {
        const response = NextResponse.redirect(new URL("/auth/login", request.url));
        response.cookies.delete("access_token");
        return response;
    }
    // ถ้าเข้า /home หรือ /dashboard ต้องมี token

    if (pathname.startsWith("/auth/verify-otp")) {
        if (!token) {
            return NextResponse.redirect(new URL("/auth/login", request.url));
        }
        const payload = verifyAccessToken(token);
        console.log("Verified JWT Payload:", payload);
        if (!payload) {
            const response = NextResponse.redirect(new URL("/auth/login", request.url));
            response.cookies.delete("access_token");
            return response;
        }
        if (payload.type !== "login_confirm") {
            if (payload.type === "login_success") {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }
            const response = NextResponse.redirect(new URL("/auth/login", request.url));
            response.cookies.delete("access_token");
            return response;
        }
        return NextResponse.next();
    }
    if (
        pathname.startsWith("/home") ||
        pathname.startsWith("/dashboard")
    ) {
        if (!token) {
            return NextResponse.redirect(new URL("/auth/login", request.url));
        }

        const payload = verifyAccessToken(token);
        console.log("Verified JWT Payload:", payload);

        if (!payload) {
            // delete invalid token cookie
            const response = NextResponse.redirect(new URL("/auth/login", request.url));
            response.cookies.delete("access_token");
            return response;
        }
        if (payload.type !== "login_success") {
            if (payload.type === "login_confirm") {
                return NextResponse.redirect(new URL("/auth/verify-otp", request.url));
            }
            const response = NextResponse.redirect(new URL("/auth/login", request.url));
            response.cookies.delete("access_token");
            return response;
        }
        return NextResponse.next();
    }

    // ถ้า login แล้ว ห้ามเข้า /login หรือ /register
    if (
        pathname.startsWith("/auth/login") ||
        pathname.startsWith("/auth/register")
    ) {
        if (token) {
            return NextResponse.redirect(new URL("/home", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/logout",
        "/auth/verify-otp",
        "/dashboard/:path*",
        "/auth/login",
        "/auth/register",
    ],
};
