import { NextRequest, NextResponse } from 'next/server';
import { AnalyService } from '@/services/analy.server';
import { requireSession, unauthorizedResponse } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const { sha256, file_name, file_size, privacy } = await request.json();
    if (!sha256 || typeof sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(sha256)) {
      return NextResponse.json({ success: false, message: 'Invalid sha256 hash' }, { status: 400 });
    }
    if (!file_name || typeof file_name !== 'string') {
      return NextResponse.json({ success: false, message: 'file_name is required' }, { status: 400 });
    }

    const res = await AnalyService.checkHash(
      session.accessToken,
      sha256.toLowerCase(),
      file_name,
      typeof file_size === 'number' ? file_size : 0,
      privacy !== false,
    );

    return NextResponse.json(res, { status: res?.success ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
