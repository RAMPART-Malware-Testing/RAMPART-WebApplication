import { NextRequest, NextResponse } from "next/server";
import { ProfileService } from "@/services/profile.service";
import { requireSession, refreshSessionCookie, unauthorizedResponse } from "@/lib/session";

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (!session) {
        return unauthorizedResponse();
    }

    const body = await request.json().catch(() => ({}));
    if (!body.otp_token || !body.otp) {
        return NextResponse.json({ success: false, message: "ข้อมูลไม่ครบถ้วน" });
    }

    const res = await ProfileService.confirmEmail(session.accessToken, body.otp_token, body.otp);
    const response = NextResponse.json(res);
    if (res?.success && res.data) {
        refreshSessionCookie(response, session.accessToken, res.data as RampartUser, session.remainingSeconds);
    }
    return response;
}
