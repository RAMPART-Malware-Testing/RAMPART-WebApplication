import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth.service';
import { jwtService } from '@/services/jwt.service';

const VALID_OTP_TYPES = ["login_confirm", "register_confirm", "reset_password_confirm"] as const;
type OtpConfirmType = typeof VALID_OTP_TYPES[number];

const OTP_REDIRECT: Record<OtpConfirmType, string> = {
  login_confirm:    "/dashboard",
  register_confirm: "/login",
  reset_password_confirm: "/login",
};

export async function POST(request: NextRequest) {
  const cookie = await cookies();
  const token = cookie.get("access_token");

  // ── 1. ตรวจสอบ access_token ──────────────────────────────────────────────
  if (!token) {
    return NextResponse.json({ success: false, message: 'No access token found' });
  }

  const payload = jwtService.verify(token.value);
  if (!payload) {
    return NextResponse.json({ success: false, message: 'Invalid or expired access token' });
  }

  // ── 2. ตรวจสอบ type ──────────────────────────────────────────────────────
  const tokenType = payload.type as OtpConfirmType;
  if (!VALID_OTP_TYPES.includes(tokenType)) {
    return NextResponse.json({ success: false, message: 'Access token type is not valid for OTP verification' });
  }

  // ── 3. ตรวจสอบ OTP ───────────────────────────────────────────────────────
  let otp: string;
  let newPasswd:string;
  try {
    const body = await request.json();
    otp = body.otp;
    newPasswd = body.newPasswd;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' });
  }

  if (!otp) {
    return NextResponse.json({ success: false, message: 'OTP is required' });
  }

  // ── 4. เรียก Service ตาม type ─────────────────────────────────────────────
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("User-Agent");

    let result: { success: boolean; message: string; data?: any; expires_in?: number };

    switch (tokenType) {
      case "login_confirm":
        result = await authService.loginConfirm(payload.token, otp, userAgent, ip);
        break;
      case "register_confirm":
        result = await authService.registerConfirm(payload.token, otp);
        break;
      case "reset_password_confirm":
        result = await authService.resetPasswordConfirm(payload.token, otp, newPasswd);
        break;
    }

    console.log(`OTP Verify [${tokenType}] : ${otp}`, result);

    // ── 5. Handle Error จาก Service ──────────────────────────────────────────
    if (!result.success) {
      if (result.message?.toLowerCase().includes("expired")) {
        cookie.delete("access_token");
        return NextResponse.json({ success: false, type: tokenType, message: 'OTP is expired. Please try again.' });
      }
      return NextResponse.json({ success: false, type: tokenType, message: result.message || 'OTP verification failed' });
    }

    // ── 6. OTP สำเร็จ ─────────────────────────────────────────────────────
    // resetpwd_confirm → ลบ token แล้วกลับ login
    if (tokenType === "reset_password_confirm") {
      cookie.delete("access_token");
      return NextResponse.json({ success: true, type: tokenType, message: 'OTP verified successfully', redirect: OTP_REDIRECT[tokenType] });
    }
    

    const newToken = jwtService.sign({ token: result.data.access_token, data:result.data.data, type: "login_success" }, result.expires_in ?? "7d");

    cookie.set("access_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: result.expires_in,
      path: "/",
    });

    return NextResponse.json({ success: true, type: tokenType, message: 'OTP verified successfully', redirect: OTP_REDIRECT[tokenType] });

  } catch (error) {
    console.error('Verify OTP API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' });
  }
}