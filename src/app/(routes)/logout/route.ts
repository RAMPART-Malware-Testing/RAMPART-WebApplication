import { NextRequest, NextResponse } from "next/server";
import { appUrl } from "@/lib/app-url";

export async function GET(request: NextRequest) {
    const response = NextResponse.redirect(appUrl(request, "/login"));
    response.cookies.delete("access_token");
    return response;
}

export async function POST(request: NextRequest) {
    const response = NextResponse.redirect(appUrl(request, "/login"));
    response.cookies.delete("access_token");
    return response;
}
