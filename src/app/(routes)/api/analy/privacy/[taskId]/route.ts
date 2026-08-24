import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { jwtService } from "@/services/jwt.service";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const cookie = await cookies();
        const token = cookie.get("access_token");
        if (!token) return NextResponse.json({ success: false, message: "No access token found" }, { status: 401 });

        const verify = jwtService.verify(token.value);
        if (!verify?.token) return NextResponse.json({ success: false, message: "No access token found" }, { status: 401 });

        const body = await request.json().catch(() => ({}));
        const privacy = typeof body.privacy === "boolean" ? body.privacy : undefined;
        if (privacy === undefined) {
            return NextResponse.json({ success: false, message: "Missing privacy field" }, { status: 400 });
        }

        const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";
        const res = await axios.patch(`${SERVER_URL}/api/analy/v1/${taskId}/privacy`, {
            token: verify.token,
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