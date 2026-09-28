import { NextRequest, NextResponse } from "next/server";
import { applyOAuthSession } from "@/lib/oauth-session";

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

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    await applyOAuthSession(response, accessToken, deviceTokenRaw);
    return response;
}
