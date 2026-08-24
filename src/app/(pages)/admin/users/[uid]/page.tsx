'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import NavbarComponent from '@/components/NavbarComponent'
import GeometricLoader from '@/components/GeometricLoader'

const ROLE_LABELS: Record<string, string> = {
  user: 'ผู้ใช้ทั่วไป',
  admin: 'ผู้ดูแลระบบ',
  master: 'ผู้คุมสูงสุด',
}

function formatSize(bytes: number | null) {
  if (!bytes) return '-'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatDate(dateStr: string | null) {
  return dateStr ? new Date(dateStr).toLocaleString('th-TH') : '-'
}

const STATUS_LABELS: Record<string, string> = {
  success: 'สำเร็จ',
  processing: 'กำลังวิเคราะห์',
  failed: 'ไม่สำเร็จ',
  pending: 'รอดำเนินการ',
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const uid = params.uid as string

  const [user, setUser] = useState<AdminUserListItem | null>(null)
  const [history, setHistory] = useState<AdminUserHistoryItem[]>([])
  const [pagination, setPagination] = useState<AdminPagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [notFound, setNotFound] = useState(false)

  const loadDetail = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data } = await axios.post<AdminUserDetailResponse>('/api/admin/users/detail', { target_uid: uid })
      if (data.success && data.data) {
        setUser(data.data)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setIsLoading(false)
    }
  }, [uid])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const { data } = await axios.post<AdminUserHistoryResponse>('/api/admin/users/history', {
        target_uid: uid,
        page,
        limit: 10,
      })
      if (data.success) {
        setHistory(data.data)
        setPagination(data.pagination)
      }
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [uid, page])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  if (isLoading) return <GeometricLoader loadingText="กำลังโหลดข้อมูล..." />

  if (notFound || !user) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <NavbarComponent />
        <div className="max-w-3xl mx-auto text-center py-24">
          <div className="text-5xl mb-4">🚫</div>
          <p className="text-white text-lg font-medium">ไม่พบผู้ใช้ที่ต้องการ</p>
          <Link href="/admin/users" className="text-cyan-400 hover:text-cyan-300 transition mt-4 inline-block">
            ← กลับไปหน้ารายชื่อผู้ใช้
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <NavbarComponent />

      <div className="max-w-5xl mx-auto space-y-5">
        <Link href="/admin/users" className="text-cyan-400 hover:text-cyan-300 transition text-sm inline-block">
          ← กลับไปหน้ารายชื่อผู้ใช้
        </Link>

        {/* Profile card */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-white">{user.username}</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/20">
                  {ROLE_LABELS[user.role]}
                </span>
                {user.is_banned && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20">
                    ถูกแบน
                  </span>
                )}
              </div>
              <p className="text-blue-200/60 text-sm">{user.email}</p>
              <p className="text-blue-200/40 text-xs mt-1">สมัครเมื่อ {formatDate(user.created_at)}</p>
            </div>
          </div>

          {user.is_banned && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-300 text-sm font-medium mb-1">เหตุผลการแบน</p>
              <p className="text-red-200/80 text-sm">{user.banned_reason ?? '-'}</p>
              <p className="text-red-200/50 text-xs mt-2">แบนเมื่อ {formatDate(user.banned_at)}</p>
            </div>
          )}
        </div>

        {/* Upload history (includes private files, per admin privilege) */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <h2 className="text-white font-semibold text-lg">ประวัติการอัปโหลดไฟล์</h2>
            <span className="text-amber-300/80 text-xs bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
              รวมไฟล์ private ทั้งหมด (มีบันทึกในประวัติการดำเนินการ)
            </span>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-white font-medium">ยังไม่มีประวัติการอัปโหลด</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.aid} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 shrink-0 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <span className="text-cyan-400 text-xs font-bold uppercase">{item.file_type ?? '?'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-white font-medium truncate">{item.file_name ?? '-'}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.privacy
                              ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20'
                              : 'text-green-400 bg-green-500/10 border border-green-500/20'
                          }`}
                        >
                          {item.privacy ? 'PRIVATE' : 'PUBLIC'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20">
                          {STATUS_LABELS[item.status ?? ''] ?? item.status ?? '-'}
                        </span>
                        {item.is_malicious && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20">
                            มัลแวร์
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-blue-200/50">
                        <span>{formatSize(item.file_size)}</span>
                        <span>•</span>
                        <span>{formatDate(item.created_at)}</span>
                        {item.report?.score !== null && item.report?.score !== undefined && (
                          <>
                            <span>•</span>
                            <span>Score: {item.report.score}/100</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {item.task_id && (
                    <Link href={`/reports/${item.task_id}`} className="text-cyan-400 ml-4 shrink-0 text-sm hover:text-cyan-300 transition">
                      ดูรายงาน →
                    </Link>
                  )}
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
