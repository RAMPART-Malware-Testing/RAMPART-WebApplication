import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { requireSession, unauthorizedResponse } from "@/lib/session";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const session = await requireSession();
        if (!session) {
            return unauthorizedResponse();
        }

        const body = await request.json().catch(() => ({}));
        const privacy = typeof body.privacy === "boolean" ? body.privacy : undefined;
        if (privacy === undefined) {
            return NextResponse.json({ success: false, message: "Missing privacy field" }, { status: 400 });
        }

        const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";
        const res = await axios.patch(`${SERVER_URL}/api/analy/v1/${taskId}/privacy`, {
            token: session.accessToken,
            privacy,
        });

        return NextResponse.json(res.data);
    } catch (err: any) {
        const status = err?.response?.status || 500;
        return NextResponse.json(
            err?.response?.data || { success: false, message: "Internal server error" },
            { status }
        );
    }
}
