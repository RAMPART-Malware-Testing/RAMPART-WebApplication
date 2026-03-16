import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { AnalyService } from '@/services/analy.server';
import { jwtService } from '@/services/jwt.service';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;

        if (!taskId) {
            return NextResponse.json(
                { success: false, message: 'Missing task_id' },
                { status: 400 }
            );

        }

        const cookie = await cookies();
        const token = cookie.get("access_token");
        if (!token) return NextResponse.json(
            { message: 'No access token found', success: false },
            { status: 401 }
        );

        const verify = await jwtService.verify(token.value)
        if (!verify?.token) return NextResponse.json(
            { message: 'No access token found', success: false },
            { status: 401 }
        );

        const res = await AnalyService.gettask_id(taskId, verify.token);
        console.log(res)
        return NextResponse.json(res, { status: 200 });

    } catch (error) {
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: error.response?.status ?? 500 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}