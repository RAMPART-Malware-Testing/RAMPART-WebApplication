import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminService } from "@/services/admin.service";

export async function POST(request: NextRequest) {
    const session = await requireAdminSession();
    if (!session || session.role !== "master") {
        return NextResponse.json({ success: false, status: "INSUFFICIENT_ROLE", message: "เฉพาะ master เท่านั้นที่ตั้งค่าบัญชีนี้ได้" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const skipOtp = body.skip_otp === true;
    if (!body.newPasswd || typeof body.newPasswd !== "string") {
        return NextResponse.json({ success: false, status: "INVALID_REQUEST", message: "กรุณาระบุรหัสผ่านใหม่" }, { status: 400 });
    }
    if (!skipOtp && (!body.otp_token || !body.otp)) {
        return NextResponse.json({ success: false, status: "INVALID_REQUEST", message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }
    if (body.newPasswd !== body.confirmPasswd) {
        return NextResponse.json({ success: false, status: "PASSWORD_MISMATCH", message: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน" });
    }

    const res = await AdminService.masterSetupConfirm(
        session.accessToken,
        skipOtp ? null : body.otp_token,
        skipOtp ? null : body.otp,
        body.newPasswd,
        skipOtp,
    );
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
