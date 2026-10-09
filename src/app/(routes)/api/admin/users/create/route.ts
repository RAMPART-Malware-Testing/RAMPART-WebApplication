import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminService } from "@/services/admin.service";

export async function POST(request: NextRequest) {
    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ success: false, status: "INSUFFICIENT_ROLE", message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
    }
    if (session.role !== "master") {
        return NextResponse.json({ success: false, status: "INSUFFICIENT_ROLE", message: "เฉพาะ master เท่านั้นที่สร้างบัญชีได้" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role;
    if (!username || !email || !password) {
        return NextResponse.json({ success: false, status: "INVALID_REQUEST", message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }
    if (role !== "user" && role !== "admin") {
        return NextResponse.json({ success: false, status: "INVALID_REQUEST", message: "สิทธิ์ไม่ถูกต้อง" }, { status: 400 });
    }

    const res = await AdminService.createUser(session.accessToken, { username, email, password, role });
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
