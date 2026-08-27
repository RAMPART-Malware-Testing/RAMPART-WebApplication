'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import GeometricLoader from '@/components/GeometricLoader'
import { ROLE_LABELS } from '@/lib/roles'
import {
  useAdminUserDetail,
  useAdminUserHistory,
  useAdminUserLogins,
  useAdminUserDownloads,
} from '@/hooks/queries/useAdminUserDetail'

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

const TABS = [
  { id: 'uploads', label: 'ประวัติการอัปโหลด', icon: 'fas fa-upload' },
  { id: 'logins', label: 'ประวัติการเข้าสู่ระบบ', icon: 'fas fa-right-to-bracket' },
  { id: 'downloads', label: 'ประวัติการดาวน์โหลด', icon: 'fas fa-download' },
]

export default function AdminUserDetailPage() {
  const params = useParams()
  const uid = params.uid as string

  const [activeTab, setActiveTab] = useState('uploads')
  const [historyPage, setHistoryPage] = useState(1)
  const [loginsPage, setLoginsPage] = useState(1)
  const [downloadsPage, setDownloadsPage] = useState(1)

  const { data: user, isLoading, isError: detailError } = useAdminUserDetail(uid)
  const notFound = detailError || (!isLoading && !user)

  const { data: historyResult, isLoading: historyLoading } = useAdminUserHistory(uid, historyPage)
  const history = historyResult?.data ?? []
  const historyPagination = historyResult?.pagination ?? null

  const loginsEnabled = activeTab === 'logins'
  const { data: loginsResult, isLoading: loginsLoadingRaw, isFetched: loginsFetched } = useAdminUserLogins(uid, loginsPage, loginsEnabled)
  const logins = loginsResult?.data ?? []
  const loginsPagination = loginsResult?.pagination ?? null
  const loginsLoading = loginsLoadingRaw
  const loginsLoaded = loginsFetched

  const downloadsEnabled = activeTab === 'downloads'
  const { data: downloadsResult, isLoading: downloadsLoadingRaw, isFetched: downloadsFetched } = useAdminUserDownloads(uid, downloadsPage, downloadsEnabled)
  const downloads = downloadsResult?.data ?? []
  const downloadsPagination = downloadsResult?.pagination ?? null
  const downloadsLoading = downloadsLoadingRaw
  const downloadsLoaded = downloadsFetched

  if (isLoading) return <GeometricLoader loadingText="กำลังโหลดข้อมูล..." />

  if (notFound || !user) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <div className="text-5xl mb-4">🚫</div>
        <p className="text-white text-lg font-medium">ไม่พบผู้ใช้ที่ต้องการ</p>
        <Link href="/admin/users" className="text-cyan-400 hover:text-cyan-300 transition mt-4 inline-block">
          ← กลับไปหน้ารายชื่อผู้ใช้
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <Link href="/admin/users" className="text-cyan-400 hover:text-cyan-300 transition text-sm inline-block">
        ← กลับไปหน้ารายชื่อผู้ใช้
      </Link>

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

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex p-1.5 gap-1 border-b border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'uploads' && (
            <>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
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

              {historyPagination && historyPagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">
                  <button
                    disabled={!historyPagination.has_prev}
                    onClick={() => setHistoryPage((p) => p - 1)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
                  >
                    ← ก่อนหน้า
                  </button>
                  <span className="text-blue-200/50 text-sm">
                    หน้า {historyPagination.page} / {historyPagination.total_pages}
                  </span>
                  <button
                    disabled={!historyPagination.has_next}
                    onClick={() => setHistoryPage((p) => p + 1)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
                  >
                    ถัดไป →
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'logins' && (
            <>
              {loginsLoading && !loginsLoaded ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : logins.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">🔑</div>
                  <p className="text-white font-medium">ยังไม่มีประวัติการเข้าสู่ระบบ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logins.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'success' || item.status === 'success_device_bypass'
                                ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                                : 'text-red-400 bg-red-500/10 border border-red-500/20'
                            }`}
                          >
                            {item.status ?? '-'}
                          </span>
                          <span className="text-white text-sm">{item.provider ?? 'password'}</span>
                        </div>
                        <p className="text-blue-200/50 text-xs">{item.ip ?? '-'} • {item.user_agent ?? '-'}</p>
                      </div>
                      <span className="text-blue-200/40 text-xs shrink-0">{formatDate(item.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}

              {loginsPagination && loginsPagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">
                  <button
                    disabled={!loginsPagination.has_prev}
                    onClick={() => setLoginsPage((p) => p - 1)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
                  >
                    ← ก่อนหน้า
                  </button>
                  <span className="text-blue-200/50 text-sm">
                    หน้า {loginsPagination.page} / {loginsPagination.total_pages}
                  </span>
                  <button
                    disabled={!loginsPagination.has_next}
                    onClick={() => setLoginsPage((p) => p + 1)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
                  >
                    ถัดไป →
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'downloads' && (
            <>
              {downloadsLoading && !downloadsLoaded ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : downloads.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">📥</div>
                  <p className="text-white font-medium">ยังไม่มีประวัติการดาวน์โหลด</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {downloads.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                      <div>
                        <p className="text-white text-sm font-medium">{item.file_name ?? '-'}</p>
                        <p className="text-blue-200/50 text-xs">{item.tool ?? '-'} • {item.md5 ?? '-'}</p>
                      </div>
                      <span className="text-blue-200/40 text-xs shrink-0">{formatDate(item.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}

              {downloadsPagination && downloadsPagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">
                  <button
                    disabled={!downloadsPagination.has_prev}
                    onClick={() => setDownloadsPage((p) => p - 1)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
                  >
                    ← ก่อนหน้า
                  </button>
                  <span className="text-blue-200/50 text-sm">
                    หน้า {downloadsPagination.page} / {downloadsPagination.total_pages}
                  </span>
                  <button
                    disabled={!downloadsPagination.has_next}
                    onClick={() => setDownloadsPage((p) => p + 1)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
                  >
                    ถัดไป →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
