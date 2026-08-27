import { NextRequest, NextResponse } from 'next/server';
import { AnalyService } from '@/services/analy.server';
import { requireSession, unauthorizedResponse } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const body = await request.json() as Omit<AnalysisHistoryParams, 'token'>

    const params: AnalysisHistoryParams = {
      ...body,
      token: session.accessToken,
    }
    const res = await AnalyService.history(params) as AnalysisHistoryResponse

    if (!res?.success) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch history' },
        { status: 400 }
      );
    }

    return NextResponse.json(res, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
