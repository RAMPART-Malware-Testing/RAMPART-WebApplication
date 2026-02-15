import { signAccessToken, verifyAccessToken } from '@/libs/jwt';
import { loginServiceConfirm } from '@/services/auth.service';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // access_token
  const cookie = await cookies();
  const token = cookie.get("access_token");
  if (!token) return NextResponse.json(
    { message: 'No access token found', success: false },
  )
  console.log(token?.name + " : " + token?.value);
  const verifiedPayload = verifyAccessToken(token.value);
  console.log("Verified JWT Payload:", verifiedPayload);
  if (!verifiedPayload) {
    const response = NextResponse.json({
      success: false,
      message: "Invalid access token",
    });
    response.cookies.delete("access_token");
    return response;
  }
  if (verifiedPayload.type !== "login_confirm") {
    const response = NextResponse.json({
      success: false,
      message: "Access token type is not valid for OTP verification",
    });
    response.cookies.delete("access_token");
    return response;
  }

  
  try {
    const { otp } = await request.json()
    if (!otp) {
      return NextResponse.json(
        { message: 'OTP is required' , success: false },
      )
    }
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const result = await loginServiceConfirm(verifiedPayload.token, otp, request.headers.get("User-Agent"), ip);
    console.log(`OTP Verify : ${otp}`, result);
    if (!result.success) {
      if (result.message.includes("expired")) {
        cookie.delete("access_token");
        return NextResponse.json(
          { message: 'OTP is expired. Please login again.', success: false }
        )
      }
      return NextResponse.json(
        { message: result.message || 'OTP verification failed', success: false }
      )
    }
    // access_token, expires_in:604800
    const jwtPayload = await signAccessToken({
      token:result.access_token,
      type: "login_success",
    });
    console.log("JWT Payload:", jwtPayload);
    cookie.set("access_token", jwtPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: result.expires_in,
      path: "/",
    });
    return NextResponse.json(
      { message: 'OTP verified successfully', result, success: true },
    )
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { message: 'Internal server error', success: false },
    )
  }
}