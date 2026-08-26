import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtService } from "@/services/jwt.service";

// Pages that only make sense for a logged-out visitor. A signed-in user
// hitting these gets bounced to /dashboard instead.
const GUEST_ONLY_ROUTES = ["/login", "/register", "/reset-passwd", "/verify-otp"];

// Pages that require a valid session. Anonymous visitors get bounced to
// /login (their original destination is not preserved - matches previous
// behavior).
const PROTECTED_ROUTES = ["/home", "/dashboard", "/scan", "/details", "/profile", "/reports", "/admin"];

// Pages that additionally require an admin or master role. Checked from the
// already-signature-verified session cookie payload (payload.data.role) -
// this is a UX-layer gate only (OWASP defense in depth): the backend
// re-verifies role from a fresh DB read on every /api/admin/* call
// regardless of what this cookie claims, so a stale/forged claim here can
// never actually grant access, only cause a premature redirect at worst.
const ROLE_PROTECTED_ROUTES: { prefix: string; roles: Array<"admin" | "master"> }[] = [
    { prefix: "/admin", roles: ["admin", "master"] },
];

function redirect(path: string, request: NextRequest, clearCookie = false) {
    const response = NextResponse.redirect(new URL(path, request.url));
    if (clearCookie) response.cookies.delete("access_token");
    return response;
}

function matchesAny(pathname: string, routes: string[]) {
    return routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

// Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts`
// (export function proxy(), same signature/behavior as before).
// See: https://nextjs.org/docs/messages/middleware-to-proxy
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("access_token")?.value;
    const payload = token ? jwtService.verify(token) : null;
    const isLoggedIn = payload?.type === "session" && !!payload.token;

    if (pathname.startsWith("/logout")) {
        return redirect("/login", request, true);
    }

    // "/" is public but redirects an already-signed-in user straight to the
    // dashboard instead of showing the marketing landing page again.
    if (pathname === "/") {
        if (isLoggedIn) return redirect("/dashboard", request);
        return NextResponse.next();
    }

    if (matchesAny(pathname, PROTECTED_ROUTES)) {
        if (!isLoggedIn) return redirect("/login", request, !!token);

        const roleGate = ROLE_PROTECTED_ROUTES.find((r) => matchesAny(pathname, [r.prefix]));
        if (roleGate) {
            const role = payload?.data?.role;
            if (!role || !roleGate.roles.includes(role as "admin" | "master")) {
                return redirect("/dashboard", request);
            }
        }

        return NextResponse.next();
    }

    if (matchesAny(pathname, GUEST_ONLY_ROUTES)) {
        if (isLoggedIn) return redirect("/dashboard", request);
        return NextResponse.next();
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
        "/dashboard/:path*",
        "/home/:path*",
        "/details/:path*",
        "/scan/:path*",
        "/profile/:path*",
        "/reports/:path*",
        "/admin/:path*",
    ],
};
