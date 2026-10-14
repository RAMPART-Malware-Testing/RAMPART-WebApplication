import { NextRequest, NextResponse } from "next/server"
import { jwtService } from "@/services/jwt.service"

const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006"

export async function GET(request: NextRequest) {
  console.log("[API Config] GET request received")

  try {
    const cookieToken = request.cookies.get("access_token")?.value
    if (!cookieToken) {
      console.log("[API Config] No access_token cookie found")
      return NextResponse.json(
        { success: false, status: "UNAUTHORIZED", message: "ไม่พบ token" },
        { status: 401 }
      )
    }

    const payload = jwtService.verify(cookieToken)
    if (!payload || !payload.token) {
      console.log("[API Config] Invalid JWT or no token in payload")
      return NextResponse.json(
        { success: false, status: "UNAUTHORIZED", message: "token ไม่ถูกต้อง" },
        { status: 401 }
      )
    }

    const backendToken = payload.token
    console.log("[API Config] Extracted backend token, calling backend...")

    const res = await fetch(`${SERVER_URL}/api/admin/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: backendToken }),
    })

    const result = await res.json()
    console.log("[API Config] Backend response:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[API Config] Error:", error)
    return NextResponse.json(
      { success: false, status: "SERVER_ERROR", message: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("[API Config] POST request received")

  try {
    const cookieToken = request.cookies.get("access_token")?.value
    if (!cookieToken) {
      console.log("[API Config] No access_token cookie found")
      return NextResponse.json(
        { success: false, status: "UNAUTHORIZED", message: "ไม่พบ token" },
        { status: 401 }
      )
    }

    const payload = jwtService.verify(cookieToken)
    if (!payload || !payload.token) {
      console.log("[API Config] Invalid JWT or no token in payload")
      return NextResponse.json(
        { success: false, status: "UNAUTHORIZED", message: "token ไม่ถูกต้อง" },
        { status: 401 }
      )
    }

    const backendToken = payload.token
    const body = await request.json()
    const { key, value } = body

    console.log("[API Config] Calling backend with key:", key, "value:", value)

    const res = await fetch(`${SERVER_URL}/api/admin/config/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: backendToken, key, value }),
    })

    const result = await res.json()
    console.log("[API Config] Backend response:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API Config] Error:", error)
    return NextResponse.json(
      { success: false, status: "SERVER_ERROR", message: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ" },
      { status: 500 }
    )
  }
}
