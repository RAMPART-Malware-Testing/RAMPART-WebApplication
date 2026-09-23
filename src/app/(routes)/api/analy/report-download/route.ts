import { NextRequest, NextResponse } from "next/server";
import { requireSession, unauthorizedResponse } from "@/lib/session";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";

// Same format the backend enforces (analysis_controller.FILENAME_REGEX) —
// validate before forwarding so the path segment stays a plain file name.
const REPORT_FILE_RE = /^(virustotal|mobsf|cape|rampartai)-[a-fA-F0-9]{32}\.json$/;

export async function GET(request: NextRequest) {
    const session = await requireSession();
    if (!session) {
        return unauthorizedResponse();
    }

    const file = request.nextUrl.searchParams.get("file") || "";
    if (!REPORT_FILE_RE.test(file)) {
        return NextResponse.json({ success: false, message: "Invalid file name" }, { status: 400 });
    }

    const upstream = await fetch(`${SERVER_URL}/api/analy/v1/download/report/${file}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
        return NextResponse.json(
            { success: false, message: upstream.status === 403 ? "Access denied" : "Report not found" },
            { status: upstream.status },
        );
    }

    return new NextResponse(upstream.body, {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="${file}"`,
            "Cache-Control": "no-store",
        },
    });
}
