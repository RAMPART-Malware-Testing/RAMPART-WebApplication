import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminService } from "@/services/admin.service";

export async function POST(request: NextRequest) {
    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ success: false, status: "INSUFFICIENT_ROLE", message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
    }
    if (session.role !== "master") {
        return NextResponse.json({ success: false, status: "INSUFFICIENT_ROLE", message: "เฉพาะ master เท่านั้นที่ลบข้อมูลเก่าได้" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const months = body.months;
    if (!Number.isInteger(months) || months < 1 || months > 120) {
        return NextResponse.json({ success: false, status: "INVALID_REQUEST", message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const res = await AdminService.deleteAuditLogsOlderThan(session.accessToken, months);
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
