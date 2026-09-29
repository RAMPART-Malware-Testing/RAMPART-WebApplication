import { NextRequest, NextResponse } from "next/server";
import { applyOAuthSession } from "@/lib/oauth-session";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";
const ALLOWED_PROVIDERS = new Set(["google", "github"]);

function loginError(request: NextRequest, error: string, message?: string | null) {
    const base = new URL("/login", request.url);
    base.searchParams.set("error", error);
    if (message) base.searchParams.set("message", message);
    return NextResponse.redirect(base);
}

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
    const { provider } = await context.params;
    if (!ALLOWED_PROVIDERS.has(provider)) {
        return loginError(request, "OAUTH_PROVIDER_UNSUPPORTED");
    }

    const upstream = await fetch(
        `${SERVER_URL}/api/auth/${provider}/callback${request.nextUrl.search}`,
        {
            redirect: "manual",
            headers: {
                cookie: request.headers.get("cookie") ?? "",
                accept: "text/html",
            },
        },
    );

    const location = upstream.headers.get("location");
    if (!location) {
        return loginError(request, "OAUTH_CALLBACK_FAILED");
    }

    let target: URL;
    try {
        target = new URL(location);
    } catch {
        return loginError(request, "OAUTH_CALLBACK_FAILED");
    }

    const error = target.searchParams.get("error");
    if (error) {
        return loginError(request, error, target.searchParams.get("message"));
    }

    const accessToken = target.searchParams.get("access_token");
    if (!accessToken) {
        return loginError(request, "OAUTH_TOKEN_MISSING");
    }

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    const ok = await applyOAuthSession(response, accessToken, target.searchParams.get("device_token"));
    if (!ok) {
        return loginError(request, "OAUTH_SESSION_FAILED");
    }
    return response;
}
