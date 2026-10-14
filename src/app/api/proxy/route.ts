import { NextRequest, NextResponse } from "next/server"

const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, method = "POST", data } = body

    const token = request.headers.get("x-token")
    if (!token) {
      return NextResponse.json(
        { success: false, status: "UNAUTHORIZED", message: "Token not provided" },
        { status: 401 }
      )
    }

    const fullUrl = `${SERVER_URL}${url}`
    const response = await fetch(fullUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, status: "SERVER_ERROR", message: "Proxy error" },
      { status: 500 }
    )
  }
}
