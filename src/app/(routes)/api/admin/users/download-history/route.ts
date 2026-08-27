import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminService } from "@/services/admin.service";

export async function POST(request: NextRequest) {
    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ success: false, status: "INSUFFICIENT_ROLE", message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (!body.target_uid || typeof body.target_uid !== "string") {
        return NextResponse.json({ success: false, status: "INVALID_ROLE_TARGET", message: "target_uid is required" }, { status: 400 });
    }

    const res = await AdminService.getUserDownloadHistory(session.accessToken, body.target_uid, {
        page: body.page,
        limit: body.limit,
    });
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
