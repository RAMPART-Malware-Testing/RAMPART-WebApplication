import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { AnalyService } from '@/services/analy.server';
import { jwtService } from '@/services/jwt.service';

export async function GET(
    request: NextRequest,
    { params }: { params: { taskid: string } }
) {
    try {
        const { taskid } = await params;
        console.log(taskid)

        if (!taskid) {
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
        const tool = request.nextUrl.searchParams.get('tool');
        if (!tool) {
            return NextResponse.json(
                { success: false, message: 'Missing tool parameter' },
                { status: 400 }
            );
        }

        const res = await AnalyService.gettask_reporttarget(taskid, verify.token, tool);
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