'use client'

import { useState } from 'react'
import Link from 'next/link'
import NavbarComponent from '@/components/NavbarComponent'
import GeometricLoader from '@/components/GeometricLoader'
import {
  useDashboardSummary,
  useDashboardRecentActivities,
  useDashboardPublicReports,
} from '@/hooks/queries/useDashboard'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

function truncate(text?: string, max = 30) {
  if (!text) return '-'
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

type TimeRange = 'weekly' | 'monthly'

const STATUS_STYLES: Record<string, { icon: string; badge: string; label: string }> = {
  success: {
    icon: 'fas fa-check-circle',
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    label: 'สำเร็จ',
  },
  processing: {
    icon: 'fas fa-spinner',
    badge: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    label: 'กำลังวิเคราะห์',
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

const statusStyle = (status: string) => STATUS_STYLES[status] ?? STATUS_STYLES.pending

function dangerTier(score: number) {
  if (score >= 80) return { label: 'อันตรายร้ายแรง', text: 'text-red-400', bar: 'bg-red-500', chip: 'bg-red-500/10 border-red-500/20' }
  if (score >= 60) return { label: 'อันตราย', text: 'text-orange-400', bar: 'bg-orange-500', chip: 'bg-orange-500/10 border-orange-500/20' }
  if (score >= 30) return { label: 'ความเสี่ยงปานกลาง', text: 'text-amber-400', bar: 'bg-amber-500', chip: 'bg-amber-500/10 border-amber-500/20' }
  return { label: 'ปลอดภัย', text: 'text-emerald-400', bar: 'bg-emerald-500', chip: 'bg-emerald-500/10 border-emerald-500/20' }
}

const clamp = (v: number) => Math.max(0, Math.min(100, v))

const FILE_TYPE_ICONS: Record<string, string> = {
  apk: 'fas fa-android',
  exe: 'fas fa-windows',
  dll: 'fas fa-windows',
  jar: 'fas fa-coffee',
  js: 'fab fa-js-square',
  ps1: 'fas fa-terminal',
  bat: 'fas fa-terminal',
  vbs: 'fas fa-terminal',
}

const fileTypeIcon = (type?: string | null) => {
  const key = (type ?? '').trim().toLowerCase().replace(/^\./, '')
  return FILE_TYPE_ICONS[key] ?? 'fas fa-file-code'
}

type MalwareTypeItem = {
  type: string
  count: number
  label?: string | null
  icon?: string | null
  avg_score?: number | null
}

const toAvgScore = (value: unknown): number | null => {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? clamp(n) : null
}

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
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('weekly')

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary()
  const { data: recentActivities = [], isLoading: activitiesLoading } = useDashboardRecentActivities()
  const { data: publicFiles = [], isLoading: publicLoading } = useDashboardPublicReports(1, 8)

  const isLoading = summaryLoading || activitiesLoading || publicLoading

  if (isLoading || !summary) return <GeometricLoader loadingText="กำลังโหลดข้อมูล..." />

  const dashboardStats = summary

  const activeMalwareList: MalwareTypeItem[] = selectedTimeRange === 'weekly'
    ? dashboardStats.topMalwareTypes.weekly
    : dashboardStats.topMalwareTypes.monthly

  const totalSuccessRate = dashboardStats.totalFiles.total > 0
    ? (dashboardStats.totalFiles.success / dashboardStats.totalFiles.total) * 100
    : 0

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <NavbarComponent />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            ภาพรวมระบบ RAMPART
          </h1>
          <p className="text-slate-400">สถิติรวมของทุกไฟล์และทุกผู้ใช้ในระบบ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="ไฟล์ทั้งหมด"
            value={dashboardStats.totalFiles.total}
            icon="fas fa-database"
            gradient="from-blue-500 to-cyan-500"
            subtitle={`สำเร็จ ${dashboardStats.totalFiles.success} • รอวิเคราะห์ ${dashboardStats.totalFiles.pending} • ไม่สำเร็จ ${dashboardStats.totalFiles.failed}`}
          />
          <StatCard
            title="ไฟล์อันตราย"
            value={dashboardStats.highRiskFiles}
            icon="fas fa-triangle-exclamation"
            gradient="from-rose-500 to-red-500"
            subtitle="คะแนนความอันตรายตั้งแต่ 60 ขึ้นไป"
          />
          <StatCard
            title="อัตราความสำเร็จ"
            value={`${totalSuccessRate.toFixed(1)}%`}
            icon="fas fa-chart-line"
            gradient="from-emerald-500 to-teal-500"
            subtitle="การวิเคราะห์ที่สำเร็จทั้งระบบ"
          />
          <StatCard
            title="ผู้ใช้งานทั้งหมด"
            value={dashboardStats.totalUsers}
            icon="fas fa-users"
            gradient="from-orange-500 to-red-500"
            subtitle="สมาชิกที่ลงทะเบียน"
          />
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <i className="fas fa-globe text-blue-400" />
                ไฟล์สาธารณะ (Public)
              </h3>
              <p className="text-slate-400 text-sm mt-1">รายงานที่เปิดให้ทุกคนดูได้</p>
            </div>
            <Link
              href="/public-reports"
              className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors flex items-center gap-1.5 text-sm font-medium shrink-0"
            >
              View All
              <i className="fas fa-arrow-right text-xs" />
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
                    <span className="w-9 h-9 shrink-0 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold uppercase">
                      {f.file_type ?? '?'}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <i className="fas fa-bug text-rose-400" />
                  ประเภทมัลแวร์ยอดนิยม
                </h3>
                <p className="text-slate-400 text-sm mt-1">5 อันดับมัลแวร์ที่พบมากที่สุด</p>
              </div>
              <div className="flex gap-2">
                {(['weekly', 'monthly'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      selectedTimeRange === range
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {range === 'weekly' ? '7 วัน' : 'รายเดือน'}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 space-y-4">
              {activeMalwareList.length > 0 ? (
                activeMalwareList.map((malware, index) => {
                  const maxCount = Math.max(...activeMalwareList.map(m => m.count), 1)
                  const percentage = (malware.count / maxCount) * 100
                  const label = malware.label && malware.label.trim() ? malware.label : malware.type
                  const avgScore = toAvgScore(malware.avg_score)
                  const tier = avgScore != null ? dangerTier(avgScore) : null
                  return (
                    <div key={malware.type} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                            ${index === 0 ? 'bg-amber-500/20 text-amber-400' :
                              index === 1 ? 'bg-slate-500/20 text-slate-400' :
                              index === 2 ? 'bg-orange-500/20 text-orange-400' :
                              'bg-white/10 text-slate-400'}`}>
                            {index + 1}
                          </div>
                          <div
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-rose-300"
                            title={malware.type}
                          >
                            <i className={`${malware.icon ?? 'fas fa-virus'} text-sm`} />
                          </div>
                          <span className="text-white font-medium" title={malware.type}>{label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {tier && avgScore != null && (
                            <span
                              title={`คะแนนความอันตรายเฉลี่ย: ${Math.round(avgScore)}/100`}
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${tier.chip} ${tier.text}`}
                            >
                              (avg {Math.round(avgScore)})
                            </span>
                          )}
                          <span className="text-slate-400 text-sm">{malware.count} ครั้ง</span>
                        </div>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <i className="fas fa-chart-simple text-4xl mb-3 opacity-50" />
                  <p>ไม่มีข้อมูลในขณะนี้</p>
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

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <i className="fas fa-clock-rotate-left text-cyan-400" />
              กิจกรรมล่าสุดของฉัน
            </h3>
            <p className="text-slate-400 text-sm mt-1">รายการวิเคราะห์ล่าสุดที่คุณอัปโหลด</p>
          </div>
          <div className="divide-y divide-white/5">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const style = statusStyle(activity.status)
                return (
                  <Link
                    key={activity.id}
                    href={activity.taskId ? `/scan/analysis?taskId=${activity.taskId}` : '#'}
                    className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs ${style.badge}`}>
                        <i className={style.icon} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate" title={activity.fileName}>
                          {truncate(activity.fileName, 60)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activity.timestamp ? new Date(activity.timestamp).toLocaleString('th-TH') : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {activity.fileType && (
                        <span className="text-[10px] font-bold uppercase rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-slate-400">
                          {activity.fileType}
                        </span>
                      )}
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.badge}`}>
                        {style.label}
                      </span>
                      <i className="fas fa-chevron-right text-slate-500 text-xs group-hover:translate-x-1 group-hover:text-cyan-400 transition" />
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="text-center py-12 text-slate-400">
                <i className="fas fa-clock-rotate-left text-4xl mb-3 opacity-40" />
                <p>ยังไม่มีกิจกรรม</p>
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