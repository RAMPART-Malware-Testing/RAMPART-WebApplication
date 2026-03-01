# 📤 คู่มือการใช้งานระบบอัพโหลดไฟล์

## 🎯 ภาพรวมระบบ

ระบบอัพโหลดไฟล์ถูกออกแบบให้รองรับ:
- ✅ อัพโหลดไฟล์ขนาดใหญ่สูงสุด 1GB
- ✅ การส่งข้อมูลแบบ chunked (1MB per chunk)
- ✅ แสดง progress bar แบบ real-time
- ✅ รองรับหลายไฟล์พร้อมกัน
- ✅ Drag & Drop interface

## 📁 โครงสร้างไฟล์

```
src/
├── services/
│   └── uploadService.ts          # Service สำหรับจัดการการอัพโหลด
├── app/
│   ├── api/
│   │   └── upload/
│   │       └── route.ts          # API Route สำหรับ proxy ไปยัง FastAPI
│   └── (pages)/
│       └── scan/
│           └── page.tsx          # หน้า UI สำหรับอัพโหลดและสแกนไฟล์
```

## 🚀 วิธีการใช้งาน

### 1. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` หรือแก้ไขไฟล์ `.env`:

```bash
SERVER_URL=http://localhost:8006
```

### 2. เริ่มต้น FastAPI Backend

```bash
cd path/to/fastapi-server
python app.py
```

Server จะรันที่: `http://localhost:8006`

### 3. เริ่มต้น Next.js Frontend

```bash
npm install
npm run dev
```

Frontend จะรันที่: `http://localhost:3000`

### 4. เข้าใช้งานหน้าอัพโหลด

เปิดเบราว์เซอร์และไปที่: `http://localhost:3000/scan`

## 🔧 Upload Service API

### การใช้งาน Upload Service

```typescript
import { UploadService } from '@/services/uploadService';

// อัพโหลดไฟล์เดียว
const response = await UploadService.uploadFile(file, {
  accessToken: 'your-token',
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
  }
});

// อัพโหลดหลายไฟล์
const responses = await UploadService.uploadMultipleFiles(files, options);

// Validate ขนาดไฟล์
const isValid = UploadService.validateFileSize(file, 1); // 1GB

// Validate ประเภทไฟล์
const isAllowed = UploadService.validateFileExtension(file, ['.exe', '.pdf']);

// Format ขนาดไฟล์
const size = UploadService.formatFileSize(1024000); // "1000 KB"
```

### Response Format

```typescript
{
  success: true,
  file_id: "uuid-string",
  filename: "example.exe",
  file_path: "Files/files/uuid.exe",
  size_bytes: 1048576
}
```

## 🎨 UI Features

### 1. Drag & Drop
- ลากไฟล์จาก File Explorer วางลงในพื้นที่อัพโหลด
- รองรับหลายไฟล์พร้อมกัน

### 2. Progress Tracking
- แสดง progress bar แบบ real-time
- แสดงเปอร์เซ็นต์การอัพโหลด
- แสดงสถานะ: uploading → analyzing → completed

### 3. File Validation
- ตรวจสอบขนาดไฟล์สูงสุด 1GB
- ตรวจสอบประเภทไฟล์ที่อนุญาต
- แสดง error message กรณีไฟล์ไม่ถูกต้อง

### 4. Analysis Modes
- **Quick Scan**: วิเคราะห์ด่วน 2-3 นาที
- **Deep Scan**: วิเคราะห์ละเอียด 10-15 นาที

## 📋 ไฟล์ที่รองรับ

```
Executables: .exe, .dll, .msi
Mobile: .apk, .jar
Documents: .pdf, .doc, .docx, .xls, .xlsx
Scripts: .ps1, .bat, .cmd, .vbs, .js
Archives: .zip, .rar, .7z, .tar, .gz
```

## 🔐 Security Features

1. **File Size Limit**: จำกัดขนาดไฟล์ 1GB
2. **File Type Validation**: ตรวจสอบประเภทไฟล์
3. **Chunked Upload**: ส่งข้อมูลเป็น chunks ป้องกัน timeout
4. **Error Handling**: จัดการ error ทุกขั้นตอน

## 🐛 การแก้ไขปัญหา

### ปัญหา: ไฟล์อัพโหลดไม่สำเร็จ

1. ตรวจสอบว่า FastAPI server รันอยู่
2. ตรวจสอบ `SERVER_URL` ใน `.env`
3. ตรวจสอบ Console สำหรับ error messages
4. ตรวจสอบว่าไฟล์ไม่เกิน 1GB

### ปัญหา: CORS Error

แก้ไขใน FastAPI server:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # เพิ่ม origin ของ frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### ปัญหา: Progress ไม่แสดง

ตรวจสอบว่าใช้ `UploadService.uploadFile` พร้อม `onProgress` callback

## 💡 Tips

1. **ใช้ Access Token**: ส่ง accessToken เพื่อ authentication
2. **Handle Errors**: ใช้ try-catch และแสดง error ให้ผู้ใช้เห็น
3. **Show Progress**: ใช้ onProgress callback เพื่อ UX ที่ดี
4. **Validate First**: Validate ไฟล์ก่อนอัพโหลดเพื่อประหยัดเวลา

## 📝 ตัวอย่างการใช้งานเต็มรูปแบบ

```typescript
const handleUpload = async (file: File) => {
  try {
    // Validate
    if (!UploadService.validateFileSize(file, 1)) {
      alert('ไฟล์ใหญ่เกินไป');
      return;
    }

    // Upload
    const response = await UploadService.uploadFile(file, {
      accessToken: localStorage.getItem('accessToken'),
      onProgress: (progress) => {
        console.log(`Uploading: ${progress.percentage}%`);
        setProgress(progress.percentage);
      }
    });

    console.log('Upload success:', response);

  } catch (error) {
    console.error('Upload failed:', error);
    alert('อัพโหลดล้มเหลว');
  }
};
```

## 🎓 เอกสารเพิ่มเติม

- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [FastAPI File Upload](https://fastapi.tiangolo.com/tutorial/request-files/)
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

---

Made with ❤️ for RAMPART-AI Project
