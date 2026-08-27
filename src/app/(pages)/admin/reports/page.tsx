'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdminReportsList } from '@/hooks/queries/useAdminReports'

const RISK_LEVELS = ['Low', 'Caution', 'High', 'Critical']

const RISK_BADGE: Record<string, string> = {
  Low: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
  Caution: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
  High: 'text-orange-400 bg-orange-500/10 border border-orange-500/20',
  Critical: 'text-red-400 bg-red-500/10 border border-red-500/20',
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

export default function AdminReportsPage() {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { data: listResult, isLoading } = useAdminReportsList({
    page,
    limit: 20,
    q: search || undefined,
    risk_level: riskFilter !== 'all' ? riskFilter : undefined,
  })
  const items = listResult?.data ?? []
  const pagination = listResult?.pagination ?? null

  useEffect(() => {
    setPage(1)
  }, [search, riskFilter])

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">จัดการ Report</h1>
        <p className="text-blue-200/50 text-sm mt-1">
          เฉพาะไฟล์ที่วิเคราะห์เสร็จสมบูรณ์แล้วจากทุกผู้ใช้ในระบบ
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-blue-200/60 mb-2">ค้นหา</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาด้วยชื่อไฟล์, hash..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
            />
          </div>
          <div>
            <label className="block text-sm text-blue-200/60 mb-2">ระดับความเสี่ยง</label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
            >
              <option value="all" className="bg-slate-800">ทั้งหมด</option>
              {RISK_LEVELS.map((r) => (
                <option key={r} value={r} className="bg-slate-800">{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">รายงานการวิเคราะห์</h2>
          {pagination && <span className="text-blue-200/50 text-sm">ทั้งหมด {pagination.total} รายการ</span>}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-white font-medium mb-1">ไม่พบรายงาน</p>
            <p className="text-blue-200/50 text-sm">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((file) => (
              <Link
                key={file.aid}
                href={file.task_id ? `/reports/${file.task_id}` : '#'}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 shrink-0 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-105 transition">
                    <span className="text-cyan-400 text-xs font-bold uppercase">{file.file_type ?? '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-white font-medium truncate">{file.file_name ?? '-'}</span>
                      {file.report?.risk_level && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_BADGE[file.report.risk_level] ?? 'text-gray-400 bg-gray-500/10 border border-gray-500/20'}`}>
                          {file.report.risk_level}
                        </span>
                      )}
                      {file.is_malicious && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20">
                          มัลแวร์
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-blue-200/50">
                      <span>
                        <i className="fas fa-user mr-1" />
                        {file.owner_username ?? '-'}
                      </span>
                      <span>•</span>
                      <span>{formatSize(file.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(file.created_at)}</span>
                      {file.report?.score !== null && file.report?.score !== undefined && (
                        <>
                          <span>•</span>
                          <span>Score: {file.report.score}/100</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-cyan-400 ml-4 shrink-0">→</span>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
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
  )
}
