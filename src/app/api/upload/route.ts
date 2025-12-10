import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8006';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const accessToken = formData.get('accesstoken') as string | null;

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

    // Create FormData for backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    if (accessToken) {
      backendFormData.append('accesstoken', accessToken);
    }

    // Forward to FastAPI backend using axios
    const response = await axios.post(`${API_URL}/api/upload`, backendFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log('Upload response:', response.data);

    return NextResponse.json(response.data, { status: 200 });
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

export const config = {
  api: {
    bodyParser: false,
  },
};
