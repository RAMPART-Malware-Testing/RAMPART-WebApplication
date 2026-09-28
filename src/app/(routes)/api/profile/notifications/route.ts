import { NextRequest, NextResponse } from "next/server";
import { ProfileService } from "@/services/profile.service";
import { requireSession, unauthorizedResponse } from "@/lib/session";

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (!session) {
        return unauthorizedResponse();
    }

    const body = await request.json().catch(() => ({}));
    const res = await ProfileService.notificationCounts(
        session.accessToken,
        typeof body.reports_since === "string" ? body.reports_since : null,
        typeof body.public_since === "string" ? body.public_since : null,
    );

    if (!res?.success) {
        return NextResponse.json({ success: false, data: { reports: 0, public: 0 } });
    }

    return NextResponse.json({ success: true, data: res.data });
}
