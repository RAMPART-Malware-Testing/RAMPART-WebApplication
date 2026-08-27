import { DashboardService } from "@/services/dashboard.service";
import { requireSession, unauthorizedResponse } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (!session) {
        return unauthorizedResponse();
    }

    const res = await DashboardService.recentActivities(session.accessToken);
    if (!res.success) {
        return NextResponse.json(res)
    }
    return NextResponse.json({ success: true, data: res })
}
