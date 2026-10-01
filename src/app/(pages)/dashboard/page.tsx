'use client'

import { useState } from 'react'
import Link from 'next/link'
import NavbarComponent from '@/components/NavbarComponent'
import GeometricLoader from '@/components/GeometricLoader'
import {
  useDashboardSummary,
  useDashboardRecentActivities,
  useDashboardPublicReports,
  type RecentActivity,
} from '@/hooks/queries/useDashboard'
import { fileTypeLabel, hasFileType } from '@/lib/file-type'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

function truncate(text?: string, max = 30) {
  if (!text) return '-'
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

type TimeRange = 'daily' | 'monthly' | 'all'

const TIME_RANGES: TimeRange[] = ['daily', 'monthly', 'all']

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  daily: 'รายวัน',
  monthly: 'รายเดือน',
  all: 'ทั้งหมด',
}

const TIME_RANGE_EMPTY_TEXT: Record<TimeRange, string> = {
  daily: 'ไม่พบมัลแวร์จากการสแกนในวันนี้',
  monthly: 'ไม่พบมัลแวร์จากการสแกนในเดือนนี้',
  all: 'ยังไม่พบมัลแวร์จากการสแกนเลย',
}

const STATUS_STYLES: Record<RecentActivity['status'], { icon: string; badge: string; label: string }> = {
  success: {
    icon: 'fas fa-check-circle',
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    label: 'สำเร็จ',
  },
  pending: {
    icon: 'fas fa-hourglass-half',
    badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    label: 'รอวิเคราะห์',
  },
  failed: {
    icon: 'fas fa-times-circle',
    badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    label: 'ไม่สำเร็จ',
  },
}

function dangerTier(score: number) {
  if (score >= 80) return { label: 'อันตรายร้ายแรง', text: 'text-red-400', bar: 'bg-red-500', chip: 'bg-red-500/10 border-red-500/20' }
  if (score >= 60) return { label: 'อันตราย', text: 'text-orange-400', bar: 'bg-orange-500', chip: 'bg-orange-500/10 border-orange-500/20' }
  if (score >= 30) return { label: 'ความเสี่ยงปานกลาง', text: 'text-amber-400', bar: 'bg-amber-500', chip: 'bg-amber-500/10 border-amber-500/20' }
  return { label: 'ปลอดภัย', text: 'text-emerald-400', bar: 'bg-emerald-500', chip: 'bg-emerald-500/10 border-emerald-500/20' }
}

const clamp = (v: number) => Math.max(0, Math.min(100, v))

const aiChipValue = (raw: unknown): number | null => {
  if (raw == null) return null
  if (typeof raw === 'number') return clamp(raw)
  const p = (raw as { malware_probability?: unknown }).malware_probability
  const n = Number(p)
  return Number.isFinite(n) ? clamp(n * 100) : null
}

const toolChips = (r: { virustotal_score?: number | null; mobsf_score?: number | null; cape_score?: number | null; rampart_ai_score?: unknown } | null | undefined, listedTools?: string | null) => {
  const listed = (listedTools ?? '').split(',').map((t) => t.trim()).filter(Boolean)
  const defs = [
    { key: 'virustotal', label: 'VT', title: 'VirusTotal', value: r?.virustotal_score ?? null },
    { key: 'mobsf', label: 'MobSF', title: 'MobSF Static Analysis', value: r?.mobsf_score ?? null },
    { key: 'cape', label: 'CAPE', title: 'CAPE Sandbox', value: r?.cape_score ?? null },
    { key: 'rampart_ai', label: 'AI', title: 'RampartAI', value: aiChipValue(r?.rampart_ai_score) },
  ]
  if (listed.length > 0) {
    return defs.filter((d) => listed.some((t) => t === d.key || (d.key === 'rampart_ai' && (t === 'rampart' || t === 'rampartai'))))
  }
  return defs.filter((d) => d.value != null)
}

const avgChips = (item: { virustotalScore?: number | null; mobsfScore?: number | null; capeScore?: number | null; aiScore?: number | null }) => {
  return [
    { key: 'virustotal', label: 'VT', title: 'VirusTotal', value: item.virustotalScore ?? null },
    { key: 'mobsf', label: 'MobSF', title: 'MobSF Static Analysis', value: item.mobsfScore ?? null },
    { key: 'cape', label: 'CAPE', title: 'CAPE Sandbox', value: item.capeScore ?? null },
    { key: 'rampart_ai', label: 'AI', title: 'RampartAI', value: item.aiScore ?? null },
  ].filter((c): c is { key: string; label: string; title: string; value: number } => c.value != null)
}

export default function DashboardPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('monthly')

  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useDashboardSummary()
  const { data: recentActivities = [], isLoading: activitiesLoading } = useDashboardRecentActivities()
  const { data: publicFiles = [], isLoading: publicLoading } = useDashboardPublicReports(1, 5)

  const isLoading = summaryLoading || activitiesLoading || publicLoading

  if (isLoading) return <GeometricLoader loadingText="กำลังโหลดข้อมูล..." />

  if (!summary) {
    return (
      <div className="min-h-screen bg-[#050510] p-6">
        <NavbarComponent />
        <div className="max-w-xl mx-auto py-16 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <i className="fas fa-triangle-exclamation text-3xl text-amber-400"></i>
            <p className="text-white font-medium mt-4">โหลดข้อมูลแดชบอร์ดไม่สำเร็จ</p>
            <p className="text-slate-400 text-sm mt-2">
              {summaryError
                ? 'เซสชันอาจหมดอายุ หรือเชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาเข้าสู่ระบบใหม่'
                : 'ไม่พบข้อมูลจากเซิร์ฟเวอร์'}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => refetchSummary()}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2.5 font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600"
              >
                ลองใหม่
              </button>
              <Link
                href="/logout"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 font-semibold text-white transition hover:bg-white/10"
              >
                เข้าสู่ระบบใหม่
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const dashboardStats = { ...summary, recentActivities }

  const activeMalwareList = dashboardStats.topMalwareTypes[selectedTimeRange]

  const totalSuccessRate = dashboardStats.totalFiles.total > 0
    ? (dashboardStats.totalFiles.success / dashboardStats.totalFiles.total) * 100
    : 0

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <NavbarComponent />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            ยินดีต้อนรับกลับ! 👋
          </h1>
          <p className="text-slate-400">นี่คือภาพรวมของระบบความปลอดภัยของคุณ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="ไฟล์ทั้งหมด"
            value={dashboardStats.totalFiles.total}
            icon="fas fa-database"
            gradient="from-blue-500 to-cyan-500"
            subtitle={`สำเร็จ ${dashboardStats.totalFiles.success} รายการ`}
          />
          <StatCard
            title="ไฟล์ของฉัน"
            value={dashboardStats.userFiles.total}
            icon="fas fa-user-shield"
            gradient="from-purple-500 to-pink-500"
            subtitle={`รอวิเคราะห์ ${dashboardStats.userFiles.pending} รายการ`}
          />
          <StatCard
            title="อัตราความสำเร็จ"
            value={`${totalSuccessRate.toFixed(1)}%`}
            icon="fas fa-chart-line"
            gradient="from-emerald-500 to-teal-500"
            subtitle="โดยรวมทั้งหมด"
          />
          <StatCard
            title="ผู้ใช้งานทั้งหมด"
            value={dashboardStats.totalUsers}
            icon="fas fa-users"
            gradient="from-orange-500 to-red-500"
            subtitle="สมาชิกที่ลงทะเบียน"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <i className="fas fa-bug text-rose-400" />
                  ประเภทมัลแวร์ยอดนิยม
                </h3>
                <p className="text-slate-400 text-sm mt-1">10 อันดับมัลแวร์ที่พบมากที่สุด</p>
              </div>
              <div className="flex gap-2">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      selectedTimeRange === range
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {TIME_RANGE_LABELS[range]}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 space-y-2.5">
              {activeMalwareList.length > 0 ? (
                activeMalwareList.map((malware, index) => {
                  const rank = index + 1
                  const isTop = index === 0
                  const badgeClass =
                    index === 0
                      ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-slate-900 shadow-lg shadow-amber-500/25'
                      : index === 1
                        ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900'
                        : index === 2
                          ? 'bg-gradient-to-br from-orange-300 to-orange-600 text-slate-900'
                          : 'bg-white/10 text-slate-300 border border-white/10'
                  return (
                    <div
                      key={malware.type}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                        isTop
                          ? 'bg-amber-500/10 border border-amber-500/25'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${badgeClass}`}>
                        {rank}
                        {isTop && (
                          <i className="fas fa-crown absolute -top-2 -right-1 text-[11px] text-amber-300"></i>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-white font-medium truncate" title={malware.type}>{malware.type}</span>
                          {isTop && (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                              พบมากที่สุด
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-sm text-slate-300">
                        {malware.count} <span className="font-sans text-slate-500">ครั้ง</span>
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <i className="fas fa-chart-simple text-4xl mb-3 opacity-50" />
                  <p>{TIME_RANGE_EMPTY_TEXT[selectedTimeRange]}</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {TIME_RANGES.filter(
                      (range) => range !== selectedTimeRange && dashboardStats.topMalwareTypes[range].length > 0,
                    ).map((range) => (
                      <button
                        key={range}
                        onClick={() => setSelectedTimeRange(range)}
                        className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-white/10 hover:text-cyan-300 transition"
                      >
                        ดูผล{TIME_RANGE_LABELS[range]} ({dashboardStats.topMalwareTypes[range].length} ประเภท)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <i className="fas fa-shield-virus text-amber-400" />
                คะแนนความอันตราย
              </h3>
              <p className="text-slate-400 text-sm mt-1">ค่าเฉลี่ยจำแนกตามประเภทไฟล์</p>
            </div>
            <div className="p-6 space-y-4">
              {dashboardStats.riskScores.length > 0 ? (
                dashboardStats.riskScores.map((item) => {
                  const score = Math.min(Math.max(item.riskScore, 0), 100)
                  return (
                    <div key={item.fileType} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm font-medium">{item.fileType}</span>
                        <span className={`text-sm font-bold ${dangerTier(score).text}`}>{score.toFixed(0)}/100</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${dangerTier(score).bar} rounded-full transition-all duration-700`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      {avgChips(item).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {avgChips(item).map((c) => (
                            <span
                              key={c.key}
                              title={`${c.title} (ค่าเฉลี่ย): ${Math.round(c.value)}/100`}
                              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${dangerTier(c.value).chip} ${dangerTier(c.value).text}`}
                            >
                              {c.label} {Math.round(c.value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <i className="fas fa-chart-line text-4xl mb-3 opacity-50" />
                  <p>ไม่มีข้อมูลความเสี่ยง</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-white/10 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <i className="fas fa-globe text-blue-400" />
                ไฟล์สาธารณะ (Public)
              </h3>
              <p className="text-slate-400 text-sm mt-1">5 รายการล่าสุดที่เปิดให้ทุกคนดูได้</p>
            </div>
            <Link
              href="/public"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-white/10 hover:text-cyan-300 transition"
            >
              ดูทั้งหมด
              <i className="fas fa-arrow-right text-[10px]" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {publicFiles.length > 0 ? (
              publicFiles.map((f: any) => (
                <Link
                  key={f.aid || f.task_id}
                  href={`/scan/analysis?taskId=${f.task_id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      title={hasFileType(f.file_type) ? `ประเภทไฟล์: ${fileTypeLabel(f.file_type)}` : 'ไม่ระบุประเภทไฟล์'}
                      className={`w-9 h-9 shrink-0 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold uppercase ${hasFileType(f.file_type) ? 'text-cyan-400 text-xs' : 'text-slate-500 text-[10px]'}`}
                    >
                      {fileTypeLabel(f.file_type)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate" title={f.file_name ?? undefined}>{f.file_name}</p>
                      <p className="text-xs text-slate-500">
                        {f.file_size ? fmtSize(f.file_size) : ''} • {f.created_at ? new Date(f.created_at).toLocaleString('th-TH') : ''}
                      </p>
                      {f.uploaded_by && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="h-4 w-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[8px] font-bold text-white overflow-hidden">
                            {f.uploaded_by.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={`${SERVER_URL}${f.uploaded_by.avatar_url}`} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              (f.uploaded_by.username || '?').charAt(0).toUpperCase()
                            )}
                          </span>
                          <span className="text-[11px] text-slate-400">{f.uploaded_by.username}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {f.status && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${f.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : f.status === 'failed' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {f.status}
                      </span>
                    )}
                    {f.report?.score != null && (
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <span className={`text-sm font-bold font-mono ${dangerTier(Number(f.report.score)).text}`}>
                          {Math.round(Number(f.report.score))}/100
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${dangerTier(Number(f.report.score)).chip} ${dangerTier(Number(f.report.score)).text}`}>
                          {dangerTier(Number(f.report.score)).label}
                        </span>
                        {toolChips(f.report as any, f.tools).map((c) => {
                          const tier = c.value != null ? dangerTier(c.value) : null
                          return (
                            <span
                              key={c.key}
                              title={c.value != null ? `${c.title}: ${Math.round(c.value)}/100` : `${c.title}: ไม่มีข้อมูล`}
                              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${tier ? tier.chip + ' ' + tier.text : 'text-slate-500 bg-slate-800/50 border-slate-600/40'}`}
                            >
                              {c.label} {c.value != null ? Math.round(c.value) : '–'}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    <i className="fas fa-chevron-right text-slate-500 text-xs group-hover:translate-x-1 group-hover:text-cyan-400 transition" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <i className="fas fa-globe text-4xl mb-3 opacity-40" />
                <p>ไม่มีไฟล์</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function fmtSize(bytes?: number | null) {
  if (!bytes) return ""
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function StatCard({ title, value, icon, gradient, subtitle }: {
  title: string
  value: string | number
  icon: string
  gradient: string
  subtitle: string
}) {
  return (
    <div className="group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16" />
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <i className={`${icon} text-white text-xl`} />
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
          </div>
        </div>
        <p className="text-slate-500 text-sm">{subtitle}</p>
      </div>
    </div>
  )
}
