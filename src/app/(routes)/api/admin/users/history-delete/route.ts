import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/services/admin.service";
import { requireAdminSession } from "@/lib/admin-session";

export async function POST(request: NextRequest) {
    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ success: false, status: "INSUFFICIENT_ROLE", message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
    }
    if (session.role !== "master") {
        return NextResponse.json({ success: false, status: "INSUFFICIENT_ROLE", message: "เฉพาะ master เท่านั้นที่ลบประวัติได้" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (!body.target_uid || !body.kind || !body.entry_id) {
        return NextResponse.json({ success: false, status: "INVALID_REQUEST", message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const res = await AdminService.deleteUserHistory(session.accessToken, body.target_uid, body.kind, body.entry_id);
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
