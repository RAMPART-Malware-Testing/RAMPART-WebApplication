import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AnalyService } from '@/services/analy.server';
import { jwtService } from '@/services/jwt.service';

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json() as Omit<AnalysisHistoryParams, 'token'>

    const params: AnalysisHistoryParams = {
      ...body,
      token: verify.token,
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