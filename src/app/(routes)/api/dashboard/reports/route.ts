import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { requireSession, unauthorizedResponse } from "@/lib/session";

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (!session) {
        return unauthorizedResponse();
    }

    const body = await request.json().catch(() => ({}));
    const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";
    try {
        const res = await axios.post(`${SERVER_URL}/api/analy/v1/dashboard/reports`, {
            page: body.page || 1,
            limit: Math.min(body.limit || 10, 50),
            s: body.s || null,
            file_type: body.file_type || null,
            status: body.status || null,
            created_at: body.created_at ?? -1,
            file_name: body.file_name ?? 0,
            file_size: body.file_size ?? 0,
            score: body.score ?? 0,
        });
        return NextResponse.json(res.data);
    } catch {
        return NextResponse.json({ success: false, data: [], pagination: null });
    }
}
