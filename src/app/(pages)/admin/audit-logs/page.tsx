'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { useProfile } from '@/hooks/queries/useProfile'
import {
  useAdminAuditLogs,
  useAdminDeleteAuditLogsOlderThan,
  exportAdminAuditLogsCsv,
} from '@/hooks/queries/useAdminAuditLogs'

const ACTION_LABELS: Record<string, string> = {
  create_user: 'สร้างบัญชี',
  delete_audit_logs: 'ลบประวัติการดำเนินการ',
  ban_user: 'แบนผู้ใช้',
  unban_user: 'ปลดแบนผู้ใช้',
  role_change: 'เปลี่ยนสิทธิ์',
  view_user_detail: 'ดูข้อมูลผู้ใช้',
  view_private_history: 'ดูประวัติไฟล์ (รวม private)',
  delete_file: 'ลบไฟล์',
  change_password: 'เปลี่ยนรหัสผ่าน',
  master_setup: 'ตั้งค่าบัญชี master ครั้งแรก',
  change_email: 'เปลี่ยนอีเมล',
  delete_user_history: 'ลบประวัติผู้ใช้',
}

const ACTION_BADGE: Record<string, string> = {
  ban_user: 'text-red-400 bg-red-500/10 border border-red-500/20',
  unban_user: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
  role_change: 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20',
  view_user_detail: 'text-blue-300 bg-blue-500/10 border border-blue-500/20',
  view_private_history: 'text-amber-300 bg-amber-500/10 border border-amber-500/20',
  delete_file: 'text-orange-400 bg-orange-500/10 border border-orange-500/20',
  change_password: 'text-purple-400 bg-purple-500/10 border border-purple-500/20',
  master_setup: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
  change_email: 'text-sky-400 bg-sky-500/10 border border-sky-500/20',
  delete_user_history: 'text-rose-400 bg-rose-500/10 border border-rose-500/20',
}

const DELETE_MONTH_OPTIONS = [1, 2, 3, 6, 12]

function formatDate(dateStr: string | null) {
  return dateStr ? new Date(dateStr).toLocaleString('th-TH') : '-'
}

export default function AdminAuditLogsPage() {
  const [actionFilter, setActionFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deleteMonths, setDeleteMonths] = useState(1)
  const [page, setPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)

  const { data: profile } = useProfile()
  const isMaster = profile?.role === 'master'
  const deleteOlderMutation = useAdminDeleteAuditLogsOlderThan()

  useEffect(() => {
    const timer = setTimeout(() => setQ(searchInput.trim()), 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [actionFilter, q, dateFrom, dateTo])

  const { data: listResult, isLoading, error: listError } = useAdminAuditLogs({
    page,
    limit: 25,
    action: actionFilter || undefined,
    q: q || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })
  const items = listResult?.data ?? []
  const pagination = listResult?.pagination ?? null

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportAdminAuditLogsCsv()
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteOlderThan = async () => {
    if (deleteOlderMutation.isPending) return
    const confirm = await Swal.fire({
      title: `ลบข้อมูลที่เก่ากว่า ${deleteMonths} เดือน?`,
      html: 'ลบประวัติทั้งหมดที่เก่ากว่าระยะเวลาที่เลือก (1 เดือน = 30 วัน) โดยไม่ใช้ตัวกรองค้นหาหรือช่วงวันที่ — <b>กู้คืนไม่ได้</b>',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
      background: '#0f172a',
      color: '#fff',
    })
    if (!confirm.isConfirmed) return

    try {
      const deleted = await deleteOlderMutation.mutateAsync(deleteMonths)
      Swal.fire({
        icon: 'success',
        title: `ลบข้อมูลแล้ว ${deleted} รายการ`,
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#0891b2',
      })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: err instanceof Error ? err.message : 'ไม่สามารถลบข้อมูลได้',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      })
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-white">ประวัติการดำเนินการของผู้ดูแล</h1>
            <p className="text-blue-200/50 text-sm mt-1">บันทึกการสร้างบัญชี / แบน / ปลดแบน / เข้าถึงข้อมูลส่วนตัว / ลบประวัติ</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={isExporting}
              onClick={handleExport}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition disabled:opacity-40"
            >
              <i className="fas fa-file-csv mr-2" />
              Export CSV
            </button>
            <Link href="/admin" className="text-cyan-400 hover:text-cyan-300 transition text-sm">
              ← กลับไปแดชบอร์ด
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="lg:order-2 lg:sticky lg:top-20 bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <i className="fas fa-filter text-cyan-400" />
            ตัวกรอง
          </h3>
          <div>
            <label className="block text-sm text-blue-200/60 mb-2">ค้นหา</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ค้นหาผู้กระทำ/เป้าหมาย/รายละเอียด"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
            />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm text-blue-200/60 mb-2">จากวันที่</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm text-blue-200/60 mb-2">ถึงวันที่</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition [color-scheme:dark]"
              />
            </div>
          </div>
          <div>
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

          {isMaster && (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <i className="fas fa-broom text-red-400" />
                ลบข้อมูลเก่า
              </h3>
              <div>
                <label className="block text-sm text-blue-200/60 mb-2">ลบข้อมูลที่เก่ากว่า</label>
                <select
                  value={deleteMonths}
                  onChange={(e) => setDeleteMonths(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                >
                  {DELETE_MONTH_OPTIONS.map((m) => (
                    <option key={m} value={m} className="bg-slate-800">
                      {m} เดือน
                    </option>
                  ))}
                </select>
              </div>
              <button
                disabled={deleteOlderMutation.isPending}
                onClick={handleDeleteOlderThan}
                className="w-full px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition disabled:opacity-40"
              >
                {deleteOlderMutation.isPending ? 'กำลังลบ...' : 'ลบข้อมูลที่เก่ากว่า'}
              </button>
            </div>
          )}
        </div>

        <div className="lg:order-1 bg-white/5 rounded-2xl p-6 border border-white/10">
          {listError ? (
            <p className="text-red-400 text-sm py-8 text-center">{listError instanceof Error ? listError.message : 'ไม่สามารถดึงประวัติได้'}</p>
          ) : isLoading ? (
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

          {pagination && (
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
