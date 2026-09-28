import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { requireSession, unauthorizedResponse } from "@/lib/session";
import { readHistoryPage } from "@/lib/history-params";

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (!session) {
        return unauthorizedResponse();
    }

    const body = await request.json().catch(() => ({}));
    const { page, limit } = readHistoryPage(body);
    const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";
    const res = await axios.post(`${SERVER_URL}/api/profile/download-history`, {
        token: session.accessToken,
        page,
        limit,
    });
    if (!res?.data?.success) return NextResponse.json(res.data);

    return NextResponse.json({ success: true, data: res.data.data, pagination: res.data.pagination ?? null });
}
