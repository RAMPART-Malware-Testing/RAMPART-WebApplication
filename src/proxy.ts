import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtService, TokenType } from "@/services/jwt.service";

const GUEST_ONLY_ROUTES = ["/login", "/register", "/reset-passwd"];
const PROTECTED_ROUTES  = ["/home", "/dashboard", "/scan"];
const OTP_ONLY_ROUTE    = "/verify-otp";
const OTP_TYPES: TokenType[] = ["login_confirm", "register_confirm", "reset_password_confirm"];

function redirect(path: string, request: NextRequest, clearCookie = false) {
    const response = NextResponse.redirect(new URL(path, request.url));
    if (clearCookie) response.cookies.delete("access_token");
    return response;
}

function redirectToOtp(type: string, request: NextRequest) {
    const url = new URL(OTP_ONLY_ROUTE, request.url);
    url.searchParams.set("content", type);
    return NextResponse.redirect(url);
}

function matchesAny(pathname: string, routes: string[]) {
    return routes.some((r) => pathname.startsWith(r));
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("access_token")?.value;

    if (pathname === "/") {
        const payload = token ? jwtService.verify(token) : null;
        const tokenType = payload?.type as TokenType | undefined;

        if (!payload)                       return redirect("/login", request, !!token);
        if (tokenType === "login_success")  return redirect("/dashboard", request);
        if (OTP_TYPES.includes(tokenType!)) return redirectToOtp(tokenType!, request);

        return redirect("/login", request, true);
    }

    if (pathname.startsWith("/logout")) {
        return redirect("/login", request, true);
    }

    const payload = token ? jwtService.verify(token) : null;
    const tokenType = payload?.type as TokenType | undefined;
    const isOtpToken = tokenType && OTP_TYPES.includes(tokenType);

    if (!payload) {
        if (matchesAny(pathname, PROTECTED_ROUTES) || pathname.startsWith(OTP_ONLY_ROUTE)) {
            return redirect("/login", request, !!token);
        }
        if (!matchesAny(pathname, GUEST_ONLY_ROUTES)) {
            return redirect("/login", request);
        }
        return NextResponse.next();
    }

    if (isOtpToken) {
        if (!pathname.startsWith(OTP_ONLY_ROUTE)) {
            return redirectToOtp(tokenType!, request);
        }
        const contentParam = request.nextUrl.searchParams.get("content");
        if (contentParam !== tokenType) {
            return redirectToOtp(tokenType!, request); // force correct content
        }

        return NextResponse.next();
    }

    if (tokenType === "login_success") {
        if (matchesAny(pathname, GUEST_ONLY_ROUTES) || pathname.startsWith(OTP_ONLY_ROUTE)) {
            return redirect("/dashboard", request);
        }
        if (!matchesAny(pathname, PROTECTED_ROUTES)) {
            return redirect("/dashboard", request);
        }
        return NextResponse.next();
    }

    return redirect("/login", request, true);
}

export const config = {
    matcher: [
        "/",
        "/logout",
        "/login",
        "/register",
        "/reset-passwd",
        "/verify-otp",
        "/dashboard/:path*",
        "/home/:path*",
        "/scan/:path*",
    ],
};