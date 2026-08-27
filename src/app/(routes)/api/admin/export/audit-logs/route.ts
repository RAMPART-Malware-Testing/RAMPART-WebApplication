import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminService } from "@/services/admin.service";

export async function POST() {
    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ success: false, message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
    }
    const csv = await AdminService.exportAuditLogs(session.accessToken);
    return new NextResponse(csv, {
        status: 200,
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": "attachment; filename=audit_logs.csv",
        },
    });
}
