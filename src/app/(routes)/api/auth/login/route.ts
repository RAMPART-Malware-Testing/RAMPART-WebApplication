import { authService } from '@/services/auth.service';
import { jwtService } from '@/services/jwt.service';
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, recaptchaToken } = await request.json()
    const userAgent = request.headers.get("user-agent");
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : "unknown";

    // Verify reCAPTCHA
    const recaptchaResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
      }
    )

    const recaptchaData = await recaptchaResponse.json()

    if (!recaptchaData.success) {
      return NextResponse.json(
        { message: 'reCAPTCHA verification failed' },
        { status: 400 }
      )
    }

    const res = await authService.login({ email, password, userAgent, ip });
    console.log(res)
    
    if (res.success) {
      const response = NextResponse.json(
        { message: "Login successful", success: true },
      );

      // if(!res.otp_required){
      //   const jwtPayload = await jwtService.sign({
      //     token:res.data.access_token,
      //     data:res.data.data,
      //     type: "login_success",
      //   });
      //   // response.cookies.set("access_token", jwtPayload, {
      //   //   httpOnly: true,
      //   //   secure: process.env.NODE_ENV === "production",
      //   //   sameSite: "lax",
      //   //   path: "/",
      //   // });
      //   return response;
      // }

      const jwtPayload = await jwtService.sign({
        token:res.data.token,
        type: "login_confirm",
      });

      response.cookies.set("access_token", jwtPayload, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });
      return response;
    }

    return NextResponse.json(
      { message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", success: false },
    );
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { message: 'Internal server error', success: false },
    )
  }
}