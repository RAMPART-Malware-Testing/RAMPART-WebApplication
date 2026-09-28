import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminService } from "@/services/admin.service";

export async function POST(request: NextRequest) {
    const session = await requireAdminSession();
    if (!session || session.role !== "master") {
        return NextResponse.json({ success: false, status: "INSUFFICIENT_ROLE", message: "เฉพาะ master เท่านั้นที่ตั้งค่าบัญชีนี้ได้" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (!body.email || typeof body.email !== "string") {
        return NextResponse.json({ success: false, status: "INVALID_EMAIL", message: "กรุณาระบุอีเมล Gmail" }, { status: 400 });
    }

    const res = await AdminService.masterSetupEmail(session.accessToken, body.email);
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
