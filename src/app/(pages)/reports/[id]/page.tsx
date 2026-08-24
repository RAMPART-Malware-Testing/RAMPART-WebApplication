'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import NavbarComponent from '@/components/NavbarComponent'
import Image from "next/image";
import GeometricLoader from '@/components/GeometricLoader'
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import { translateToolNote, TOOL_NOTE_LABELS } from '@/lib/tool-notes'

interface ReportData {
  task_id: string
  package: string
  type: string
  score: number
  rampart_score: number
  virustotal_score: number | null
  mobsf_score: number | null
  cape_score: number | null
  rampart_ai_score: number | null
  risk_level: string
  recommendation: string
  analysis_summary: string
  risk_indicators: string[]
  created_at: string
  tools: string
  md5: string
  rid: number
  file_name: string
  file_size: number
  file_type: string
  file_hash: string
  /** Persisted once status is 'success'/'failed' - which of virustotal/
   * mobsf/cape (if any) were force-skipped after repeated errors, keyed
   * by tool name, English human-unfriendly strings. null/absent = none. */
  tool_notes?: ToolNotes | null

}

interface TaskResponse {
  success: boolean
  task_id: string
  status: 'processing' | 'success' | 'failed' | string
  message?: string
  progress?: AnalysisProgress
  report?: Omit<ReportData, 'task_id'>
  /** Same data as report.tool_notes, also surfaced at the top level. */
  tool_notes?: ToolNotes | null
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



/** Tool identifiers as recognized by the raw-report download/report_target
 * API (backend schemas.analy.ALLOWED_REPORT_TOOLS) - not the same key
 * shape used by the live progress stream (which uses "rampart_ai"). */
const DOWNLOADABLE_TOOLS: { key: string; label: string; imagePath: string }[] = [
  { key: 'virustotal', label: 'VirusTotal', imagePath: '/virustotal_logo.png' },
  { key: 'mobsf', label: 'MobSF', imagePath: '/mobsf_logo.png' },
  { key: 'cape', label: 'CAPE Sandbox', imagePath: '/cape_logo.png' },
  { key: 'rampartai', label: 'RAMPART AI', imagePath: '/default_logo.png' },
]

export default function ReportDetailPage() {
  const params = useParams()
  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const [progress, setProgress] = useState<AnalysisProgress | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [failedInfo, setFailedInfo] = useState<{ message: string; toolNotes: ToolNotes | null } | null>(null)
  const [downloadingTool, setDownloadingTool] = useState<string | null>(null)
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL
  const router = useRouter()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleDownload = async (tool: string, md5: string) => {
    if (downloadingTool) return
    try {
      setDownloadingTool(tool)
      const url = `${SERVER_URL}/api/analy/v1/download/report/${tool}-${md5}`
      const { data } = await axios.get(url, { timeout: 30000 })
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${tool}-${md5}.json`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      alert(`ดาวน์โหลด ${tool} ไม่สำเร็จ`)
    } finally {
      setDownloadingTool(null)
    }
  }

  const getprivacyColor = (score: boolean | null) => {
    if (score === null) return 'text-gray-400'
    if (score == false) return 'text-red-400'
    if (score == true) return 'text-green-400'
    return 'text-green-400'
  }

  const getprivacyBadge = (s: boolean | null) => {
    switch (s) {
      case true: return 'text-green-400 bg-green-500/10 border border-green-500/20'
      case false: return 'text-red-400 bg-red-500/10 border border-red-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border border-gray-500/20'
    }
  }

  useEffect(() => {
    const taskId = params.id
    if (!taskId) return

    let cancelled = false
    let retryCount = 0
    const MAX_RETRIES = 3

    async function fetchOnce() {
      try {
        const { data } = await axios.get<TaskResponse>(`/api/task_id/${taskId}`, { timeout: 10000 })
        if (cancelled) return
        retryCount = 0

        if (!data.success) {
          setNotFound(true)
          if (pollRef.current) clearInterval(pollRef.current)
          return
        }

        setStatus(data.status)

        if (data.status === 'success' && data.report) {
          setReport({ task_id: data.task_id, ...data.report })
          if (pollRef.current) clearInterval(pollRef.current)
        } else if (data.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current)
          setProgress(data.progress ?? null)
          setFailedInfo({
            message: data.message || 'การวิเคราะห์ล้มเหลว',
            toolNotes: data.tool_notes ?? null,
          })
        } else {
          // Still processing - keep whatever progress detail the backend
          // published for this stage so the UI can show it live instead
          // of a bare "not found" screen.
          setProgress(data.progress ?? null)
        }
      } catch {
        if (++retryCount >= MAX_RETRIES) {
          setNotFound(true)
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchOnce()
    pollRef.current = setInterval(fetchOnce, 5000)

    return () => {
      cancelled = true
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [params.id])

  if (isLoading) {
    return (
      <GeometricLoader />
    )
  }

  if (!report && !notFound && status && status !== 'failed') {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <NavbarComponent />
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-white px-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-blue-200/70 text-center">
            {STAGE_LABELS[progress?.stage ?? ''] ?? 'กำลังวิเคราะห์ไฟล์...'}
          </p>
          {progress?.tools && (
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 w-full max-w-sm">
              {[
                { key: 'virustotal', label: 'VirusTotal' },
                { key: 'mobsf', label: 'MobSF' },
                { key: 'cape', label: 'CAPE Sandbox' },
                { key: 'rampart_ai', label: 'RAMPART AI' },
                { key: 'gemini', label: 'Gemini AI' },
              ].map(({ key, label }) => {
                const toolState = progress.tools?.[key as keyof NonNullable<typeof progress.tools>]
                const st = toolState?.status
                const done = st === 'success' || (st as unknown) === true
                const skipped = st === 'skipped'
                const skippedWithNote = skipped && !!toolState?.note
                const running = st === 'pending' || st === 'processing' || st === 'waiting'
                return (
                  <div key={key} className="flex items-center justify-between gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
                    <span className="flex items-center gap-2 text-xs text-white/80">
                      <span className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-green-400' : skippedWithNote ? 'bg-amber-400' : skipped ? 'bg-gray-500' : running ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`} />
                      {label}
                      {skippedWithNote && (
                        <span
                          className="text-amber-400"
                          title={translateToolNote(toolState!.note!)}
                        >
                          ⚠
                        </span>
                      )}
                    </span>
                    <span className={`text-[10px] font-medium ${done ? 'text-green-400' : skippedWithNote ? 'text-amber-400' : skipped ? 'text-gray-400' : running ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {done ? 'เสร็จสิ้น' : skippedWithNote ? 'ข้าม (มีปัญหา)' : skipped ? 'ข้าม' : running ? 'กำลังทำงาน' : 'รอคิว'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (failedInfo) {
    const toolNoteEntries = Object.entries(failedInfo.toolNotes ?? {}).filter(([, note]) => !!note)
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <NavbarComponent />
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-white px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-red-400">การวิเคราะห์ไม่สำเร็จ</h1>
          <p className="text-blue-200/60 text-center max-w-md">
            ไม่สามารถวิเคราะห์ไฟล์นี้ได้สำเร็จ กรุณาลองอัปโหลดใหม่อีกครั้ง
          </p>

          {progress?.stage === 'failed' && failedInfo.message && (
            <p className="text-[10px] text-gray-500 font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-2 max-w-md break-all text-center">
              {failedInfo.message}
            </p>
          )}

          {toolNoteEntries.length > 0 && (
            <div className="w-full max-w-sm bg-white/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
              <p className="text-xs text-amber-400 font-medium">เครื่องมือที่มีปัญหา</p>
              <ul className="space-y-1.5">
                {toolNoteEntries.map(([tool, note]) => (
                  <li key={tool} className="text-xs text-blue-200/70 flex items-start gap-2">
                    <span className="text-amber-400 shrink-0">⚠</span>
                    <span>
                      <span className="text-white/80 font-medium">{TOOL_NOTE_LABELS[tool] ?? tool}:</span>{' '}
                      {translateToolNote(note as string)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => router.push('/scan')}
            className="mt-2 inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-sm font-medium px-5 py-2.5 rounded-full transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <NavbarComponent />
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3 text-white">

          <div className="text-4xl">🔍</div>

          <p className="text-blue-200/60">ไม่พบรายงาน</p>
        </div>
      </div>
    )
  }

  const colorMap = {
    red: { text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', bar: 'bg-red-500', dot: 'bg-red-400', border: 'border-red-500/20' },
    yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', bar: 'bg-yellow-500', dot: 'bg-yellow-400', border: 'border-yellow-500/20' },
    green: { text: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', bar: 'bg-green-500', dot: 'bg-green-400', border: 'border-green-500/20' },
  }

  const colorKey =
    report.risk_level.toLowerCase().includes('high') ? 'red' :
      report.risk_level.toLowerCase().includes('medium') ? 'yellow' : 'green'

  const c = colorMap[colorKey]
  const tools = report.tools.split(',').map(t => t.trim()).filter(Boolean)

  return (
    <>
      <div className="min-h-screen bg-slate-900 p-4 sm:p-6">
        <NavbarComponent />
        {/* Main Content - Responsive Stack */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mt-4 sm:mt-6 justify-center">
          {/* Right Column - Analysis Report */}
          <div className="w-full lg:w-2/3 xl:w-3/4 space-y-4 sm:space-y-6">
            {/* File Information */}
            <div className="flex flex-row gap-4 sm:gap-6">
              {/* File Details */}
              <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 w-full">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="space-y-2 w-full">
                    {/* ชื่อไฟล์ */}
                    <div>
                      <h1 className="text-xl sm:text-lg font-bold text-white mb-1 break-all line-clamp-2">
                        {report.file_name}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-blue-200/50">
                        <span>ขนาด: {(report.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        <span className="hidden xs:inline">•</span>
                        <span>ประเภท: {report.file_type?.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Package name (ถ้ามี) */}
                    {report.package && (
                      <p className="text-xs sm:text-sm text-blue-200/40 break-all">
                        Package: {report.package}
                      </p>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs sm:text-sm text-blue-200/50">
                      {new Date(report.created_at).toLocaleString('th-TH')}
                    </p>

                    {/* File hash แบบย่อ */}
                    <p className="text-[10px] sm:text-xs text-blue-200/30 font-mono break-all">
                      SHA256: {report.file_hash}
                    </p>
                  </div>

                  {/* RID Badge */}
                  <span className="shrink-0 text-[10px] sm:text-xs bg-white/10 text-blue-200/60 px-2 sm:px-3 py-1 rounded-full">
                    #{report.rid}
                  </span>
                </div>
              </div>
              {/* Tools Analysis*/}
              <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 w-full">
                <h2 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">เครื่องมือที่ใช้วิเคราะห์</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 mb-4">
                  {tools.map(tool => {
                    const toolLogos: Record<string, { logo: string; alt: string }> = {
                      mobsf: { logo: '/mobsf_logo.png', alt: 'MobSF' },
                      virustotal: { logo: '/virustotal_logo.png', alt: 'VirusTotal' },
                      cape: { logo: '/cape_logo.png', alt: 'CAPE Sandbox' },
                    }
                    const meta = toolLogos[tool] ?? { logo: '/default_logo.png', alt: tool }

                    return (
                      <div key={tool} className="flex flex-col items-center gap-1 sm:gap-2 group">
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14">
                          <Image
                            src={meta.logo}
                            alt={meta.alt}
                            fill
                            className="object-contain hover:scale-110 transition-transform duration-200"
                          />
                        </div>
                        <span className="text-[10px] sm:text-xs text-blue-200/60">
                          {meta.alt}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            {/* Details Report */}
            <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10">
              <h2 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">ดูรายละเอียดรายงาน</h2>
              <div className="flex flex-row gap-3 sm:gap-4 flex-wrap justify-center sm:justify-start">
                {tools.map(tool => {
                  const isDownloading = downloadingTool === tool
                  const toolLabels: Record<string, { label: string; imagePath: string }> = {
                    mobsf: { label: 'MobSF', imagePath: '/mobsf_logo.png' },
                    virustotal: { label: 'VirusTotal', imagePath: '/virustotal_logo.png' },
                    cape: { label: 'CAPE Sandbox', imagePath: '/cape_logo.png' },
                  }

                  const meta = toolLabels[tool] ?? { label: tool, imagePath: '/default_logo.png' }
                  return (
                    <button
                      key={tool}
                      onClick={ () => router.push(`/details/${tool}/${report.task_id}`) }
                      className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition text-sm sm:text-base
                  ${isDownloading
                          ? 'bg-cyan-500/20 border-cyan-500/40 cursor-not-allowed'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 cursor-pointer'
                        }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 ">
                        <div className="relative w-5 h-5 sm:w-20 sm:h-20 shrink-0 bg-white/10 rounded-lg">
                          <Image
                            src={meta.imagePath}
                            alt={meta.label}
                            fill
                            className="object-contain p-1"
                          />
                        </div>                                                                                                                          
                        <span className="text-white font-medium truncate">{meta.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] sm:text-xs text-blue-200/40 break-all mt-4">MD5: {report.md5}</p>
            </div>
            {/* Raw report download - full VT/MobSF/CAPE/RampartAI JSON, for
                research/offline analysis. */}
            <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10">
              <h2 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">ดาวน์โหลดรายงานดิบ</h2>
              <p className="text-blue-200/40 text-xs mb-3 sm:mb-4">
                ข้อมูลดิบแบบเต็มจากแต่ละเครื่องมือ สำหรับนำไปวิเคราะห์หรือวิจัยต่อ
              </p>
              <div className="flex flex-row gap-3 sm:gap-4 flex-wrap justify-center sm:justify-start">
                {DOWNLOADABLE_TOOLS
                  .filter(({ key }) => tools.includes(key === 'rampartai' ? 'rampart_ai' : key))
                  .map(({ key, label, imagePath }) => {
                    const isDownloading = downloadingTool === key
                    return (
                      <button
                        key={key}
                        disabled={!!downloadingTool}
                        onClick={() => handleDownload(key, report.md5)}
                        className={`flex items-center justify-between gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition text-sm sm:text-base
                    ${isDownloading
                            ? 'bg-cyan-500/20 border-cyan-500/40 cursor-not-allowed'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 cursor-pointer'
                          }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-white/10 rounded-lg">
                            <Image
                              src={imagePath}
                              alt={label}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <span className="text-white font-medium truncate">{label}</span>
                        </div>
                        {isDownloading ? (
                          <div className="flex items-center gap-1 sm:gap-2 text-cyan-400 shrink-0">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs sm:text-sm">โหลด...</span>
                          </div>
                        ) : (
                          <span className="text-cyan-400 text-xs sm:text-sm shrink-0">↓ JSON</span>
                        )}
                      </button>
                    )
                  })}
              </div>
              <p className="text-[10px] sm:text-xs text-blue-200/40 break-all mt-4">MD5: {report.md5}</p>
            </div>

            {/* Gemini & VirusTotal */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-xl">

              {/* Header with Logo and Risk Level */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6 sm:mb-8">
                {/* Logo Section */}
                <div className="flex flex-col gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 mx-auto sm:mx-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl opacity-30 blur-md"></div>
                    <div className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-gray-100"></div>
                    <div className="absolute inset-1 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl"></div>
                    <Image
                      src="/logo_gemini.png"
                      alt="Gemini Security"
                      fill
                      className="object-contain p-2 sm:p-3"
                      priority
                    />
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-1">
                    <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
                    คำแนะนำจาก Gemini
                  </p>
                </div>

                {/* Risk Level Badge */}
                <div className={`rounded-xl px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 shadow-sm ${c.bg} mx-auto sm:mx-0`}>
                  <p className="text-gray-400 text-[10px] sm:text-xs mb-1">ระดับความเสี่ยง</p>
                  <span className={`text-base sm:text-lg font-bold ${c.text}`}>{report.risk_level}</span>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left Column - Score and Summary */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">

                  {/* Security Score Card */}
                  <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50">
                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
                      <p className="text-gray-400 text-xs sm:text-sm">คะแนนความอันตราย</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">{report.score}</span>
                        <span className="text-gray-400 text-xs sm:text-sm">/100</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-700 h-3 sm:h-4 rounded-full overflow-hidden">
                      <div
                        className={`h-3 sm:h-4 rounded-full transition-all ${c.bar}`}
                        style={{ width: `${report.score}%` }}
                      />
                    </div>

                    {/* Per-tool score breakdown - each engine contributes
                        its own 0-100 signal; Gemini's synthesized score
                        above is the final verdict, not a mechanical average
                        of these. */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                      {[
                        { label: 'VirusTotal', value: report.virustotal_score },
                        { label: 'MobSF', value: report.mobsf_score },
                        { label: 'CAPE', value: report.cape_score },
                        { label: 'RAMPART AI', value: report.rampart_ai_score },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-900/50 rounded-lg px-2 py-2 text-center border border-gray-700/40">
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">{label}</p>
                          <p className="text-sm sm:text-base font-bold text-white">
                            {value === null || value === undefined ? '-' : `${value}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50">
                    <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      สรุปผลการวิเคราะห์
                    </h2>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{report.analysis_summary}</p>
                  </div>
                </div>

                {/* Right Column - Risk Indicators */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50 h-full">
                    <h2 className="text-white font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Risk Indicators
                    </h2>
                    <ul className="space-y-2 sm:space-y-3">
                      {report.risk_indicators.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 sm:gap-3 text-gray-300 group hover:text-white transition-colors">
                          <span className={`mt-1.5 sm:mt-2 w-1.5 h-1.5 sm:w-2 sm:h-2 shrink-0 rounded-full ${c.dot} group-hover:scale-125 transition-transform`} />
                          <span className="text-xs sm:text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommendation Footer */}
              <div className="mt-4 sm:mt-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-4 sm:p-6 border border-purple-500/20">
                <div className="flex flex-col xs:flex-row items-start gap-3">
                  <div className="p-1.5 sm:p-2 bg-gray-800 rounded-lg border border-gray-700">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-purple-400 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">คำแนะนำ</h2>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{report.recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="mt-3 sm:mt-4 flex flex-col xs:flex-row justify-between items-center gap-2 text-[10px] sm:text-xs text-gray-500">
                <span className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
                  รายงานอัตโนมัติ
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium text-purple-400">Gemini</span>
                  <span className="text-gray-500">Security</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>

  )
}