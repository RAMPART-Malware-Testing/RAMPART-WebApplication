import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminService } from "@/services/admin.service";

export async function POST(request: NextRequest) {
    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ success: false, status: "INSUFFICIENT_ROLE", message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const res = await AdminService.listReports(session.accessToken, {
        page: body.page,
        limit: body.limit,
        q: body.q,
        risk_level: body.risk_level,
        file_type: body.file_type,
    });
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
