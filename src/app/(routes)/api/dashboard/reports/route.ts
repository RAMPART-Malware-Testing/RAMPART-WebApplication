import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";
    const res = await axios.post(`${SERVER_URL}/api/analy/v1/dashboard/reports`, {
        page: body.page || 1,
        limit: body.limit || 10,
        created_at: -1,
    });
    return NextResponse.json(res.data);
}