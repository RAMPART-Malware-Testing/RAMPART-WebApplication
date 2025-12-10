import axios, { AxiosProgressEvent } from 'axios';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResponse {
  success: boolean;
  file_id: string;
  filename: string;
  file_path: string;
  size_bytes: number;
}

interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  accessToken?: string;
}

export class UploadService {
  /**
   * อัพโหลดไฟล์ไปยัง server โดยใช้ axios และ FormData
   * รองรับการแสดง progress ระหว่างอัพโหลด
   */
  static async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResponse> {
    const {
      onProgress,
      accessToken,
    } = options;

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (accessToken) {
        formData.append('accesstoken', accessToken);
      }

      // Upload to Next.js API route (not directly to FastAPI)
      const response = await axios.post<UploadResponse>('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100),
            };
            onProgress(progress);
          }
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message || 'Upload failed';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * อัพโหลดหลายไฟล์พร้อมกัน
   */
  static async uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResponse[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, options)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * ตรวจสอบขนาดไฟล์ก่อนอัพโหลด
   */
  static validateFileSize(file: File, maxSizeInGB: number = 1): boolean {
    const maxSizeInBytes = maxSizeInGB * 1024 * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  /**
   * ตรวจสอบ file extension
   */
  static validateFileExtension(
    file: File,
    allowedExtensions: string[]
  ): boolean {
    const fileName = file.name.toLowerCase();
    return allowedExtensions.some((ext) =>
      fileName.endsWith(ext.toLowerCase())
    );
  }

  /**
   * Format ขนาดไฟล์เป็น human-readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
