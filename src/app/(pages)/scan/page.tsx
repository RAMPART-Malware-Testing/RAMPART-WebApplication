'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios, { AxiosError } from 'axios'
import NavbarComponent from '@/components/NavbarComponent'
import Image from "next/image";
import HistoryFileComponent from '@/components/HistoryFileComponent'

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
      <div className="flex flex-row items-center max-w-6xl mx-auto mt-10 gap-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="relative">
            {/* Gradient background with blur effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-100/50 via-cyan-100/50 to-blue-100/50 rounded-3xl blur-2xl opacity-70"></div>

            {/* Main card with outer shadow - now clickable */}
            <div
              onClick={() => !(file?.status === 'uploading' || file?.status === 'analyzing') && fileInputRef.current?.click()}
              className={`
      relative bg-white p-8 rounded-2xl text-center border border-gray-100 
      shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] 
      transition-all duration-300 cursor-pointer
      ${file?.status === 'analyzing' ? 'opacity-70' : 'hover:shadow-[0_25px_45px_-15px_rgba(0,0,0,0.3)] hover:scale-[1.02]'}
      ${file?.status === 'uploading' || file?.status === 'analyzing' ? 'cursor-not-allowed' : 'cursor-pointer group'}
    `}
            >
              {/* Click hint - shows on hover */}
              {!(file?.status === 'uploading' || file?.status === 'analyzing') && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    คลิกเพื่ออัปโหลด
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <div className="relative w-44 h-44 lg:w-84 lg:h-84">
                  <Image
                    src="/logo_none_white.png"
                    alt="RAMPART Security"
                    fill
                    className="object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)] transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                  {file?.status === 'analyzing' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm ">
                      <div className="relative">
                        {/* Pulsing circles animation */}
                        <div className="absolute inset-0 rounded-full animate-ping bg-red-400/20"></div>
                        <div className="absolute inset-2 rounded-full animate-pulse bg-red-400/30"></div>

                        {/* Main spinner */}
                        <div className="relative w-20 h-20">
                          <div className="absolute inset-0 rounded-full border-4 border-red-200"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin"></div>

                          {/* Inner content */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                          </div>
                        </div>

                        {/* Text bubble */}
                        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-bounce">
                            🔍 กำลังสแกนความปลอดภัย...
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <h1 className={`
      mb-8 text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-black bg-clip-text tracking-tight 
      drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-300
      ${file?.status === 'analyzing' ? 'opacity-50' : 'group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:bg-clip-text'}
    `}>
                RAMPART
              </h1>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                className="hidden"
              />

              {/* Optional: Show hint text when not uploading/analyzing */}
              {!(file?.status === 'uploading' || file?.status === 'analyzing') && (
                <div className="mt-4 text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  คลิกที่ใดก็ได้เพื่อเลือกไฟล์
                </div>
              )}
            </div>
          </div>

          {file && (
            <div className="relative group">
              {/* Background glow effect */}
              <div className={`absolute -inset-1 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${file.status === 'completed' ? 'bg-green-500/20' :
                file.status === 'failed' ? 'bg-red-500/20' :
                  file.status === 'analyzing' ? 'bg-yellow-500/20' :
                    'bg-blue-500/20'
                }`}></div>

              <div className={`relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm p-6 rounded-xl space-y-4 border transition-all duration-300 ${file.status === 'completed' ? 'border-green-500/30 shadow-lg shadow-green-500/10' :
                file.status === 'failed' ? 'border-red-500/30 shadow-lg shadow-red-500/10' :
                  file.status === 'analyzing' ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/10 animate-pulse' :
                    'border-blue-500/30 shadow-lg shadow-blue-500/10'
                }`}>

                {/* Header with icon and filename */}
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${file.status === 'completed' ? 'bg-green-500/20' :
                    file.status === 'failed' ? 'bg-red-500/20' :
                      file.status === 'analyzing' ? 'bg-yellow-500/20' :
                        'bg-blue-500/20'
                    }`}>
                    {file.status === 'completed' && (
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {file.status === 'failed' && (
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {file.status === 'analyzing' && (
                      <svg className="w-5 h-5 text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    {file.status === 'uploading' && (
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="text-white font-medium truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 group-hover:bg-clip-text transition-all duration-300">
                      {file.name}
                    </div>
                    <div className="text-xs text-blue-200/50 flex items-center gap-2 mt-1">
                      <span>📦 {(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span className={`capitalize ${file.status === 'completed' ? 'text-green-400' :
                        file.status === 'failed' ? 'text-red-400' :
                          file.status === 'analyzing' ? 'text-yellow-400' :
                            'text-blue-400'
                        }`}>
                        {file.status === 'uploading' ? '⏫ กำลังอัปโหลด' :
                          file.status === 'analyzing' ? '🔍 กำลังวิเคราะห์' :
                            file.status === 'completed' ? '✅ เสร็จสิ้น' :
                              file.status === 'failed' ? '❌ ล้มเหลว' : file.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Uploading progress */}
                {file.status === 'uploading' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-cyan-400 flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        กำลังอัปโหลด...
                      </span>
                      <span className="text-cyan-400 font-mono">{file.progress}%</span>
                    </div>
                    <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analyzing status with animation */}
                {file.status === 'analyzing' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-yellow-400 font-medium">กำลังสแกนไฟล์</div>
                        <div className="text-xs text-yellow-400/70">กำลังตรวจสอบความปลอดภัย กรุณารอสักครู่...</div>
                      </div>
                    </div>

                    {/* Scanning animation */}
                    <div className="relative h-1 bg-gray-700 rounded overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 animate-scan"></div>
                    </div>

                    {/* Scanning dots */}
                    <div className="flex gap-1 justify-center">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed status */}
                {file.status === 'completed' && file.taskId && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-green-400 bg-green-500/10 p-3 rounded-lg">
                      <div className="relative">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="absolute inset-0 rounded-full animate-ping bg-green-500/20"></div>
                      </div>
                      <span className="font-medium">วิเคราะห์เสร็จสิ้น</span>
                    </div>

                    <button
                      onClick={() => router.push(`/reports/${file.taskId}`)}
                      className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        ดูผลการวิเคราะห์
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-green-600 to-green-700 transition-transform duration-300"></div>
                    </button>
                  </div>
                )}

                {/* Failed status */}
                {file.status === 'failed' && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">!</div>
                        <div className="absolute inset-0 rounded-full animate-ping bg-red-500/20"></div>
                      </div>
                      <span className="font-medium text-red-400">การวิเคราะห์ล้มเหลว</span>
                    </div>

                    <div className="text-sm text-red-300 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                      {file.error || 'ไม่สามารถวิเคราะห์ไฟล์ได้ กรุณาลองใหม่อีกครั้ง'}
                    </div>

                    <button
                      onClick={handleRetry}
                      className="group relative w-full overflow-hidden rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-4 py-2 text-red-300 text-sm font-medium transition-all duration-300"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        ลองใหม่อีกครั้ง
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add custom keyframes for animations */}
        <style jsx>{`
          @keyframes shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes scan {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .animate-shine {
            animation: shine 2s infinite;
          }
          
          .animate-scan {
            animation: scan 1.5s ease-in-out infinite;
          }
        `}
        </style>
        <HistoryFileComponent />
      </div>


    </div>
  )
}