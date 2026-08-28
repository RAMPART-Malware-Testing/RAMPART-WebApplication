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

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

function truncate(text?: string, max = 30) {
  if (!text) return '-'
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

type TimeRange = 'daily' | 'monthly'

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

function getRiskScoreColor(score: number) {
  if (score >= 70) return { text: 'text-rose-400', bar: 'bg-gradient-to-r from-rose-500 to-red-500' }
  if (score >= 40) return { text: 'text-amber-400', bar: 'bg-gradient-to-r from-amber-500 to-orange-500' }
  return { text: 'text-emerald-400', bar: 'bg-gradient-to-r from-emerald-500 to-teal-500' }
}

export default function DashboardPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('daily')

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary()
  const { data: recentActivities = [], isLoading: activitiesLoading } = useDashboardRecentActivities()
  const { data: publicFiles = [], isLoading: publicLoading } = useDashboardPublicReports(1, 8)

  const isLoading = summaryLoading || activitiesLoading || publicLoading

  if (isLoading || !summary) return <GeometricLoader loadingText="กำลังโหลดข้อมูล..." />

  const dashboardStats = { ...summary, recentActivities }

  const activeMalwareList = selectedTimeRange === 'daily'
    ? dashboardStats.topMalwareTypes.daily
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
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <i className="fas fa-globe text-blue-400" />
              ไฟล์สาธารณะ (Public)
            </h3>
            <p className="text-slate-400 text-sm mt-1">รายงานที่เปิดให้ทุกคนดูได้</p>
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
                      <span className={`text-xs font-medium ${scoreInfo(f.report.score).text}`}>
                        Score: {f.report.score}/100 · {scoreInfo(f.report.score).label}
                      </span>
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
                {(['daily', 'monthly'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      selectedTimeRange === range
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {range === 'daily' ? 'รายวัน' : 'รายเดือน'}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 space-y-4">
              {activeMalwareList.length > 0 ? (
                activeMalwareList.map((malware, index) => {
                  const maxCount = Math.max(...activeMalwareList.map(m => m.count), 1)
                  const percentage = (malware.count / maxCount) * 100
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
                          <span className="text-white font-medium">{malware.type}</span>
                        </div>
                        <span className="text-slate-400 text-sm">{malware.count} ครั้ง</span>
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
                คะแนนความเสี่ยง
              </h3>
              <p className="text-slate-400 text-sm mt-1">จำแนกตามประเภทไฟล์</p>
            </div>
            <div className="p-6 space-y-4">
              {dashboardStats.riskScores.length > 0 ? (
                dashboardStats.riskScores.map((item) => {
                  const score = Math.min(Math.max(item.riskScore, 0), 100)
                  const colors = getRiskScoreColor(score)
                  return (
                    <div key={item.fileType} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm font-medium">{item.fileType}</span>
                        <span className={`text-sm font-bold ${colors.text}`}>{score.toFixed(0)}/100</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
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

      </div>
    </div>
  )
}

function scoreInfo(score?: number) {
  if (score == null) return { text: "text-blue-300", label: "" }
  if (score < 30) return { text: "text-emerald-400", label: "ปลอดภัย" }
  if (score < 60) return { text: "text-amber-400", label: "ปานกลาง" }
  return { text: "text-rose-400", label: "อันตราย" }
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