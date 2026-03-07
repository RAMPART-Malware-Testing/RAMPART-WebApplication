import { authService } from '@/services/auth.service'
import { jwtService } from '@/services/jwt.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, recaptchaToken } = await request.json()
    // Verify reCAPTCHA
    // const recaptchaResponse = await fetch(
    //   `https://www.google.com/recaptcha/api/siteverify`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //     },
    //     body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
    //   }
    // )

    // const recaptchaData = await recaptchaResponse.json()

    // if (!recaptchaData.success) {
    //   return NextResponse.json(
    //     { message: 'reCAPTCHA verification failed' },
    //     { status: 400 }
    //   )
    // }

    const res = await authService.resetPassword({email})
    console.log("reset-passwd ==> ",res)
    
    if (res.success) {
      const response = NextResponse.json({ message: res.message || "ส่ง OTP สำเร็จ", success: true });

      const jwtPayload = await jwtService.sign({
        token:res.data.token,
        type: "reset_password_confirm",
      },"5m");

      response.cookies.set("access_token", jwtPayload, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      return response;
    }

    return NextResponse.json(
      { message: res.data?.message || res.message || "", success: false },
    );
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { message: 'Internal server error', success: false },
    )
  }
}