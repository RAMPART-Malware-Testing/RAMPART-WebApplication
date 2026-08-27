import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { AnalyService } from '@/services/analy.server';
import { requireSession, unauthorizedResponse } from '@/lib/session';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskid: string }> }
) {
    try {
        const { taskid } = await params;

        if (!taskid) {
            return NextResponse.json(
                { success: false, message: 'Missing task_id' },
                { status: 400 }
            );

        }

        const session = await requireSession();
        if (!session) {
            return unauthorizedResponse();
        }

        const tool = request.nextUrl.searchParams.get('tool');
        if (!tool) {
            return NextResponse.json(
                { success: false, message: 'Missing tool parameter' },
                { status: 400 }
            );
        }

        const res = await AnalyService.gettask_reporttarget(taskid, session.accessToken, tool);
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
