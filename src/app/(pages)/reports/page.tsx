'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import NavbarComponent from '@/components/NavbarComponent'
import axios from 'axios'

const FILE_TYPES = ['apk', 'exe', 'msi', 'bat', 'dmg', 'ipa', 'zip']
const STATUS_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'success', label: 'สำเร็จ' },
  { value: 'processing', label: 'กำลังวิเคราะห์' },
  { value: 'failed', label: 'ไม่สำเร็จ' },
  { value: 'pending', label: 'รอดำเนินการ' },
]

type SortField = 'created_at' | 'file_name' | 'file_size' | 'score'

export default function ReportsPage() {
  const [items, setItems] = useState<AnalysisHistoryItem[]>([])
  const [pagination, setPagination] = useState<AnalysisHistoryPagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [fileType, setFileType] = useState('all')

  // Sort: field + direction
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)

  // Pagination
  const [page, setPage] = useState(1)

  // ==============================
  // Fetch
  // ==============================
  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const body = {
        page,
        limit: 5,
        ...(search && { s: search }),
        ...(status !== 'all' && { status }),
        ...(fileType !== 'all' && { file_type: fileType }),
        [sortField]: sortDir,
      }
      const { data } = await axios.post<AnalysisHistoryResponse>('/api/analy/history', body)
      console.log(data)

      if (data.success) {
        setItems(data.data)
        setPagination(data.pagination)
      }
    } catch {
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [page, search, status, fileType, sortField, sortDir])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // reset page เมื่อ filter เปลี่ยน
  useEffect(() => {
    setPage(1)
  }, [search, status, fileType, sortField, sortDir])

  // ==============================
  // Helpers
  // ==============================
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 1 ? -1 : 1)
    } else {
      setSortField(field)
      setSortDir(-1)
    }
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '-'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatDate = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleString('th-TH') : '-'

  const getRiskColor = (score: number | null) => {
    if (score === null) return 'text-gray-400'
    if (score <= 30) return 'text-red-400'
    if (score <= 60) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getprivacyColor = (score: boolean | null) => {
    if (score === null) return 'text-gray-400'
    if (score == false) return 'text-red-400'
    if (score == true) return 'text-green-400'
    return 'text-green-400'
  }

  const getStatusBadge = (s: string | null) => {
    switch (s) {
      case 'success': return 'text-green-400 bg-green-500/10 border border-green-500/20'
      case 'processing': return 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20'
      case 'failed': return 'text-red-400 bg-red-500/10 border border-red-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border border-gray-500/20'
    }
  }
  const getprivacyBadge = (s: boolean | null) => {
    switch (s) {
      case true: return 'text-green-400 bg-green-500/10 border border-green-500/20'
      case false: return 'text-red-400 bg-red-500/10 border border-red-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border border-gray-500/20'
    }
  }

  const getStatusLabel = (s: string | null) => {
    switch (s) {
      case 'success': return 'สำเร็จ'
      case 'processing': return 'กำลังวิเคราะห์'
      case 'failed': return 'ไม่สำเร็จ'
      case 'pending': return 'รอดำเนินการ'
      default: return '-'
    }
  }

  const SORT_OPTIONS: { value: SortField; label: string }[] = [
    { value: 'created_at', label: 'วันที่' },
    { value: 'file_name', label: 'ชื่อไฟล์' },
    { value: 'file_size', label: 'ขนาด' },
    { value: 'score', label: 'ความเสี่ยง' },
  ]

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <NavbarComponent />

      <div className="max-w-6xl mx-auto space-y-5">

        {/* Filters */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm text-blue-200/60 mb-2">ค้นหาไฟล์</label>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหาด้วยชื่อไฟล์ หรือ Task ID..."
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm text-blue-200/60 mb-2">สถานะ</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-slate-800">{o.label}</option>
                ))}
              </select>
            </div>

            {/* File Type */}
            <div>
              <label className="block text-sm text-blue-200/60 mb-2">ประเภทไฟล์</label>
              <select
                value={fileType}
                onChange={e => setFileType(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              >
                <option value="all" className="bg-slate-800">ทั้งหมด</option>
                {FILE_TYPES.map(t => (
                  <option key={t} value={t} className="bg-slate-800">{t.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-blue-200/50 text-sm">เรียงตาม:</span>
            {SORT_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => handleSort(o.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${sortField === o.value
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/5 text-blue-200/60 hover:text-white'
                  }`}
              >
                {o.label}
                {sortField === o.value && (
                  <span className="ml-1">{sortDir === 1 ? '↑' : '↓'}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold text-lg">รายงานทั้งหมด</h2>
            {pagination && (
              <span className="text-blue-200/50 text-sm">
                ทั้งหมด {pagination.total} รายการ
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-white font-medium mb-1">ไม่พบรายการ</p>
              <p className="text-blue-200/50 text-sm">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <Link
                  key={item.aid}
                  href={`/reports/${item.task_id}`}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">

                    {/* Icon */}
                    <div className="w-11 h-11 shrink-0 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-105 transition">
                      <span className="text-cyan-400 text-xs font-bold uppercase">
                        {item.file_type ?? '?'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-white font-medium truncate">{item.file_name ?? '-'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium font-medium ${getprivacyColor(item.privacy)} ${getprivacyBadge(item.privacy)}`}>
                          {item.privacy ? 'PUBLIC' : 'PRIVATE'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>

                        {item.report?.risk_level && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20">
                            {item.report.risk_level}
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
                            <span className={`font-medium ${getRiskColor(item.report.score)}`}>
                              Score: {item.report.score}/100
                            </span>
                          </>
                        )}
                        {item.tools && (
                          <>
                            <span>•</span>
                            <span className="uppercase">{item.tools.replace(',', ', ')}</span>
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
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
              >
                ← ก่อนหน้า
              </button>

              <span className="text-blue-200/50 text-sm">
                หน้า {pagination.page} / {pagination.total_pages}
              </span>

              <button
                disabled={!pagination.has_next}
                onClick={() => setPage(p => p + 1)}
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