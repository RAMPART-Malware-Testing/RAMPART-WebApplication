import { verifyAccessToken } from '@/libs/jwt';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // get access token from cookie
    const cookie = await cookies();
    const token = cookie.get("access_token");
    console.log("Access Token:", token);
    if (!token) {
      return NextResponse.json(
        { message: 'No access token found', success: false },
      )
    }

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
    
    if (verifiedPayload.type !== "login_success") {
      const response = NextResponse.json({
        success: false,
        message: "Access token type is not valid for OTP verification",
      });
      response.cookies.delete("access_token");
      return response;
    }
    return NextResponse.json({
      success: true,
      token: verifiedPayload.token,
      uri:process.env.SERVER_URL_CLIENT || 'http://localhost:8006',
      message: "Access token is valid",
    });
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { message: 'Internal server error', success: false },
    )
  }
}