import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { jwtService } from "@/services/jwt.service";

export async function POST(request: NextRequest) {
    const cookie = await cookies();
    const token = cookie.get("access_token");
    if (!token) return NextResponse.json({ success: false, message: "No access token found" }, { status: 401 });

    const verify = jwtService.verify(token.value);
    if (!verify?.token) return NextResponse.json({ success: false, message: "No access token found" }, { status: 401 });

    const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";
    const res = await axios.post(`${SERVER_URL}/api/profile/download-history`, { token: verify.token });
    if (!res?.data?.success) return NextResponse.json(res.data);

    return NextResponse.json({ success: true, data: res.data.data });
}