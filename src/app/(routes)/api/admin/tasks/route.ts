import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminService } from "@/services/admin.service";

export async function POST(request: NextRequest) {
    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ success: false, message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const res = await AdminService.taskQueueList(session.accessToken, {
        page: body.page,
        limit: body.limit,
        status: body.status,
        q: body.q,
    });
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
