import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminService } from "@/services/admin.service";

export async function POST(request: NextRequest) {
    const session = await requireAdminSession();
    if (!session || session.role !== "master") {
        return NextResponse.json({ success: false, status: "INSUFFICIENT_ROLE", message: "เฉพาะ master เท่านั้นที่เปลี่ยน role ได้" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (!body.target_uid || typeof body.target_uid !== "string") {
        return NextResponse.json({ success: false, status: "INVALID_ROLE_TARGET", message: "target_uid is required" }, { status: 400 });
    }
    if (body.new_role !== "user" && body.new_role !== "admin") {
        return NextResponse.json({ success: false, status: "INVALID_ROLE_TARGET", message: "new_role must be 'user' or 'admin'" }, { status: 400 });
    }

    const res = await AdminService.changeRole(session.accessToken, body.target_uid, body.new_role);
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
