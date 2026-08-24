'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import NavbarComponent from '@/components/NavbarComponent'
import GeometricLoader from '@/components/GeometricLoader'

const ROLE_LABELS: Record<string, string> = {
  user: 'ผู้ใช้ทั่วไป',
  admin: 'ผู้ดูแลระบบ',
  master: 'ผู้คุมสูงสุด',
}

const ACTION_LABELS: Record<string, string> = {
  ban_user: 'แบนผู้ใช้',
  unban_user: 'ปลดแบนผู้ใช้',
  role_change: 'เปลี่ยนสิทธิ์',
  view_user_detail: 'ดูข้อมูลผู้ใช้',
  view_private_history: 'ดูประวัติไฟล์ (รวม private)',
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.post<AdminDashboardSummaryResponse>('/api/admin/dashboard')
        if (data.success) {
          setSummary(data.data)
        } else {
          setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้')
        }
      } catch {
        setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  if (isLoading) return <GeometricLoader loadingText="กำลังโหลดข้อมูล..." />

  return (
    <div className="min-h-screen bg-gradient-to-br p-6 from-slate-900 via-slate-800 to-slate-900">
      <NavbarComponent />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">ระบบจัดการผู้ดูแล</h1>
            <p className="text-slate-400">ภาพรวมผู้ใช้งาน สิทธิ์การเข้าถึง และประวัติการดำเนินการ</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/users"
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition"
            >
              จัดการผู้ใช้
            </Link>
            <Link
              href="/admin/audit-logs"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition"
            >
              ประวัติการดำเนินการ
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-300">{error}</div>
        )}

        {summary && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <p className="text-blue-200/60 text-sm mb-1">ผู้ใช้ทั้งหมด</p>
                <p className="text-3xl font-bold text-white">{summary.total_users}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <p className="text-blue-200/60 text-sm mb-1">บัญชีถูกแบน</p>
                <p className="text-3xl font-bold text-red-400">{summary.banned_count}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <p className="text-blue-200/60 text-sm mb-1">ไฟล์วิเคราะห์ทั้งหมด</p>
                <p className="text-3xl font-bold text-white">{summary.total_analyses}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <p className="text-blue-200/60 text-sm mb-1">พบว่าเป็นมัลแวร์</p>
                <p className="text-3xl font-bold text-orange-400">{summary.malicious_count}</p>
              </div>
            </div>

            {/* Role breakdown */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-white font-semibold text-lg mb-4">สัดส่วนบทบาทผู้ใช้</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['user', 'admin', 'master'] as const).map((role) => (
                  <div key={role} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                    <span className="text-blue-200/70">{ROLE_LABELS[role]}</span>
                    <span className="text-white font-bold text-lg">{summary.role_breakdown[role]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent admin actions */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-lg">การดำเนินการล่าสุด</h2>
                <Link href="/admin/audit-logs" className="text-cyan-400 text-sm hover:text-cyan-300 transition">
                  ดูทั้งหมด →
                </Link>
              </div>
              {summary.recent_actions.length === 0 ? (
                <p className="text-blue-200/50 text-sm py-8 text-center">ยังไม่มีการดำเนินการ</p>
              ) : (
                <div className="space-y-2">
                  {summary.recent_actions.map((action) => (
                    <div
                      key={action.log_id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm">
                          <span className="font-medium">{action.actor_username ?? '-'}</span>
                          {' '}
                          <span className="text-blue-200/60">{ACTION_LABELS[action.action ?? ''] ?? action.action}</span>
                          {action.target_username && (
                            <>
                              {' → '}
                              <span className="font-medium">{action.target_username}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <span className="text-blue-200/40 text-xs shrink-0 ml-3">
                        {action.created_at ? new Date(action.created_at).toLocaleString('th-TH') : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
