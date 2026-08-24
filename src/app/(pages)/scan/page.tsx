'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios, { AxiosError } from 'axios'
import NavbarComponent from '@/components/NavbarComponent'
import Image from "next/image";
import HistoryFileComponent from '@/components/HistoryFileComponent'
import { sha256Hex } from '@/lib/file-hash'
import { translateToolNote } from '@/lib/tool-notes'

interface UploadedFile {
  name: string
  size: number
  status: 'hashing' | 'uploading' | 'analyzing' | 'completed' | 'failed'
  progress: number
  privacy: boolean
  taskId?: string
  error?: string
  /** True when this result came from a prior identical-content analysis
   * (matched by client-side SHA-256 before any bytes were uploaded), so
   * the UI can say "already analyzed" instead of "uploading". */
  deduplicated?: boolean
  /** Live per-tool stage while status === 'analyzing'. */
  progressDetail?: AnalysisProgress | null
  /** Set once status === 'completed', if any of virustotal/mobsf/cape
   * were force-skipped due to errors/rate-limiting during this run. */
  toolNotes?: ToolNotes | null
}

const STAGE_LABELS: Record<string, string> = {
  worker: 'กำลังเริ่มกระบวนการวิเคราะห์',
  virustotal: 'กำลังตรวจสอบกับ VirusTotal',
  sandboxes: 'กำลังวิเคราะห์เชิงลึกด้วย MobSF และ CAPE Sandbox',
  rampart_ai: 'กำลังจำแนกด้วย RAMPART AI',
  gemini: 'กำลังสรุปผลด้วย Gemini AI',
  complete: 'วิเคราะห์เสร็จสิ้น',
  failed: 'การวิเคราะห์ล้มเหลว',
}

const TOOL_LABELS: { key: 'virustotal' | 'mobsf' | 'cape' | 'rampart_ai' | 'gemini'; label: string }[] = [
  { key: 'virustotal', label: 'VirusTotal' },
  { key: 'mobsf', label: 'MobSF' },
  { key: 'cape', label: 'CAPE Sandbox' },
  { key: 'rampart_ai', label: 'RAMPART AI' },
  { key: 'gemini', label: 'Gemini AI' },
]

function toolStatusMeta(status: boolean | string | undefined | null, note?: string | null) {
  if (status === true || status === 'success') {
    return { label: 'เสร็จสิ้น', color: 'text-green-400', dot: 'bg-green-400', title: undefined as string | undefined }
  }
  if (status === 'skipped') {
    if (note) {
      return { label: 'ข้าม (มีปัญหา)', color: 'text-amber-400', dot: 'bg-amber-400', title: translateToolNote(note) }
    }
    return { label: 'ข้าม (ไม่รองรับ)', color: 'text-gray-400', dot: 'bg-gray-500', title: undefined as string | undefined }
  }
  if (status === 'pending' || status === 'processing' || status === 'waiting') {
    return { label: 'กำลังดำเนินการ', color: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse', title: undefined as string | undefined }
  }
  if (status === 'failed') {
    return { label: 'ล้มเหลว', color: 'text-red-400', dot: 'bg-red-400', title: undefined as string | undefined }
  }
  return { label: 'รอคิว', color: 'text-gray-500', dot: 'bg-gray-600', title: undefined as string | undefined }
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
  progress?: AnalysisProgress
  /** Present once status is 'success'/'failed' - which of virustotal/
   * mobsf/cape (if any) were force-skipped after repeated errors. */
  tool_notes?: ToolNotes | null
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

export default function ScanFilesPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()
  const [privacy, setPrivacy] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)
  const refreshHistoryRef = useRef<(() => void) | null>(null)

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
    // Hash the file locally first (SHA-256, Web Crypto API - no bytes sent
    // yet) and ask the backend whether this exact content was already
    // analyzed. On a hit, skip the upload entirely and jump straight to
    // showing the existing/finished analysis.
    try {
      setFile(prev => prev ? { ...prev, status: 'hashing' } : null)
      const sha256 = await sha256Hex(selectedFile)
      const { data: hashCheck } = await axios.post<CheckHashResponse>('/api/check-hash', {
        sha256,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        privacy,
      })

      if (hashCheck.success && hashCheck.found && hashCheck.task_id) {
        if (hashCheck.status === 'success') {
          setFile(prev => prev ? {
            ...prev,
            status: 'completed',
            progress: 100,
            taskId: hashCheck.task_id,
            deduplicated: true,
          } : null)
          refreshHistoryRef.current?.()
          return
        }
        if (hashCheck.status !== 'failed') {
          // Already queued/processing under someone else's upload - just
          // attach to it and keep polling instead of re-uploading.
          setFile(prev => prev ? {
            ...prev,
            status: 'analyzing',
            progress: 100,
            taskId: hashCheck.task_id,
            deduplicated: true,
          } : null)
          pollAnalysisStatus(hashCheck.task_id)
          return
        }
        // status === 'failed' -> fall through to a fresh upload below.
      }
    } catch {
      // Hashing/dedup-check failures are non-fatal - fall back to a
      // normal upload rather than blocking the user entirely.
    }

    let uploadToken: string

    try {
      setFile(prev => prev ? { ...prev, status: 'uploading' } : null)
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
          setFile(prev => prev ? { ...prev, status: 'completed', progressDetail: data.progress ?? null, toolNotes: data.tool_notes ?? null } : null)
          refreshHistoryRef.current?.()
        } else if (data.status === 'failed') {
          clearInterval(pollIntervalRef.current!)
          setFile(prev => prev ? { ...prev, status: 'failed', error: data.message || 'การวิเคราะห์ล้มเหลว', progressDetail: data.progress ?? null } : null)
          refreshHistoryRef.current?.()
        } else if (data.progress) {
          setFile(prev => prev ? { ...prev, progressDetail: data.progress ?? null } : null)
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
    e.target.value = ''
    if (!selectedFile) return
    processSelectedFile(selectedFile)
  }

  const isBusy = file?.status === 'hashing' || file?.status === 'uploading' || file?.status === 'analyzing'

  const handleRetry = () => {
    setFile(null)
    setTimeout(() => fileInputRef.current?.click(), 100)
  }

  const processSelectedFile = (selectedFile: File) => {
    if (isBusy) return
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)

    if (selectedFile.size > 1024 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกิน 1GB')
      return
    }

    setFile({ name: selectedFile.name, size: selectedFile.size, status: 'hashing', progress: 0, privacy: privacy })
    uploadFile(selectedFile)
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (isBusy) return
    dragCounterRef.current += 1
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isBusy) e.dataTransfer.dropEffect = 'copy'
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
    if (dragCounterRef.current === 0) setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDragging(false)
    if (isBusy) return
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) processSelectedFile(droppedFile)
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <NavbarComponent />
      <div className="flex flex-col lg:flex-row  max-w-6xl mx-auto mt-10 gap-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="relative ">
            {/* Gradient background with blur effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-100/50 via-cyan-100/50 to-blue-100/50 rounded-3xl blur-2xl opacity-70"></div>

            {/* Main card - dropzone: click OR drag-and-drop to upload */}
            <div
              onClick={() => !isBusy && fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
      relative bg-white p-8 rounded-2xl text-center border-2
      shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)]
      transition-all duration-300
      ${isDragging
                  ? 'border-blue-500 border-dashed bg-blue-50/60 scale-[1.02] shadow-[0_25px_45px_-15px_rgba(59,130,246,0.35)]'
                  : 'border-dashed border-gray-300'}
      ${file?.status === 'analyzing' ? 'opacity-70' : !isDragging && 'hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-[0_25px_45px_-15px_rgba(0,0,0,0.3)] hover:scale-[1.02]'}
      ${isBusy ? 'cursor-not-allowed' : 'cursor-pointer group'}
    `}
            >
              {/* Privacy Switch - Top Left */}
              <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-gray-200">
                  {/* Public Option */}
                  <button
                    onClick={() => setPrivacy(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${privacy === true
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Public
                  </button>

                  {/* Private Option */}
                  <button
                    onClick={() => setPrivacy(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${privacy === false
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Private
                  </button>
                </div>
              </div>

              {/* Small brand mark - kept out of the main visual so it can't
                  be mistaken for decoration instead of an upload control. */}
              <div className="flex items-center justify-center gap-2 mb-6 opacity-70">
                <div className="relative w-6 h-6 shrink-0">
                  <Image src="/logo_none_white.png" alt="RAMPART" fill className="object-contain" priority />
                </div>
                <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">RAMPART Security Scanner</span>
              </div>

              {/* Upload icon + zone state */}
              <div className="flex justify-center mb-6">
                <div className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-blue-100 scale-110' : 'bg-blue-50 group-hover:bg-blue-100 group-hover:scale-105'
                  }`}>
                  {/* Upload cloud icon */}
                  <svg
                    className={`w-14 h-14 transition-colors duration-300 ${isDragging ? 'text-blue-600' : 'text-blue-500'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3.5 3.5M12 12l3.5 3.5" />
                  </svg>

                  {file?.status === 'analyzing' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-full">
                      <div className="relative">
                        {/* Pulsing circles animation */}
                        <div className="absolute inset-0 rounded-full animate-ping bg-red-400/20"></div>
                        <div className="absolute inset-2 rounded-full animate-pulse bg-red-400/30"></div>

                        {/* Main spinner */}
                        <div className="relative w-16 h-16">
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
                            🔍 {STAGE_LABELS[file.progressDetail?.stage ?? ''] ?? 'กำลังสแกนความปลอดภัย...'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <h1 className={`
      mb-2 text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight
      transition-all duration-300
      ${file?.status === 'analyzing' ? 'opacity-50' : ''}
      ${isDragging ? 'text-blue-600' : ''}
    `}>
                {isDragging ? 'ปล่อยไฟล์ตรงนี้เพื่ออัปโหลด' : 'ลากไฟล์มาวาง หรือคลิกเพื่ออัปโหลด'}
              </h1>
              <p className="mb-6 text-sm text-gray-400">
                รองรับไฟล์ทุกประเภท ขนาดไม่เกิน 1GB — ระบบจะวิเคราะห์ความปลอดภัยให้อัตโนมัติ
              </p>

              {/* Privacy Mode Indicator */}
              {privacy === false && (
                <div className="mb-4 inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  ส่วนตัว - เฉพาะคุณเท่านั้นที่เห็นรายงานนี้
                </div>
              )}

              {privacy === true && (
                <div className="mb-4 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  สาธารณะ - ทุกคนสามารถเห็นรายงานนี้
                </div>
              )}

              {!isBusy && (
                <div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                    className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-md shadow-blue-500/20 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-blue-500/30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    เลือกไฟล์จากเครื่อง
                  </button>
                </div>
              )}

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                className="hidden"
              />
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
                    <div className="text-xs text-blue-200/50 flex items-center gap-2 mt-1 flex-wrap">
                      <span>📦 {(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span className={`capitalize ${file.status === 'completed' ? 'text-green-400' :
                        file.status === 'failed' ? 'text-red-400' :
                          file.status === 'analyzing' ? 'text-yellow-400' :
                            'text-blue-400'
                        }`}>
                        {file.status === 'hashing' ? '🔑 กำลังตรวจสอบไฟล์ซ้ำ' :
                          file.status === 'uploading' ? '⏫ กำลังอัปโหลด' :
                            file.status === 'analyzing' ? '🔍 กำลังวิเคราะห์' :
                              file.status === 'completed' ? '✅ เสร็จสิ้น' :
                                file.status === 'failed' ? '❌ ล้มเหลว' : file.status}
                      </span>
                      {file.deduplicated && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          ไฟล์นี้เคยถูกวิเคราะห์แล้ว - ใช้ผลลัพธ์เดิม
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hashing / dedup-check progress */}
                {file.status === 'hashing' && (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin shrink-0" />
                    <div className="text-purple-300 text-sm">กำลังตรวจสอบว่าไฟล์นี้เคยถูกวิเคราะห์แล้วหรือไม่...</div>
                  </div>
                )}

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
                        <div className="text-yellow-400 font-medium">
                          {STAGE_LABELS[file.progressDetail?.stage ?? ''] ?? 'กำลังสแกนไฟล์'}
                        </div>
                        <div className="text-xs text-yellow-400/70">กำลังตรวจสอบความปลอดภัย กรุณารอสักครู่...</div>
                      </div>
                    </div>

                    {/* Scanning animation */}
                    <div className="relative h-1 bg-gray-700 rounded overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 animate-scan"></div>
                    </div>

                    {/* Per-tool stage breakdown, driven by live Redis progress
                        published from the Celery task (see /api/task_id). */}
                    {file.progressDetail?.tools && (
                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 pt-1">
                        {TOOL_LABELS.map(({ key, label }) => {
                          const toolState = file.progressDetail?.tools?.[key]
                          const meta = toolStatusMeta(toolState?.status, toolState?.note)
                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between gap-2 bg-black/20 rounded-lg px-3 py-1.5 border border-white/5"
                              title={meta.title}
                            >
                              <span className="flex items-center gap-2 text-xs text-white/80">
                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                {label}
                              </span>
                              <span className={`text-[10px] font-medium ${meta.color}`}>{meta.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

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

                    {file.toolNotes && Object.values(file.toolNotes).some(Boolean) && (
                      <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-300">
                        <span className="shrink-0">⚠</span>
                        <span>บางเครื่องมือข้ามการวิเคราะห์เนื่องจากปัญหาชั่วคราว ผลลัพธ์อาจไม่ครบถ้วน</span>
                      </div>
                    )}

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
        <HistoryFileComponent onRegisterRefresh={(fn) => { refreshHistoryRef.current = fn }} />
      </div>


    </div>
  )
}