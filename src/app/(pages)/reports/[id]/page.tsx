'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import NavbarComponent from '@/components/NavbarComponent'

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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3 text-white">
        <div className="text-4xl">🔍</div>
        <p className="text-blue-200/60">ไม่พบรายงาน</p>
      </div>
    )
  }

  const colorMap = {
    red: { text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', bar: 'bg-red-500', dot: 'bg-red-400' },
    yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', bar: 'bg-yellow-500', dot: 'bg-yellow-400' },
    green: { text: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', bar: 'bg-green-500', dot: 'bg-green-400' },
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

      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{report.package}</h1>
              <p className="text-blue-200/50 text-sm">
                {report.type} • {new Date(report.created_at).toLocaleString('th-TH')}
              </p>
            </div>
            <span className="shrink-0 text-xs bg-white/10 text-blue-200/60 px-3 py-1 rounded-full">
              #{report.rid}
            </span>
          </div>
        </div>

        {/* Score + Risk */}
        <div className={`rounded-2xl p-6 border ${c.bg}`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-blue-200/50 text-sm mb-1">ระดับความเสี่ยง</p>
              <span className={`text-xl font-bold ${c.text}`}>{report.risk_level}</span>
            </div>
            <div className="text-right">
              <p className="text-blue-200/50 text-sm mb-1">Rampart AI Score</p>
              <span className="text-xl font-bold text-white">{report.rampart_score}</span>
            </div>
          </div>

          <p className="text-blue-200/50 text-sm mb-2">คะแนนความปลอดภัย</p>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-5xl font-black text-white">{report.score}</span>
            <span className="text-blue-200/50 mb-1">/100</span>
          </div>
          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
            <div className={`h-3 rounded-full transition-all ${c.bar}`} style={{ width: `${report.score}%` }} />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-white font-semibold mb-3">สรุปผลการวิเคราะห์</h2>
          <p className="text-blue-200/70 leading-relaxed">{report.analysis_summary}</p>
        </div>

        {/* Risk Indicators */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-white font-semibold mb-4">Risk Indicators</h2>
          <ul className="space-y-3">
            {report.risk_indicators.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-blue-200/70">
                <span className={`mt-2 w-2 h-2 shrink-0 rounded-full ${c.dot}`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendation */}
        <div className="bg-cyan-500/10 rounded-2xl p-6 border border-cyan-500/20">
          <h2 className="text-cyan-400 font-semibold mb-3">คำแนะนำ</h2>
          <p className="text-blue-100/80">{report.recommendation}</p>
        </div>

        {/* Tools & MD5 */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-white font-semibold mb-4">เครื่องมือที่ใช้วิเคราะห์</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {tools.map(tool => (
              <span
                key={tool}
                className="capitalize px-3 py-1 rounded-full bg-white/10 text-blue-200/80 text-sm border border-white/10"
              >
                {tool}
              </span>
            ))}
          </div>
          <p className="text-xs text-blue-200/40 break-all">MD5: {report.md5}</p>
        </div>

        {/* Tools & Download */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-white font-semibold mb-4">ดาวน์โหลดรายงาน</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {tools.map(tool => {
              const isDownloading = downloadingTool === tool
              const toolLabels: Record<string, { label: string; icon: string }> = {
                mobsf: { label: 'MobSF', icon: '📱' },
                virustotal: { label: 'VirusTotal', icon: '🛡️' },
                cape: { label: 'CAPE Sandbox', icon: '🔬' },
              }
              const meta = toolLabels[tool] ?? { label: tool, icon: '📄' }

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
                    <span className="text-xl">{meta.icon}</span>
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
    </div>
  )
}