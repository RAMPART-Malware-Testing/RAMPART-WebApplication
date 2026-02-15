import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/libs/jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8006';

// const axios = require('axios');
// const FormData = require('form-data');
// const fs = require('fs');
// let data = new FormData();
// data.append('file', fs.createReadStream('/home/passapol/Downloads/APK/TrickMo/d0d4ef735a8bf076d81a6f3651d6bcfd8c69285049add2e6b6bee1276a99c37c.apk'));

// let config = {
//   method: 'post',
//   maxBodyLength: Infinity,
//   url: 'http://localhost:8006/api/analy/upload',
//   headers: { 
//     'X-Access-Token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyYW1wYXJ0IiwidHlwZSI6ImFjY2VzcyIsImV4cCI6MTc3MTA3OTM1NiwiaWF0IjoxNzcwNDc0NTU2fQ.CkKv25xzXuErJ98_wZI9FimChRA3F6ltyawHIpicLkc', 
//     ...data.getHeaders()
//   },
//   data : data
// };

// axios.request(config)
// .then((response) => {
//   console.log(JSON.stringify(response.data));
// })
// .catch((error) => {
//   console.log(error);
// });


export async function POST(request: NextRequest) {
  try {
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
    if (verifiedPayload.type !== "login_success") {
      const response = NextResponse.json({
        success: false,
        message: "Access token type is not valid for OTP verification",
      });
      response.cookies.delete("access_token");
      return response;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (1GB max)
    const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1 GB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 1 GB limit' },
        { status: 413 }
      );
    }

    const response = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      headers: {
        "X-Access-Token": token.value,
      },
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: responseData.detail || 'Upload failed' },
        { status: response.status }
      );
    }


    console.log('Upload response:', responseData);

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);

    // Handle axios error
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.detail || error.message || 'Upload failed';

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: statusCode }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
