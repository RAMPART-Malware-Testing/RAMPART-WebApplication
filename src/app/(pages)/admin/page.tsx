'use client'

import { useState } from 'react'
import Link from 'next/link'
import GeometricLoader from '@/components/GeometricLoader'
import UploadTrendChart from '@/components/admin/charts/UploadTrendChart'
import DoughnutBreakdownChart from '@/components/admin/charts/DoughnutBreakdownChart'
import BarBreakdownChart from '@/components/admin/charts/BarBreakdownChart'
import { RISK_LEVEL_COLORS, STATUS_COLORS, CHART_PALETTE } from '@/components/admin/charts/chartSetup'
import { useAdminDashboard } from '@/hooks/queries/useAdminDashboard'

const ACTION_LABELS: Record<string, string> = {
  ban_user: 'แบนผู้ใช้',
  unban_user: 'ปลดแบนผู้ใช้',
  role_change: 'เปลี่ยนสิทธิ์',
  view_user_detail: 'ดูข้อมูลผู้ใช้',
  view_private_history: 'ดูประวัติไฟล์ (รวม private)',
  delete_file: 'ลบไฟล์',
}

const ACTION_ICON: Record<string, string> = {
  ban_user: 'fas fa-ban text-red-400',
  unban_user: 'fas fa-check-circle text-emerald-400',
  role_change: 'fas fa-user-shield text-cyan-400',
  view_user_detail: 'fas fa-eye text-blue-400',
  view_private_history: 'fas fa-folder-open text-amber-400',
  delete_file: 'fas fa-trash text-orange-400',
}

const STATUS_LABELS: Record<string, string> = {
  success: 'สำเร็จ',
  processing: 'กำลังวิเคราะห์',
  pending: 'รอดำเนินการ',
  failed: 'ไม่สำเร็จ',
  unknown: 'ไม่ทราบสถานะ',
}

function StatCard({
  title,
  value,
  icon,
  gradient,
  subtitle,
}: {
  title: string
  value: string | number
  icon: string
  gradient: string
  subtitle?: string
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
        {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
      </div>
    </div>
  )
}

function ChartPanel({
  title,
  subtitle,
  icon,
  children,
  action,
  className = '',
}: {
  title: string
  subtitle?: string
  icon: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <i className={icon} />
            {title}
          </h3>
          {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [trendDays, setTrendDays] = useState(14)
  const { data: summary, isLoading, isError } = useAdminDashboard(trendDays)
  const error = isError || (!isLoading && !summary) ? 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้' : null

  if (isLoading) return <GeometricLoader loadingText="กำลังโหลดข้อมูล..." />

  const successRate =
    summary && summary.total_analyses > 0
      ? ((summary.status_breakdown.find((s) => s.status === 'success')?.count ?? 0) / summary.total_analyses) * 100
      : 0

  const adminCount = summary ? summary.role_breakdown.admin + summary.role_breakdown.master : 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <i className="fas fa-shield-halved text-cyan-400" />
              ระบบหลังบ้าน RAMPART
            </h1>
            <p className="text-slate-400">ภาพรวมผู้ใช้งาน สถิติการวิเคราะห์ไฟล์ และการดำเนินการของผู้ดูแล</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/admin/users"
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition flex items-center gap-2"
            >
              <i className="fas fa-users-gear" />
              จัดการผู้ใช้
            </Link>
            <Link
              href="/admin/system-health"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition flex items-center gap-2"
            >
              <i className="fas fa-heart-pulse" />
              สถานะระบบ
            </Link>
            <Link
              href="/admin/audit-logs"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition flex items-center gap-2"
            >
              <i className="fas fa-clipboard-list" />
              ประวัติการดำเนินการ
            </Link>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-300">{error}</div>}

        {summary && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="ผู้ใช้ทั้งหมด"
                value={summary.total_users}
                icon="fas fa-users"
                gradient="from-blue-500 to-cyan-500"
                subtitle={`ผู้ดูแล ${adminCount} คน`}
              />
              <StatCard
                title="ไฟล์วิเคราะห์ทั้งหมด"
                value={summary.total_analyses}
                icon="fas fa-file-shield"
                gradient="from-purple-500 to-pink-500"
                subtitle={`อัตราสำเร็จ ${successRate.toFixed(1)}%`}
              />
              <StatCard
                title="พบว่าเป็นมัลแวร์"
                value={summary.malicious_count}
                icon="fas fa-bug"
                gradient="from-orange-500 to-red-500"
                subtitle={
                  summary.total_analyses > 0
                    ? `${((summary.malicious_count / summary.total_analyses) * 100).toFixed(1)}% ของไฟล์ทั้งหมด`
                    : undefined
                }
              />
              <StatCard
                title="บัญชีถูกแบน"
                value={summary.banned_count}
                icon="fas fa-user-slash"
                gradient="from-rose-500 to-red-600"
                subtitle={`จากผู้ใช้ ${summary.total_users} คน`}
              />
            </div>

            {/* Upload trend + role breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ChartPanel
                title="แนวโน้มการอัปโหลดไฟล์"
                subtitle={`${trendDays} วันย้อนหลัง`}
                icon="fas fa-chart-line text-cyan-400"
                className="lg:col-span-2"
                action={
                  <select
                    value={trendDays}
                    onChange={(e) => setTrendDays(Number(e.target.value))}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value={7} className="bg-slate-800">7 วัน</option>
                    <option value={14} className="bg-slate-800">14 วัน</option>
                    <option value={30} className="bg-slate-800">30 วัน</option>
                    <option value={90} className="bg-slate-800">90 วัน</option>
                  </select>
                }
              >
                <div className="h-64">
                  <UploadTrendChart data={summary.upload_trend} />
                </div>
              </ChartPanel>

              <ChartPanel title="สัดส่วนบทบาทผู้ใช้" icon="fas fa-user-tag text-indigo-400">
                <div className="h-64">
                  <DoughnutBreakdownChart
                    labels={['ผู้ใช้ทั่วไป', 'ผู้ดูแลระบบ', 'ผู้คุมสูงสุด']}
                    values={[summary.role_breakdown.user, summary.role_breakdown.admin, summary.role_breakdown.master]}
                    colors={[CHART_PALETTE[0], CHART_PALETTE[1], CHART_PALETTE[2]]}
                  />
                </div>
              </ChartPanel>
            </div>

            {/* Risk level + status + file type + tool usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartPanel title="ระดับความเสี่ยงของไฟล์" subtitle="จากผลการวิเคราะห์ทั้งหมด" icon="fas fa-triangle-exclamation text-amber-400">
                {summary.risk_level_breakdown.length === 0 ? (
                  <EmptyChartState />
                ) : (
                  <div className="h-64">
                    <DoughnutBreakdownChart
                      labels={summary.risk_level_breakdown.map((r) => r.risk_level)}
                      values={summary.risk_level_breakdown.map((r) => r.count)}
                      colors={summary.risk_level_breakdown.map((r) => RISK_LEVEL_COLORS[r.risk_level] ?? '#64748b')}
                    />
                  </div>
                )}
              </ChartPanel>

              <ChartPanel title="สถานะการวิเคราะห์" subtitle="สถานะปัจจุบันของทุกงาน" icon="fas fa-list-check text-emerald-400">
                {summary.status_breakdown.length === 0 ? (
                  <EmptyChartState />
                ) : (
                  <div className="h-64">
                    <DoughnutBreakdownChart
                      labels={summary.status_breakdown.map((s) => STATUS_LABELS[s.status] ?? s.status)}
                      values={summary.status_breakdown.map((s) => s.count)}
                      colors={summary.status_breakdown.map((s) => STATUS_COLORS[s.status] ?? '#64748b')}
                    />
                  </div>
                )}
              </ChartPanel>

              <ChartPanel title="ประเภทไฟล์ยอดนิยม" icon="fas fa-file-lines text-blue-400">
                {summary.file_type_breakdown.length === 0 ? (
                  <EmptyChartState />
                ) : (
                  <div className="h-64">
                    <BarBreakdownChart
                      labels={summary.file_type_breakdown.map((f) => f.file_type.toUpperCase())}
                      values={summary.file_type_breakdown.map((f) => f.count)}
                    />
                  </div>
                )}
              </ChartPanel>

              <ChartPanel title="การใช้งานเครื่องมือวิเคราะห์" subtitle="จำนวนไฟล์ที่ถูกวิเคราะห์ด้วยแต่ละเครื่องมือ" icon="fas fa-toolbox text-purple-400">
                {summary.tool_usage.length === 0 ? (
                  <EmptyChartState />
                ) : (
                  <div className="h-64">
                    <BarBreakdownChart
                      labels={summary.tool_usage.map((t) => t.tool.replace('_', ' ').toUpperCase())}
                      values={summary.tool_usage.map((t) => t.count)}
                      horizontal
                    />
                  </div>
                )}
              </ChartPanel>
            </div>

            {/* Recent admin actions */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <i className="fas fa-clock text-blue-400" />
                    การดำเนินการล่าสุด
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">การดำเนินการของผู้ดูแลระบบ 10 รายการล่าสุด</p>
                </div>
                <Link href="/admin/audit-logs" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
                  ดูทั้งหมด
                  <i className="fas fa-arrow-right text-xs" />
                </Link>
              </div>
              <div className="divide-y divide-white/5">
                {summary.recent_actions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <i className="fas fa-inbox text-4xl mb-3 opacity-50" />
                    <p>ยังไม่มีการดำเนินการ</p>
                  </div>
                ) : (
                  summary.recent_actions.map((action) => (
                    <div key={action.log_id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <i className={`${ACTION_ICON[action.action ?? ''] ?? 'fas fa-circle-info text-slate-400'} text-lg shrink-0`} />
                          <div className="min-w-0">
                            <p className="text-white text-sm truncate">
                              <span className="font-medium">{action.actor_username ?? '-'}</span>
                              {' '}
                              <span className="text-slate-400">{ACTION_LABELS[action.action ?? ''] ?? action.action}</span>
                              {action.target_username && (
                                <>
                                  {' → '}
                                  <span className="font-medium">{action.target_username}</span>
                                </>
                              )}
                            </p>
                            {action.detail && <p className="text-slate-500 text-xs mt-0.5 truncate">{action.detail}</p>}
                          </div>
                        </div>
                        <span className="text-slate-500 text-xs shrink-0 ml-3">
                          {action.created_at ? new Date(action.created_at).toLocaleString('th-TH') : '-'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
    </div>
  )
}

function EmptyChartState() {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-slate-400">
      <i className="fas fa-chart-pie text-4xl mb-3 opacity-50" />
      <p>ไม่มีข้อมูลในขณะนี้</p>
    </div>
  )
}
