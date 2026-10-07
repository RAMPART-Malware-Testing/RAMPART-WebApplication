import { NextRequest, NextResponse } from "next/server";
import { invalidateSetupStatusCache } from "@/lib/setup-status";
import { setupService } from "@/services/setup.service";
import { jwtService } from "@/services/jwt.service";

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

        const accessToken = res.data?.access_token as string | undefined;

        if (!accessToken) {
            return NextResponse.json(
                { success: true, message: res.message, redirect: "/login" },
                { status: 200 },
            );
        }

        const response = NextResponse.json(
            { success: true, message: res.message, redirect: "/dashboard" },
            { status: 200 },
        );
        const session = jwtService.sign(
            { token: accessToken, type: "session", data: res.data?.data },
            "7d",
        );
        response.cookies.set("access_token", session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        console.error("First-run setup API error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}