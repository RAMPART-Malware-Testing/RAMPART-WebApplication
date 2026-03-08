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

    const res = await AnalyService.generateToken(verify.token);

    if (!res?.success || !res?.data?.upload_token) {
      return NextResponse.json(
        { success: false, message: 'Failed to generate upload token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      token:verify.token,
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