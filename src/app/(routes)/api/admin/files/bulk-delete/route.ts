import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminService } from "@/services/admin.service";

export async function POST(request: NextRequest) {
    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ success: false, status: "INSUFFICIENT_ROLE", message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body.aids) || body.aids.length === 0) {
        return NextResponse.json({ success: false, status: "INVALID_ROLE_TARGET", message: "aids is required" }, { status: 400 });
    }
    if (!body.reason || typeof body.reason !== "string") {
        return NextResponse.json({ success: false, status: "INVALID_ROLE_TARGET", message: "reason is required" }, { status: 400 });
    }

    const res = await AdminService.bulkDeleteFiles(session.accessToken, body.aids, body.reason);
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
