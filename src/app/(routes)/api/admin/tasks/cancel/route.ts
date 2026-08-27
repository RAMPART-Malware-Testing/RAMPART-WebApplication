import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminService } from "@/services/admin.service";

export async function POST(request: NextRequest) {
    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ success: false, message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    if (!body.task_id) {
        return NextResponse.json({ success: false, message: "task_id is required" }, { status: 400 });
    }
    const res = await AdminService.taskCancel(session.accessToken, body.task_id);
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
