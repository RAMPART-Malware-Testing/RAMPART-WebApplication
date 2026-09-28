import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { requireSession, unauthorizedResponse } from "@/lib/session";

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (!session) {
        return unauthorizedResponse();
    }

    const body = await request.json().catch(() => ({}));
    if (!body.otp_token || !body.otp) {
        return NextResponse.json({ success: false, message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";
    const res = await axios.post(`${SERVER_URL}/api/profile/verify-old-email`, {
        token: session.accessToken,
        otp_token: body.otp_token,
        otp: body.otp,
    });
    return NextResponse.json(res.data);
}
