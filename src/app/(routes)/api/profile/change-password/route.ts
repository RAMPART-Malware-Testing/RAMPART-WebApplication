import { NextRequest, NextResponse } from "next/server";
import { ProfileService } from "@/services/profile.service";
import { requireSession, unauthorizedResponse } from "@/lib/session";
import { validatePassword } from "@/lib/password";

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (!session) {
        return unauthorizedResponse();
    }

    const body = await request.json().catch(() => ({}));
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword) {
        return NextResponse.json({ success: false, message: "กรุณากรอกรหัสผ่านปัจจุบัน" });
    }
    if (newPassword !== body.confirmPassword) {
        return NextResponse.json({ success: false, message: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน" });
    }
    const policyError = validatePassword(newPassword);
    if (policyError) {
        return NextResponse.json({ success: false, message: policyError });
    }
    if (newPassword === currentPassword) {
        return NextResponse.json({ success: false, message: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม" });
    }

    const res = await ProfileService.changePassword(session.accessToken, currentPassword, newPassword);
    return NextResponse.json(res);
}
