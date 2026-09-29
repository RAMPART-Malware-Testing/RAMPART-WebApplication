import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { requireSession, unauthorizedResponse } from "@/lib/session";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileName: string }> }
) {
    const session = await requireSession();
    if (!session) {
        return unauthorizedResponse();
    }

    const { fileName } = await params;

    try {
        const res = await axios.get(
            `${SERVER_URL}/api/analy/v1/download/report/${encodeURIComponent(fileName)}`,
            {
                headers: { Authorization: `Bearer ${session.accessToken}` },
                responseType: "arraybuffer",
            }
        );
        return new NextResponse(res.data, {
            status: 200,
            headers: {
                "Content-Type": res.headers["content-type"] ?? "application/json",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status ?? 502 : 502;
        return NextResponse.json({ success: false, message: "Download failed" }, { status });
    }
}
