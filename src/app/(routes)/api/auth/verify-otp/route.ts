import { signAccessToken, verifyAccessToken } from '@/libs/jwt';
import { loginServiceConfirm, registerServiceConfirm, resetpwdServiceConfirm } from '@/services/auth.service';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server'

const VALID_OTP_TYPES = ["login_confirm", "register_confirm", "resetpwd_confirm"] as const;
type OtpConfirmType = typeof VALID_OTP_TYPES[number];

export async function POST(request: NextRequest) {
  const cookie = await cookies();
  const token = cookie.get("access_token");

  // ── 1. ตรวจสอบ access_token ──────────────────────────────────────────────
  if (!token) {
    return NextResponse.json({ success: false, message: 'No access token found' });
  }

  const verifiedPayload = verifyAccessToken(token.value);
  if (!verifiedPayload) {
    return NextResponse.json({ success: false, message: 'Invalid or expired access token' });
  }

  // ── 2. ตรวจสอบ type ──────────────────────────────────────────────────────
  const tokenType = verifiedPayload.type as OtpConfirmType;
  if (!VALID_OTP_TYPES.includes(tokenType)) {
    return NextResponse.json({
      success: false,
      message: 'Access token type is not valid for OTP verification',
    });
  }

  // ── 3. ตรวจสอบ OTP ───────────────────────────────────────────────────────
  let otp: string;
  try {
    const body = await request.json();
    otp = body.otp;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' });
  }

  if (!otp) {
    return NextResponse.json({ success: false, message: 'OTP is required' });
  }

  // ── 4. เรียก Service ตาม type ─────────────────────────────────────────────
  try {
    const ip = request.headers.get("x-forwarded-for")
      || request.headers.get("x-real-ip")
      || "unknown";
    const userAgent = request.headers.get("User-Agent");

    let result: { success: boolean; message: string; access_token?: string; expires_in?: number,redirect?: string; };

    switch (tokenType) {
      case "login_confirm":
        result = await loginServiceConfirm(verifiedPayload.token, otp, userAgent, ip);
        result.redirect = "/dashboard"
        break;
      case "register_confirm":
        result = await registerServiceConfirm(verifiedPayload.token, otp);
        result.redirect = "/auth/login"
        break;
      case "resetpwd_confirm":
        result = await resetpwdServiceConfirm(verifiedPayload.token, otp);
        result.redirect = "/auth/login"
        break;
    }

    console.log(`OTP Verify [${tokenType}] : ${otp}`, result);

    // ── 5. Handle Error จาก Service ─────────────────────────────────────────
    if (!result.success) {
      if (result.message?.toLowerCase().includes("expired")) {
        cookie.delete("access_token");
        return NextResponse.json({
          success: false,
          type: tokenType,
          message: 'OTP is expired. Please try again.',
        });
      }
      return NextResponse.json({
        success: false,
        type: tokenType,
        message: result.message || 'OTP verification failed',
      });
    }

    // ── 6. OTP สำเร็จ ─────────────────────────────────────────────────────
    // resetpwd_confirm ไม่ต้องเซ็ต session cookie เพราะยังไม่ได้ login
    if (tokenType === "resetpwd_confirm") {
      cookie.delete("access_token");
      return NextResponse.json({
        success: true,
        type: tokenType,
        message: 'OTP verified successfully',
      });
    }

    // login_confirm และ register_confirm → เซ็ต session ใหม่
    const jwtPayload = await signAccessToken({
      token: result.access_token,
      type: "login_success",
    });

    cookie.set("access_token", jwtPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: result.expires_in,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      type: tokenType,
      message: 'OTP verified successfully',
      redirect: result.redirect,
    });

  } catch (error) {
    console.error('Verify OTP API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' });
  }
}