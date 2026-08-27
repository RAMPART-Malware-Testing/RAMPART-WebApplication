import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminService } from "@/services/admin.service";

export async function POST(request: NextRequest) {
    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ success: false, message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (!body.subject || !body.message) {
        return NextResponse.json({ success: false, message: "subject and message are required" }, { status: 400 });
    }

    const res = await AdminService.broadcastEmail(session.accessToken, body.subject, body.message, body.target_role);
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
