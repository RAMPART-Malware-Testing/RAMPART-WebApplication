import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { jwtService } from "@/services/jwt.service";

export async function POST(request: NextRequest) {
    const cookie = await cookies();
    const token = cookie.get("access_token");
    if (!token) return NextResponse.json({ success: false, message: "No access token found" }, { status: 401 });

    const verify = jwtService.verify(token.value);
    if (!verify?.token) return NextResponse.json({ success: false, message: "No access token found" }, { status: 401 });

    try {
        const form = await request.formData();
        const file = form.get("file");
        if (!file || typeof file === "string") {
            return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
        }

        const body = new FormData();
        body.append("file", file as Blob, (file as File).name || "avatar");
        body.append("token", verify.token);

        const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";
        const res = await axios.post(`${SERVER_URL}/api/profile/avatar`, body);

        return NextResponse.json(res.data);
    } catch (err: any) {
        const status = err?.response?.status || 500;
        return NextResponse.json(
            err?.response?.data || { success: false, message: "Internal server error" },
            { status }
        );
    }
}
