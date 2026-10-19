import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtService } from "@/services/jwt.service";
import { appUrl } from "@/lib/app-url";
import { needsFirstRunSetup } from "@/lib/setup-status";

const GUEST_ONLY_ROUTES = ["/login", "/register", "/reset-passwd", "/verify-otp", "/first-run"];

const PROTECTED_ROUTES = ["/home", "/dashboard", "/scan", "/details", "/profile", "/reports", "/public", "/admin"];

const ROLE_PROTECTED_ROUTES: { prefix: string; roles: Array<"admin" | "master"> }[] = [
    { prefix: "/admin", roles: ["admin", "master"] },
];

function redirect(path: string, request: NextRequest, clearCookie = false) {
    const response = NextResponse.redirect(appUrl(request, path));
    if (clearCookie) response.cookies.delete("access_token");
    return response;
}

function matchesAny(pathname: string, routes: string[]) {
    return routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}
type ProfileCheck =
    | { state: "valid"; role?: string }
    | { state: "invalid" }
    | { state: "banned" }
    | { state: "unknown" };

const INVALID_SESSION_STATUSES = new Set([
    "TOKEN_INVALID",
    "TOKEN_EXPIRED",
    "TOKEN_WRONG_TYPE",
    "USER_NOT_FOUND",
    "ACCOUNT_INACTIVE",
]);

async function fetchFreshProfile(accessToken: string): Promise<ProfileCheck> {
    try {
        const serverUrl = process.env.SERVER_URL || "http://localhost:8006";
        const res = await fetch(`${serverUrl}/api/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: accessToken }),
        });
        const body = await res.json().catch(() => null);
        if (body?.success && body?.data) return { state: "valid", role: body.data.role };
        if (body?.status === "ACCOUNT_BANNED") return { state: "banned" };
        if (INVALID_SESSION_STATUSES.has(body?.status) || res.status === 401 || res.status === 403) {
            return { state: "invalid" };
        }
        console.error("fetchFreshProfile failed: invalid response", res.status, body);
        return { state: "unknown" };
    } catch (err) {
        console.error("fetchFreshProfile error:", err);
        return { state: "unknown" };
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("access_token")?.value;
    const payload = token ? jwtService.verify(token) : null;
    const isLoggedIn = payload?.type === "session" && !!payload.token;

    if (pathname.startsWith("/logout")) {
        return redirect("/login", request, true);
    }

    if (!isLoggedIn) {
        const needsSetup = await needsFirstRunSetup();
        if (needsSetup && pathname !== "/first-run" && !matchesAny(pathname, PROTECTED_ROUTES)) {
            return redirect("/first-run", request);
        }
        if (!needsSetup && pathname === "/first-run") {
            return redirect("/login", request);
        }
    }

    if (pathname === "/") {
        if (isLoggedIn) return redirect("/dashboard", request);
        return NextResponse.next();
    }

    if (matchesAny(pathname, PROTECTED_ROUTES)) {
        if (!isLoggedIn) return redirect("/login", request, !!token);

        const profile = await fetchFreshProfile(payload!.token as string);
        if (profile.state === "invalid") {
            return redirect("/login?error=SESSION_EXPIRED", request, true);
        }
        if (profile.state === "banned") {
            return redirect("/banned", request, true);
        }

        const roleGate = ROLE_PROTECTED_ROUTES.find((r) => matchesAny(pathname, [r.prefix]));
        if (roleGate) {
            const cookieRole = payload?.data?.role;
            const freshRole = profile.state === "valid" ? profile.role : undefined;
            const role = freshRole ?? cookieRole;
            if (role && roleGate.roles.includes(role as "admin" | "master")) {
                if (freshRole && freshRole !== cookieRole) {
                    const response = NextResponse.next();
                    const refreshed = jwtService.sign(
                        {
                            token: payload!.token,
                            type: "session",
                            data: { ...payload!.data, role: freshRole } as RampartUser,
                        },
                        "7d",
                    );
                    response.cookies.set("access_token", refreshed, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        path: "/",
                        maxAge: 60 * 60 * 24 * 7,
                    });
                    return response;
                }
                return NextResponse.next();
            }

            return redirect("/dashboard", request);
        }

        return NextResponse.next();
    }

    if (pathname.startsWith("/api/admin")) {
        if (!isLoggedIn) return NextResponse.json({ success: false, status: "UNAUTHORIZED", message: "ไม่พบ token" }, { status: 401 });

        const cookieRole = payload?.data?.role;
        if (cookieRole && (cookieRole === "admin" || cookieRole === "master")) {
            return NextResponse.next();
        }

        const profile = await fetchFreshProfile(payload!.token as string);
        if (profile.state === "invalid") {
            const response = NextResponse.json({ success: false, status: "UNAUTHORIZED", message: "เซสชันหมดอายุหรือบัญชีนี้ไม่พร้อมใช้งาน" }, { status: 401 });
            response.cookies.delete("access_token");
            return response;
        }
        const freshRole = profile.state === "valid" ? profile.role : undefined;
        if (freshRole && (freshRole === "admin" || freshRole === "master")) {
            const response = NextResponse.next();
            const refreshed = jwtService.sign(
                {
                    token: payload!.token,
                    type: "session",
                    data: { ...payload!.data, role: freshRole } as RampartUser,
                },
                "7d",
            );
            response.cookies.set("access_token", refreshed, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
            });
            return response;
        }

        return NextResponse.json({ success: false, status: "FORBIDDEN", message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
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
        "/first-run",
        "/dashboard/:path*",
        "/home/:path*",
        "/details/:path*",
        "/scan/:path*",
        "/profile/:path*",
        "/reports/:path*",
        "/public",
        "/public/:path*",
        "/admin/:path*",
        "/api/admin/:path*",
    ],
};
