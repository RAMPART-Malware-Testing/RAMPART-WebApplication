import { NextRequest, NextResponse } from 'next/server';
import { AnalyService } from '@/services/analy.server';
import { requireSession, unauthorizedResponse } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const res = await AnalyService.generateToken(session.accessToken);

    if (!res?.success || !res?.data?.upload_token) {
      return NextResponse.json(
        { success: false, message: 'Failed to generate upload token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      upload_token: res.data.upload_token,
      expires_in: res.data.expires_in
    }, { status: 200 });

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
