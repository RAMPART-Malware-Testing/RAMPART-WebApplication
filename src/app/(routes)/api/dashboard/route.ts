import { DashboardService } from "@/services/dashboard.service";
import { jwtService } from "@/services/jwt.service";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const cookie = await cookies();
    const token = cookie.get("access_token");
    if (!token) return NextResponse.json(
        { message: 'No access token found', success: false },
        { status: 401 }
    );

    const verify = await jwtService.verify(token.value)
    if (!verify?.token) return NextResponse.json(
        { message: 'No access token found', success: false },
        { status: 401 }
    );
    const res = await DashboardService.summary(verify.token || "");
    // Backend returns the raw summary dict (no `success` wrapper), and the
    // dashboard page reads totalFiles/userFiles/etc directly off the body.
    return NextResponse.json(res)
}