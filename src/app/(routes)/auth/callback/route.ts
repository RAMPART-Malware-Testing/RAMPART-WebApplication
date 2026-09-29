import { NextRequest, NextResponse } from "next/server";
import { applyOAuthSession } from "@/lib/oauth-session";
import { appUrl } from "@/lib/app-url";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const accessToken = searchParams.get("access_token");
    const deviceTokenRaw = searchParams.get("device_token");
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error || !accessToken) {
        const base = appUrl(request, "/login");
        if (error) base.searchParams.set("error", error);
        if (message) base.searchParams.set("message", message);
        return NextResponse.redirect(base);
    }

    const response = NextResponse.redirect(appUrl(request, "/dashboard"));
    const ok = await applyOAuthSession(response, accessToken, deviceTokenRaw);
    if (!ok) {
        const base = appUrl(request, "/login");
        base.searchParams.set("error", "OAUTH_SESSION_FAILED");
        return NextResponse.redirect(base);
    }
    return response;
}
