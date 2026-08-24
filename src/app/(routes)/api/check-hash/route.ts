import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AnalyService } from '@/services/analy.server';
import { jwtService } from '@/services/jwt.service';

/**
 * Lets the client hash a file locally (SHA-256, Web Crypto API) and ask
 * "has this content already been analyzed?" before uploading any bytes.
 * On a hit, the caller can skip straight to showing the existing/finished
 * analysis instead of re-uploading and re-running every tool.
 */
export async function POST(request: NextRequest) {
  try {
    const cookie = await cookies();
    const token = cookie.get('access_token');
    if (!token) {
      return NextResponse.json({ message: 'No access token found', success: false }, { status: 401 });
    }

    const verify = await jwtService.verify(token.value);
    if (!verify?.token) {
      return NextResponse.json({ message: 'No access token found', success: false }, { status: 401 });
    }

    const { sha256, file_name, file_size, privacy } = await request.json();
    if (!sha256 || typeof sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(sha256)) {
      return NextResponse.json({ success: false, message: 'Invalid sha256 hash' }, { status: 400 });
    }
    if (!file_name || typeof file_name !== 'string') {
      return NextResponse.json({ success: false, message: 'file_name is required' }, { status: 400 });
    }

    const res = await AnalyService.checkHash(
      verify.token,
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
