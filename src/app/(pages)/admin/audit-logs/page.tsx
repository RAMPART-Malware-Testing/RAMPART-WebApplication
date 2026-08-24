'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import axios from 'axios'
import NavbarComponent from '@/components/NavbarComponent'

const ACTION_LABELS: Record<string, string> = {
  ban_user: 'แบนผู้ใช้',
  unban_user: 'ปลดแบนผู้ใช้',
  role_change: 'เปลี่ยนสิทธิ์',
  view_user_detail: 'ดูข้อมูลผู้ใช้',
  view_private_history: 'ดูประวัติไฟล์ (รวม private)',
}

const ACTION_BADGE: Record<string, string> = {
  ban_user: 'text-red-400 bg-red-500/10 border border-red-500/20',
  unban_user: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
  role_change: 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20',
  view_user_detail: 'text-blue-300 bg-blue-500/10 border border-blue-500/20',
  view_private_history: 'text-amber-300 bg-amber-500/10 border border-amber-500/20',
}

function formatDate(dateStr: string | null) {
  return dateStr ? new Date(dateStr).toLocaleString('th-TH') : '-'
}

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState<AuditLogItem[]>([])
  const [pagination, setPagination] = useState<AdminPagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const body: Record<string, unknown> = { page, limit: 20 }
      if (actionFilter) body.action = actionFilter
      const { data } = await axios.post<AuditLogResponse>('/api/admin/audit-logs', body)
      if (data.success) {
        setItems(data.data)
        setPagination(data.pagination)
      } else {
        setItems([])
      }
    } catch {
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [page, actionFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setPage(1)
  }, [actionFilter])

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <NavbarComponent />

      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-white">ประวัติการดำเนินการของผู้ดูแล</h1>
            <p className="text-blue-200/50 text-sm mt-1">บันทึกทุกการแบน / ปลดแบน / เปลี่ยนสิทธิ์ / เข้าถึงข้อมูลส่วนตัวของผู้ใช้อื่น</p>
          </div>
          <Link href="/admin" className="text-cyan-400 hover:text-cyan-300 transition text-sm">
            ← กลับไปแดชบอร์ด
          </Link>
        </div>

        {/* Filter */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <label className="block text-sm text-blue-200/60 mb-2">กรองตามประเภทการดำเนินการ</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActionFilter('')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                actionFilter === '' ? 'bg-cyan-500 text-white' : 'bg-white/5 text-blue-200/60 hover:text-white'
              }`}
            >
              ทั้งหมด
            </button>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActionFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  actionFilter === key ? 'bg-cyan-500 text-white' : 'bg-white/5 text-blue-200/60 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-white font-medium">ยังไม่มีประวัติการดำเนินการ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((log) => (
                <div key={log.log_id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-white font-medium">{log.actor_username ?? '-'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_BADGE[log.action ?? ''] ?? 'text-gray-400 bg-gray-500/10 border border-gray-500/20'}`}>
                        {ACTION_LABELS[log.action ?? ''] ?? log.action}
                      </span>
                      {log.target_username && (
                        <>
                          <span className="text-blue-200/40">→</span>
                          <span className="text-white font-medium">{log.target_username}</span>
                        </>
                      )}
                    </div>
                    {log.detail && <p className="text-blue-200/50 text-sm">{log.detail}</p>}
                  </div>
                  <span className="text-blue-200/40 text-xs shrink-0">{formatDate(log.created_at)}</span>
                </div>
              ))}
            </div>
          )}

          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">
              <button
                disabled={!pagination.has_prev}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
              >
                ← ก่อนหน้า
              </button>
              <span className="text-blue-200/50 text-sm">
                หน้า {pagination.page} / {pagination.total_pages}
              </span>
              <button
                disabled={!pagination.has_next}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
              >
                ถัดไป →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
