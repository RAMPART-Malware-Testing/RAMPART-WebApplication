'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios, { AxiosError } from 'axios'
import NavbarComponent from '@/components/NavbarComponent'

interface UploadedFile {
  name: string
  size: number
  status: 'uploading' | 'analyzing' | 'completed' | 'failed'
  progress: number
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

interface ReportResponse {
  success: boolean
  task_id: string
  status: 'processing' | 'success' | 'failed'
  message: string
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

export default function ScanFilesPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()

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
            setFile(prev => prev ? {
              ...prev,
              status: 'analyzing',
              progress: 100,
              taskId: response.task_id
            } : null)
            pollAnalysisStatus(response.task_id)
            resolve()
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

  function pollAnalysisStatus(taskId: string) {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)

    let retryCount = 0
    const MAX_RETRIES = 3

    pollIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get<ReportResponse>(`/api/task_id/${taskId}`, { timeout: 10000 })
        retryCount = 0

        if (data.status === 'success') {
          clearInterval(pollIntervalRef.current!)
          setFile(prev => prev ? { ...prev, status: 'completed' } : null)
        } else if (data.status === 'failed') {
          clearInterval(pollIntervalRef.current!)
          setFile(prev => prev ? { ...prev, status: 'failed', error: data.message || 'การวิเคราะห์ล้มเหลว' } : null)
        }

      } catch (err) {
        if (++retryCount >= MAX_RETRIES) {
          clearInterval(pollIntervalRef.current!)
          const error = err instanceof AxiosError ? `เชื่อมต่อ server ไม่ได้ (${err.message})` : 'ไม่สามารถตรวจสอบสถานะได้'
          setFile(prev => prev ? { ...prev, status: 'failed', error } : null)
        }
      }
    }, 5000)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)

    if (selectedFile.size > 1024 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกิน 1GB')
      return
    }

    setFile({ name: selectedFile.name, size: selectedFile.size, status: 'uploading', progress: 0 })
    e.target.value = ''
    uploadFile(selectedFile)
  }

  const handleRetry = () => {
    setFile(null)
    setTimeout(() => fileInputRef.current?.click(), 100)
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <NavbarComponent />

      <div className="max-w-2xl mx-auto space-y-6">

        <div className="bg-white/5 p-6 rounded-xl text-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={file?.status === 'uploading' || file?.status === 'analyzing'}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded text-white font-medium transition"
          >
            เลือกไฟล์เพื่อสแกน
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" />
        </div>

        {file && (
          <div className="bg-white/5 p-6 rounded-xl space-y-4 border border-white/10">

            <div>
              <div className="text-white font-medium truncate">{file.name}</div>
              <div className="text-xs text-blue-200/50">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>

            {file.status === 'uploading' && (
              <>
                <div className="flex justify-between text-sm text-cyan-400">
                  <span>กำลังอัปโหลด...</span>
                  <span>{file.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded">
                  <div className="bg-cyan-500 h-2 rounded transition-all duration-300" style={{ width: `${file.progress}%` }} />
                </div>
              </>
            )}

            {file.status === 'analyzing' && (
              <div className="flex items-center space-x-3 text-yellow-400">
                <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">กำลังวิเคราะห์ไฟล์ กรุณารอสักครู่...</span>
              </div>
            )}

            {file.status === 'completed' && file.taskId && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs">✓</div>
                  <span>วิเคราะห์เสร็จสิ้น</span>
                </div>
                <button
                  onClick={() => router.push(`/reports/${file.taskId}`)}
                  className="w-full bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white transition"
                >
                  ดูผลการวิเคราะห์
                </button>
              </div>
            )}

            {file.status === 'failed' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 text-red-400">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs">!</div>
                  <span className="font-medium">การวิเคราะห์ล้มเหลว</span>
                </div>
                <div className="text-sm text-red-300">{file.error || 'กรุณาลองใหม่อีกครั้ง'}</div>
                <button
                  onClick={handleRetry}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-4 py-2 rounded text-red-300 text-sm transition"
                >
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}