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
    if (!res.success){
        return NextResponse.json(res)
    }
    return NextResponse.json({success:true, data:res})
}