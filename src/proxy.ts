import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtService } from "@/services/jwt.service";

const GUEST_ONLY_ROUTES = ["/login", "/register", "/reset-passwd", "/verify-otp"];
const PROTECTED_ROUTES = ["/home", "/dashboard", "/scan", "/reports", "/details", "/profile"];

function redirectTo(path: string, request: NextRequest, clearCookie = false) {
    const response = NextResponse.redirect(new URL(path, request.url));
    if (clearCookie) response.cookies.delete("access_token");
    return response;
}

function matchesAny(pathname: string, routes: string[]) {
    return routes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname === "/logout") {
        return redirectTo("/login", request, true);
    }

    // OAuth flow endpoints are always reachable.
    if (pathname.startsWith("/auth/callback")) {
        return NextResponse.next();
    }

    const token = request.cookies.get("access_token")?.value;
    const payload = token ? jwtService.verify(token) : null;
    const authenticated = !!payload?.token && payload?.type === "login_success";

    // Public landing page: logged-in users go straight to the dashboard.
    if (pathname === "/") {
        return authenticated ? redirectTo("/dashboard", request) : NextResponse.next();
    }

    if (!authenticated) {
        if (matchesAny(pathname, PROTECTED_ROUTES)) {
            return redirectTo("/login", request, !!token);
        }
        return NextResponse.next();
    }

    // Authenticated: bounce off guest-only pages.
    if (matchesAny(pathname, GUEST_ONLY_ROUTES)) {
        return redirectTo("/dashboard", request);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/logout",
        "/login",
        "/register",
        "/reset-passwd",
        "/verify-otp",
        "/auth/callback",
        "/dashboard/:path*",
        "/home/:path*",
        "/details/:path*",
        "/scan/:path*",
        "/reports/:path*",
        "/profile/:path*",
    ],
};
