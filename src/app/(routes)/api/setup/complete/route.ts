import { NextRequest, NextResponse } from "next/server";
import { invalidateSetupStatusCache } from "@/lib/setup-status";
import { setupService } from "@/services/setup.service";

export async function POST(request: NextRequest) {
    try {
        const { username, email, password, confirmPassword } = await request.json();

        const res = await setupService.complete({
            username,
            email,
            password,
            confirmPassword,
        });

        if (!res?.success) {
            return NextResponse.json(
                { success: false, status: res?.status, message: res?.message || "ตั้งค่าไม่สำเร็จ" },
                { status: 400 },
            );
        }

        invalidateSetupStatusCache();
        return NextResponse.json({ success: true, message: res.message }, { status: 200 });
    } catch (error) {
        console.error("First-run setup API error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}