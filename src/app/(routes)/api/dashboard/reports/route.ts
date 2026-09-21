import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { requireSession } from "@/lib/session";

const SORT_FIELDS = ["created_at", "file_name", "file_size", "score"] as const;

const REPORTS_URL = `${process.env.SERVER_URL || "http://localhost:8006"}/api/analy/v1/dashboard/reports`;

export async function POST(request: NextRequest) {
    const session = await requireSession();
    const body = await request.json().catch(() => ({}));

    const buildPayload = (token?: string) => {
        const payload: Record<string, any> = {
            page: body.page || 1,
            limit: body.limit || 10,
            created_at: -1,
            file_name: 0,
            file_size: 0,
            score: 0,
        };

        if (token) payload.token = token;
        if (body.s) payload.s = body.s;
        if (body.status) payload.status = body.status;
        if (body.file_type) payload.file_type = body.file_type;
        if (body.score_min !== undefined) payload.score_min = body.score_min;
        if (body.score_max !== undefined) payload.score_max = body.score_max;

        if (SORT_FIELDS.includes(body.sort)) {
            payload.created_at = 0;
            payload[body.sort] = body.dir === 1 ? 1 : -1;
        }

        return payload;
    };

    let res;
    try {
        res = await axios.post(REPORTS_URL, buildPayload(session?.accessToken));
    } catch (error) {
        // A session cookie can outlive the access token it wraps. The listing is
        // public anyway, so fall back to the anonymous view instead of failing.
        if (!session || !axios.isAxiosError(error) || error.response?.status !== 401) {
            return NextResponse.json(
                { success: false, data: [], pagination: null },
                { status: axios.isAxiosError(error) ? error.response?.status ?? 500 : 500 },
            );
        }
        res = await axios.post(REPORTS_URL, buildPayload());
    }

    const data = res.data;

    // Visitors without a session get the report metadata but not the identities
    // of the people who uploaded it.
    if (!session && Array.isArray(data?.data)) {
        for (const item of data.data) delete item.uploaded_by;
    }

    return NextResponse.json(data);
}
