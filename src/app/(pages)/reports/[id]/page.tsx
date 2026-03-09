'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import NavbarComponent from '@/components/NavbarComponent'
import Image from "next/image";

interface ReportData {
  task_id: string
  package: string
  type: string
  score: number
  rampart_score: number
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
}

interface TaskResponse {
  success: boolean
  task_id: string
  status: 'processing' | 'success' | 'failed'
  report: Omit<ReportData, 'task_id'>
}

export default function ReportDetailPage() {
  const params = useParams()
  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingTool, setDownloadingTool] = useState<string | null>(null)
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL
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
    async function fetchReport() {
      try {
        const { data } = await axios.get<TaskResponse>(`/api/task_id/${params.id}`, { timeout: 10000 })
        console.log(data)
        if (!data.success) {
          window.location.href = '/dashboard'
        }
        if (data.success && data.status === 'success') {
          setReport({ task_id: data.task_id, ...data.report })
        }
      } catch {
        setReport(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) fetchReport()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full" />
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

  // infer color from risk_level since response has no color field
  const colorKey =
    report.risk_level.toLowerCase().includes('high') ? 'red' :
      report.risk_level.toLowerCase().includes('medium') ? 'yellow' : 'green'

  const c = colorMap[colorKey]
  const tools = report.tools.split(',').map(t => t.trim()).filter(Boolean)


  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <NavbarComponent />
      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        <div className=" w-full mr-6 bg-red">

          {/* Header details file name */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                {/* ชื่อไฟล์ */}
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1 break-all">{report.file_name}</h1>
                  <div className="flex items-center gap-2 text-sm text-blue-200/50">
                    <span>ขนาด: {(report.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>ประเภท: {report.file_type?.toUpperCase()}</span>
                  </div>
                </div>

                {/* Package name (ถ้ามี) */}
                {report.package && (
                  <p className="text-sm text-blue-200/40">
                    Package: {report.package}
                  </p>
                )}

                {/* Timestamp */}
                <p className="text-sm text-blue-200/50">
                  {new Date(report.created_at).toLocaleString('th-TH')}
                </p>

                {/* File hash แบบย่อ */}
                <p className="text-xs text-blue-200/30 font-mono">
                  SHA256: {report.file_hash?.substring(0, 20)}...
                </p>
              </div>

              {/* RID Badge */}
              <span className="shrink-0 text-xs bg-white/10 text-blue-200/60 px-3 py-1 rounded-full">
                #{report.rid}
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">เครื่องมือที่ใช้วิเคราะห์</h2>
            <div className="flex flex-wrap items-center gap-6 mb-4">
              {tools.map(tool => {
                const toolLogos: Record<string, { logo: string; alt: string }> = {
                  mobsf: {
                    logo: '/mobsf_logo.png',
                    alt: 'MobSF'
                  },
                  virustotal: {
                    logo: '/virustotal_logo.png',
                    alt: 'VirusTotal'
                  },
                  cape: {
                    logo: '/cape_logo.png',
                    alt: 'CAPE Sandbox'
                  },
                }

                const meta = toolLogos[tool] ?? {
                  logo: '/default_logo.png',
                  alt: tool
                }

                return (
                  <div
                    key={tool}
                    className="flex flex-col items-center gap-2 group"
                  >
                    {/* Logo only - no background */}
                    <div className="relative w-12 h-12 lg:w-14 lg:h-14">
                      <Image
                        src={meta.logo}
                        alt={meta.alt}
                        fill
                        className="object-contain hover:scale-110 transition-transform duration-200"
                      />
                    </div>

                    {/* Label */}
                    <span className="text-xs text-blue-200/60">
                      {meta.alt}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-blue-200/40 break-all mt-4">MD5: {report.md5}</p>
          </div>
          {/* Rampart Score */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 shadow-sm mb-6">
            <div className="flex items-center gap-3">
              {/* Rampart Logo - คงเดิมทุกประการ */}
              <div className="relative w-22 h-22 lg:w-32 lg:h-32 shrink-0">
                {/* Gemini style frame - คงสีเดิม */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl opacity-30 blur-md"></div>
                <div className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-gray-100"></div>
                <div className="absolute inset-1 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl"></div>
                <Image
                  src="/logo_none_white.png"
                  alt="Rampart Security"
                  fill
                  className="object-contain p-3 filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.05)]"
                  priority
                />
              </div>

              {/* Status Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
                    วิเคราะห์ด้วย Rampart Matching Learning
                  </p>
                  <span className="text-xs font-medium text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                    XGBoost Algorithm
                  </span>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {report.rampart_score > 50 ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
                      </div>
                      <div>
                        <span className="text-xl font-bold text-red-400">MALWARE</span>
                        <span className="text-xs text-gray-500 ml-2">(ความเสี่ยงสูง)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <span className="text-xl font-bold text-green-400">BENIGN</span>
                        <span className="text-xs text-gray-500 ml-2">(ปลอดภัย)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}


                {/* Confidence Level */}
                <div className="mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-[10px] text-gray-500">
                    XGBoost • ความมั่นใจที่จะเป็น Malware {report.rampart_score}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tools & Download */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-white font-semibold mb-4">ดาวน์โหลดรายงาน</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {tools.map(tool => {
                const isDownloading = downloadingTool === tool
                const toolLabels: Record<string, { label: string; imagePath: string }> = {
                  mobsf: {
                    label: 'MobSF',
                    imagePath: '/mobsf_logo.png' // ใส่ path รูป MobSF ที่นี่
                  },
                  virustotal: {
                    label: 'VirusTotal',
                    imagePath: '/virustotal_logo.png' // ใส่ path รูป VirusTotal ที่นี่
                  },
                  cape: {
                    label: 'CAPE Sandbox',
                    imagePath: '/cape_logo.png' // ใส่ path รูป CAPE ที่นี่
                  },
                }
                const meta = toolLabels[tool] ?? {
                  label: tool,
                  imagePath: '/logos/default-logo.png' // ใส่ path รูป default
                }

                return (
                  <button
                    key={tool}
                    disabled={!!downloadingTool}
                    onClick={() => handleDownload(tool, report.md5)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition
            ${isDownloading
                        ? 'bg-cyan-500/20 border-cyan-500/40 cursor-not-allowed'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 cursor-pointer'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Image Logo แทน icon */}
                      <div className="relative w-6 h-6">
                        <Image
                          src={meta.imagePath}
                          alt={meta.label}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="text-white font-medium">{meta.label}</span>
                    </div>
                    {isDownloading ? (
                      <div className="flex items-center gap-2 text-cyan-400">
                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">กำลังโหลด...</span>
                      </div>
                    ) : (
                      <span className="text-cyan-400 text-sm">↓ JSON</span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-blue-200/40 break-all mt-4">MD5: {report.md5}</p>
          </div>

        </div>
        <div className="max-w-4xl mx-auto space-y-5">








          {/* Score + Risk */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 border border-gray-700/50 shadow-xl">
            {/* Header with Logo and Risk Level */}
            <div className="flex items-start justify-between mb-8">
              {/* Logo Section - kept original */}
              <div className="gap-4 flex flex-col">
                <div className="relative w-22 h-22 lg:w-32 lg:h-32">
                  {/* Gemini style frame - kept original */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl opacity-30 blur-md"></div>
                  <div className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-gray-100"></div>
                  <div className="absolute inset-1 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl"></div>
                  <Image
                    src="/logo_gemini.png"
                    alt="Gemini Security"
                    fill
                    className="object-contain p-3 filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.05)]"
                    priority
                  />
                </div>
                <div>
                  <p className="text-gray-300 text-sm flex items-center gap-1">
                    <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
                    รายงานการวิเคราะห์ความปลอดภัยจาก Gemini
                  </p>
                </div>
              </div>

              {/* Risk Level Badge - adjusted for dark background */}
              <div className={`rounded-xl px-4 py-2 bg-gray-800 border border-gray-700 shadow-sm ${c.bg}`}>
                <p className="text-gray-400 text-xs mb-1">ระดับความเสี่ยง</p>
                <span className={`text-lg font-bold ${c.text}`}>{report.risk_level}</span>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Score and Summary */}
              <div className="lg:col-span-2 space-y-6">
                {/* Security Score Card - dark theme */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-400 text-sm">คะแนนความปลอดภัย</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">{report.score}</span>
                      <span className="text-gray-400 text-sm">/100</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden">
                    <div
                      className={`h-4 rounded-full transition-all ${c.bar}`}
                      style={{ width: `${report.score}%` }}
                    />
                  </div>
                </div>

                {/* Summary Section - dark theme */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 shadow-sm backdrop-blur-sm">
                  <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    สรุปผลการวิเคราะห์
                  </h2>
                  <p className="text-gray-300 leading-relaxed">{report.analysis_summary}</p>
                </div>
              </div>

              {/* Right Column - Risk Indicators */}
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 shadow-sm backdrop-blur-sm h-full">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Risk Indicators
                  </h2>
                  <ul className="space-y-3">
                    {report.risk_indicators.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300 group hover:text-white transition-colors">
                        <span className={`mt-2 w-2 h-2 shrink-0 rounded-full ${c.dot} group-hover:scale-125 transition-transform`} />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Recommendation Footer - dark theme */}
            <div className="mt-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-800 rounded-lg shadow-sm border border-gray-700">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-purple-400 font-semibold mb-2">คำแนะนำ</h2>
                  <p className="text-gray-300 leading-relaxed">{report.recommendation}</p>
                </div>
              </div>
            </div>

            {/* Footer Info - dark theme */}
            <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
              <span className="flex items-center gap-2">
                <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
                รายงานนี้ถูกสร้างโดยอัตโนมัติ
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-purple-400">Gemini</span>
                <span className="text-gray-500">Security</span>
              </span>
            </div>
          </div>

          {/* Tools & MD5 */}



        </div>
      </div>

    </div>
  )
}