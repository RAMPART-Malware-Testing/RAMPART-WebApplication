import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ProfileService } from "@/services/profile.service";
import { jwtService } from "@/services/jwt.service";

export async function GET(request: NextRequest) {
    const cookie = await cookies();
    const token = cookie.get("access_token");
    if (!token) return NextResponse.json({ success: false, message: "No access token found" }, { status: 401 });

    const verify = jwtService.verify(token.value);
    if (!verify?.token) return NextResponse.json({ success: false, message: "No access token found" }, { status: 401 });

    const res = await ProfileService.getProfile(verify.token);
    if (!res?.success) return NextResponse.json(res, { status: 401 });

    return NextResponse.json({ success: true, data: res.data });
}

export async function PATCH(request: NextRequest) {
    const cookie = await cookies();
    const token = cookie.get("access_token");
    if (!token) return NextResponse.json({ success: false, message: "No access token found" }, { status: 401 });

    const verify = jwtService.verify(token.value);
    if (!verify?.token) return NextResponse.json({ success: false, message: "No access token found" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const username = body.username;

    const res = await ProfileService.updateUsername(verify.token, username);
    if (!res?.success) return NextResponse.json(res);

    return NextResponse.json({ success: true, data: res.data, message: res.message });
}
