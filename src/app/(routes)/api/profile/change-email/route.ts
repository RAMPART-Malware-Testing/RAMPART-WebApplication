import { NextRequest, NextResponse } from "next/server";
import { ProfileService } from "@/services/profile.service";
import { requireSession, unauthorizedResponse } from "@/lib/session";

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (!session) {
        return unauthorizedResponse();
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email : "";
    if (!email.trim()) {
        return NextResponse.json({ success: false, message: "กรุณาระบุอีเมลใหม่" });
    }

    const res = await ProfileService.changeEmail(session.accessToken, email.trim());
    return NextResponse.json(res);
}
