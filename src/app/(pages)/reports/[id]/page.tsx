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
  risk_level: string
  color: string
  recommendation: string
  analysis_summary: string
  risk_indicators: string[]
  created_at: string
  tools: string
  md5: string
}

export default function ReportDetailPage() {
  const [downloadingTool, setDownloadingTool] = useState<string | null>(null)
  const params = useParams()
  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function getAccessToken(): Promise<{ token: string; uri: string }> {
    const res = await fetch('/api/auth/access', {
      method: 'GET',
      credentials: 'include'
    })

    if (!res.ok) throw new Error('Unauthorized')

    const data = await res.json()
    if (!data.success) {
      window.location.reload()
    }

    return {
      token: data.token,
      uri: data.uri
    }
  }

  const handleDownload = async (tool: string) => {
    if (!report || downloadingTool) return

    try {
      setDownloadingTool(tool)

      const { token, uri } = await getAccessToken()

      const downloadUrl = `${uri}/api/analy/report/${tool}-${report.md5}`

      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `${tool}-${report.md5}.json`)
      link.setAttribute('target', '_blank')
      link.setAttribute('rel', 'noopener noreferrer')

      // ส่ง token ผ่าน query แทน header (ถ้าจำเป็น)
      link.href = `${downloadUrl}?token=${token}`

      document.body.appendChild(link)
      link.click()
      link.remove()

    } catch {
      alert('ดาวน์โหลดไม่สำเร็จ')
    } finally {
      setTimeout(() => {
        setDownloadingTool(null)
      }, 1500)
    }
  }



  useEffect(() => {
    async function fetchReport() {
      try {
        setIsLoading(true)

        const { token, uri } = await getAccessToken()

        const response = await axios.post(
          `${uri}/api/analy/report`,
          { task_id: params.id },
          { headers: { 'X-Access-Token': token } }
        )

        const res = response.data
        console.log(res)

        if (res.success && res.status === 'success') {
          setReport({
            task_id: res.task_id,
            ...res.report
          })
        } else {
          setReport(null)
        }
      } catch (err) {
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
        <div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        ไม่พบรายงาน
      </div>
    )
  }

  const riskColor =
    report.color === 'red'
      ? 'text-red-400'
      : report.color === 'yellow'
        ? 'text-yellow-400'
        : 'text-green-400'

  const riskBg =
    report.color === 'red'
      ? 'bg-red-500/10 border-red-500/20'
      : report.color === 'yellow'
        ? 'bg-yellow-500/10 border-yellow-500/20'
        : 'bg-green-500/10 border-green-500/20'

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <NavbarComponent />

      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h1 className="text-2xl font-bold text-white mb-2">
            {report.package}
          </h1>
          <p className="text-blue-200/60 text-sm">
            ประเภท: {report.type} • วิเคราะห์เมื่อ {new Date(report.created_at).toLocaleString('th-TH')}
          </p>
        </div>

        {/* Risk Score */}
        <div className={`rounded-2xl p-6 border ${riskBg}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">ระดับความเสี่ยง</h2>
            <span className={`text-lg font-bold ${riskColor}`}>
              {report.risk_level}
            </span>
          </div>

          <h2 className="text-white font-semibold text-lg">คะแนนความปลอดภัยเต็ม 100</h2>
          <div className="text-5xl font-black mb-4 text-white">
            {report.score}
            <span className="text-lg font-medium text-blue-200/60"> /100</span>
          </div>

          <div className="w-full bg-white/10 h-3 rounded-full">
            <div
              className={`h-3 rounded-full ${report.color === 'red'
                ? 'bg-red-500'
                : report.color === 'yellow'
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
                }`}
              style={{ width: `${report.score}%` }}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-white font-semibold text-lg mb-4">
            สรุปผลการวิเคราะห์
          </h2>
          <p className="text-blue-200/70 leading-relaxed">
            {report.analysis_summary}
          </p>
        </div>

        {/* Risk Indicators */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-white font-semibold text-lg mb-4">
            Risk Indicators
          </h2>

          <ul className="space-y-3">
            {report.risk_indicators.map((item, index) => (
              <li
                key={index}
                className="flex items-start space-x-3 text-blue-200/70"
              >
                <span className={`mt-1 w-2 h-2 rounded-full ${report.color === 'red'
                  ? 'bg-red-400'
                  : report.color === 'yellow'
                    ? 'bg-yellow-400'
                    : 'bg-green-400'
                  }`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendation */}
        <div className="bg-cyan-500/10 rounded-2xl p-6 border border-cyan-500/20">
          <h2 className="text-cyan-400 font-semibold text-lg mb-3">
            คำแนะนำ
          </h2>
          <p className="text-blue-100/80">
            {report.recommendation}
          </p>
        </div>

        {/* Download Reports */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-white font-semibold text-lg mb-4">
            ดาวน์โหลดรายงาน (JSON)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {report?.tools ? (report.tools.split(',').map((tool) => {
              const isDownloading = downloadingTool === tool.trim()

              return (
                <button
                  key={tool}
                  disabled={isDownloading}
                  onClick={() => handleDownload(tool.trim())}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition
        ${isDownloading
                      ? 'bg-cyan-500/20 border-cyan-500/40 cursor-not-allowed'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                >
                  <span className="text-white font-medium capitalize">
                    {tool}
                  </span>

                  {isDownloading ? (
                    <div className="flex items-center space-x-2 text-cyan-400">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">กำลังดาวน์โหลด...</span>
                    </div>
                  ) : (
                    <span className="text-cyan-400 text-sm">
                      Download
                    </span>
                  )}
                </button>
              )
            })) : (<p>ไม่มีข้อมูลเครื่องมือ</p>)}
          </div>

          <div className="mt-4 text-xs text-blue-200/50 break-all">
            MD5: {report.md5}
          </div>
        </div>


      </div>
    </div>
  )
}
