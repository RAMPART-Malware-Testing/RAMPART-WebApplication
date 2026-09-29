import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtService } from "@/services/jwt.service";
import { appUrl } from "@/lib/app-url";

const GUEST_ONLY_ROUTES = ["/login", "/register", "/reset-passwd", "/verify-otp"];

const PROTECTED_ROUTES = ["/home", "/dashboard", "/scan", "/details", "/profile", "/reports", "/admin", "/setup"];

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
async function fetchFreshProfile(accessToken: string): Promise<{ role?: string; must_setup?: boolean } | null> {
    try {
        const serverUrl = process.env.SERVER_URL || "http://localhost:8006";
        const res = await fetch(`${serverUrl}/api/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: accessToken }),
        });
        if (!res.ok) return null;
        const body = await res.json();
        if (!body?.success || !body?.data) return null;
        return { role: body.data.role, must_setup: body.data.must_setup === true };
    } catch {
        return null;
    }
}

function withRefreshedSession(payload: { token?: string; data?: RampartUser }, fresh: Partial<RampartUser>) {
    const response = NextResponse.next();
    const refreshed = jwtService.sign(
        {
            token: payload.token,
            type: "session",
            data: { ...payload.data, ...fresh } as RampartUser,
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

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("access_token")?.value;
    const payload = token ? jwtService.verify(token) : null;
    const isLoggedIn = payload?.type === "session" && !!payload.token;

    if (pathname.startsWith("/logout")) {
        return redirect("/login", request, true);
    }

    if (pathname === "/") {
        if (isLoggedIn) return redirect("/dashboard", request);
        return NextResponse.next();
    }

    if (matchesAny(pathname, PROTECTED_ROUTES)) {
        if (!isLoggedIn) return redirect("/login", request, !!token);

        let setupPending = payload?.data?.must_setup === true;
        let freshProfile: { role?: string; must_setup?: boolean } | null = null;
        if (setupPending) {
            freshProfile = await fetchFreshProfile(payload!.token as string);
            if (freshProfile) {
                setupPending = freshProfile.must_setup === true;
            }
        }
        if (!setupPending && pathname === "/setup") {
            return redirect("/dashboard", request);
        }
        if (setupPending && pathname !== "/setup") {
            return redirect("/setup", request);
        }
        if (freshProfile && !setupPending) {
            return withRefreshedSession(payload!, {
                role: freshProfile.role as RampartUser["role"],
                must_setup: false,
            });
        }

        const roleGate = ROLE_PROTECTED_ROUTES.find((r) => matchesAny(pathname, [r.prefix]));
        if (roleGate) {
            const cookieRole = payload?.data?.role;
            if (cookieRole && roleGate.roles.includes(cookieRole as "admin" | "master")) {
                return NextResponse.next();
            }

            const freshProfile = await fetchFreshProfile(payload!.token as string);
            const freshRole = freshProfile?.role ?? null;
            if (freshRole && roleGate.roles.includes(freshRole as "admin" | "master")) {
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

            return redirect("/dashboard", request);
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
        "/setup/:path*",
        "/setup",
        "/admin/:path*",
    ],
};
