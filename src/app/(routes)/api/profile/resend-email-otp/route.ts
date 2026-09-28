import { NextResponse } from "next/server";
import { ProfileService } from "@/services/profile.service";
import { requireSession, unauthorizedResponse } from "@/lib/session";

export async function POST() {
    const session = await requireSession();
    if (!session) {
        return unauthorizedResponse();
    }

    const res = await ProfileService.resendEmailOtp(session.accessToken);
    return NextResponse.json(res);
}
