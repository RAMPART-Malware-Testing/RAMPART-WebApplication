import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminService } from "@/services/admin.service";

export async function POST(request: NextRequest) {
    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ success: false, status: "INSUFFICIENT_ROLE", message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!body.aid || typeof body.aid !== "string") {
        return NextResponse.json({ success: false, status: "INVALID_ROLE_TARGET", message: "aid is required" }, { status: 400 });
    }
    if (!reason) {
        return NextResponse.json({ success: false, status: "REASON_REQUIRED", message: "กรุณาระบุเหตุผลในการลบไฟล์" }, { status: 400 });
    }

    const res = await AdminService.deleteFile(session.accessToken, body.aid, reason);
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
