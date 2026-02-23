import { signAccessToken } from '@/libs/jwt';
import { loginService, registerService } from '@/services/auth.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, recaptchaToken } = await request.json()
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

    const res = await registerService({ username, email, password });
    if (!res.success) return NextResponse.json({success:false, status:res.status, message:res.message || ""})

    const jwtPayload = await signAccessToken({
      token: res.token,
      type: "register_confirm",
    });

    const response = NextResponse.json(
      { 
        message:res.message || "register successful", 
        success: true,
        status:res.status
      },
    );


    // Set Access Token
    response.cookies.set("access_token", jwtPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    });
    return response;
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { message: 'Internal server error', success: false, status:404 },
    )
  }
}