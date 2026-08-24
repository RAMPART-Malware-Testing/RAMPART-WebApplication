'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import NavbarComponent from "@/components/NavbarComponent"
import GeometricLoader from '@/components/GeometricLoader'

interface UploadedFile {
  name: string
  size: number
  status: 'uploading' | 'analyzing' | 'completed' | 'failed'
  progress: number
  privacy: boolean
  taskId?: string
  error?: string
}

interface GenerateTokenResponse {
  success: boolean
  upload_token: string
  expires_in: number
}

interface UploadResponse {
  success: boolean
  task_id: string
  message: string
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

export default function ScanFilesPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  // Privacy is set at upload time only (the backend has no endpoint to change
  // it after analysis). Default to private; public sharing can be revisited
  // once the backend exposes a post-analysis privacy update.
  const privacy = false
  const [showLoader, setShowLoader] = useState(false)
  const redirectTaskId = useRef<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  async function getUploadToken(): Promise<string> {
    const res = await axios.post<GenerateTokenResponse>('/api/generate-token', {}, {
      withCredentials: true
    })
    if (!res.data.success || !res.data.upload_token) {
      throw new Error('ไม่สามารถสร้าง upload token ได้')
    }
    return res.data.upload_token
  }

  async function uploadFile(selectedFile: File) {
    let uploadToken: string

    try {
      uploadToken = await getUploadToken()
    } catch (err) {
      setFile(prev => prev ? {
        ...prev,
        status: 'failed',
        error: err instanceof Error ? err.message : 'ไม่สามารถสร้าง token ได้'
      } : null)
      return
    }

    return new Promise<void>((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('privacy', privacy.toString())
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${SERVER_URL}/api/analy/v1/upload?token=${uploadToken}`)
      xhr.timeout = 30 * 60 * 1000

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setFile(prev => prev ? { ...prev, progress: percent } : null)
        }
      }

      xhr.onload = () => {
        try {
          const response: UploadResponse = JSON.parse(xhr.responseText)
          if (xhr.status === 200 && response.success && response.task_id) {
            setFile(prev => prev ? { ...prev, status: 'completed', progress: 100, taskId: response.task_id } : null)
            resolve()
            redirectTaskId.current = response.task_id
            setShowLoader(true)
          } else {
            throw new Error(response.message || `Server error: ${xhr.status}`)
          }
        } catch (err) {
          setFile(prev => prev ? {
            ...prev,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Upload failed'
          } : null)
          reject(err)
        }
      }

      xhr.onerror = () => {
        const error = 'Network error — ไม่สามารถเชื่อมต่อ server ได้'
        setFile(prev => prev ? { ...prev, status: 'failed', error } : null)
        reject(new Error(error))
      }

      xhr.ontimeout = () => {
        const error = 'Upload timeout — ไฟล์ใช้เวลานานเกินไป'
        setFile(prev => prev ? { ...prev, status: 'failed', error } : null)
        reject(new Error(error))
      }

      xhr.send(formData)
    })
  }

  const startUpload = (selectedFile: File) => {
    if (!selectedFile) return
    if (selectedFile.size > 1024 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกิน 1GB')
      return
    }
    setFile({ name: selectedFile.name, size: selectedFile.size, status: 'uploading', progress: 0, privacy })
    uploadFile(selectedFile)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    e.target.value = ''
    startUpload(selectedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const selectedFile = e.dataTransfer.files?.[0]
    if (selectedFile) startUpload(selectedFile)
  }

  const handleRetry = () => {
    setFile(null)
    setTimeout(() => fileInputRef.current?.click(), 100)
  }

  const busy = file?.status === 'uploading' || file?.status === 'analyzing'

  return (
    <div className="min-h-screen bg-[#050510]">
      <NavbarComponent />
      <div className="max-w-2xl mx-auto mt-8 px-4 sm:px-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">สแกนไฟล์</h1>
          <p className="text-slate-400 text-sm mt-1">อัปโหลดไฟล์เพื่อวิเคราะห์มัลแวร์ด้วยเครื่องมือหลายตัว</p>
        </div>

          {/* Dropzone */}
          <div
            onClick={() => !busy && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`
              relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300
              ${busy
                ? 'border-white/10 bg-white/[0.02] cursor-not-allowed'
                : isDragging
                  ? 'border-purple-400 bg-purple-500/10 scale-[1.01] cursor-pointer'
                  : 'border-white/15 bg-white/[0.03] hover:border-purple-400/60 hover:bg-white/[0.05] cursor-pointer'}
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              className="hidden"
            />

            {!file && (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-xl shadow-purple-500/20">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className="text-white font-medium">
                  {isDragging ? 'วางไฟล์ที่นี่' : 'คลิกหรือลากไฟล์มาวางที่นี่'}
                </p>
                <p className="text-slate-400 text-sm">รองรับไฟล์ทุกประเภท สูงสุด 1GB</p>

                <button
                  type="button"
                  disabled={busy}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  เลือกไฟล์
                </button>
              </div>
            )}

            {file && (
              <div className="py-2 text-left">
                {/* File row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    file.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400'
                      : file.status === 'failed' ? 'bg-rose-500/15 text-rose-400'
                      : file.status === 'analyzing' ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    {file.status === 'uploading' && <i className="fas fa-cloud-upload-alt text-lg"></i>}
                    {file.status === 'analyzing' && <i className="fas fa-spinner fa-spin text-lg"></i>}
                    {file.status === 'completed' && <i className="fas fa-check-circle text-lg"></i>}
                    {file.status === 'failed' && <i className="fas fa-times-circle text-lg"></i>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{file.name}</p>
                    <p className="text-slate-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <span className={`text-xs font-medium ${
                    file.status === 'uploading' ? 'text-cyan-400'
                      : file.status === 'analyzing' ? 'text-amber-400'
                      : file.status === 'completed' ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}>
                    {file.status === 'uploading' ? `อัปโหลด ${file.progress}%`
                      : file.status === 'analyzing' ? 'กำลังวิเคราะห์'
                      : file.status === 'completed' ? 'เสร็จสิ้น'
                      : 'ล้มเหลว'}
                  </span>
                </div>

                {/* Progress bar */}
                {(file.status === 'uploading' || file.status === 'analyzing') && (
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${file.status === 'analyzing' ? 100 : file.progress}%` }}
                    />
                  </div>
                )}

                {/* Failed error + retry */}
                {file.status === 'failed' && (
                  <div className="mt-4">
                    <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                      {file.error || 'ไม่สามารถวิเคราะห์ไฟล์ได้'}
                    </p>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="mt-3 w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold transition"
                    >
                      ลองใหม่อีกครั้ง
                    </button>
                  </div>
                )}

                {/* Completed hint */}
                {file.status === 'completed' && (
                  <p className="text-sm text-emerald-300 mt-3 text-center">
                    อัปโหลดสำเร็จ — กำลังนำไปหน้าวิเคราะห์...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Privacy info */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div>
              <p className="text-white font-medium text-sm">ความเป็นส่วนตัวของรายงาน</p>
              <p className="text-slate-400 text-xs mt-0.5">ตั้งค่าเป็นส่วนตัวโดยค่าเริ่มต้น</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
              ส่วนตัว
            </span>
          </div>
        </div>

      {showLoader && (
        <GeometricLoader
          isVisible={showLoader}
          loadingText="กำลังนำไปหน้าวิเคราะห์"
          duration={1200}
          onLoadingComplete={() => {
            setShowLoader(false)
            if (redirectTaskId.current) {
              router.push(`/scan/analysis?taskId=${redirectTaskId.current}`)
            }
          }}
        />
      )}
    </div>
  )
}
