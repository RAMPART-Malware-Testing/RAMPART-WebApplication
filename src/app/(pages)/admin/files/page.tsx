'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { useToast } from '@/components/ui/ToastProvider'
import {
  useAdminFilesList,
  useAdminDeleteFile,
  useAdminBulkDeleteFiles,
  exportAdminFilesCsv,
} from '@/hooks/queries/useAdminFiles'

const STATUS_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'success', label: 'สำเร็จ' },
  { value: 'processing', label: 'กำลังวิเคราะห์' },
  { value: 'failed', label: 'ไม่สำเร็จ' },
  { value: 'pending', label: 'รอดำเนินการ' },
]

const STATUS_BADGE: Record<string, string> = {
  success: 'text-green-400 bg-green-500/10 border border-green-500/20',
  processing: 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20',
  failed: 'text-red-400 bg-red-500/10 border border-red-500/20',
  pending: 'text-gray-400 bg-gray-500/10 border border-gray-500/20',
}

const STATUS_LABEL: Record<string, string> = {
  success: 'สำเร็จ',
  processing: 'กำลังวิเคราะห์',
  failed: 'ไม่สำเร็จ',
  pending: 'รอดำเนินการ',
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

export default function AdminFilesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [privacyFilter, setPrivacyFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [busyAid, setBusyAid] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  const notify = useToast()

  const { data: listResult, isLoading } = useAdminFilesList({
    page,
    limit: 20,
    q: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    privacy: privacyFilter !== 'all' ? privacyFilter === 'private' : undefined,
  })
  const items = listResult?.data ?? []
  const pagination = listResult?.pagination ?? null

  const deleteMutation = useAdminDeleteFile()
  const bulkDeleteMutation = useAdminBulkDeleteFiles()
  const isBulkBusy = bulkDeleteMutation.isPending

  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [search, statusFilter, privacyFilter])

  const toggleSelect = (aid: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(aid)) next.delete(aid)
      else next.add(aid)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((f) => f.aid))))
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    const { value: reason, isConfirmed } = await Swal.fire({
      title: `ลบไฟล์ ${selected.size} รายการ?`,
      input: 'textarea',
      inputLabel: 'เหตุผลในการลบ (จำเป็น)',
      showCancelButton: true,
      confirmButtonText: 'ลบทั้งหมด',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
      background: '#0f172a',
      color: '#fff',
      inputValidator: (value) => (!value?.trim() ? 'กรุณาระบุเหตุผล' : undefined),
    })
    if (!isConfirmed || !reason) return

    try {
      const result = await bulkDeleteMutation.mutateAsync({ aids: Array.from(selected), reason: reason.trim() })
      if (result.succeeded.length > 0) {
        notify.success(`ลบสำเร็จ ${result.succeeded.length} ไฟล์${result.failed.length ? `, ล้มเหลว ${result.failed.length} ไฟล์` : ''}`)
      }
      if (result.failed.length > 0) {
        const reasons = [...new Set(result.failed.map((f) => f.reason))]
        Swal.fire({
          icon: 'warning',
          title: `ลบไม่สำเร็จ ${result.failed.length} ไฟล์`,
          html: reasons.map((r) => `<p style="margin:4px 0">${r}</p>`).join(''),
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#0891b2',
        })
      }
      setSelected(new Set())
    } catch {
      notify.error('ไม่สามารถลบได้')
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportAdminFilesCsv()
    } catch {
      notify.error('ไม่สามารถ export ได้')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async (file: AdminFileListItem) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: `ลบไฟล์ "${file.file_name}"?`,
      html: `เจ้าของไฟล์: <b>${file.owner_username ?? '-'}</b>`,
      input: 'textarea',
      inputLabel: 'เหตุผลในการลบ (จำเป็น)',
      inputPlaceholder: 'ระบุเหตุผล เช่น ไฟล์ผิดกฎหมาย, สแปม ฯลฯ',
      showCancelButton: true,
      confirmButtonText: 'ลบไฟล์',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
      background: '#0f172a',
      color: '#fff',
      inputValidator: (value) => (!value?.trim() ? 'กรุณาระบุเหตุผล' : undefined),
    })
    if (!isConfirmed || !reason) return

    setBusyAid(file.aid)
    try {
      await deleteMutation.mutateAsync({ aid: file.aid, reason: reason.trim() })
      notify.success('ลบไฟล์สำเร็จ')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'ไม่สามารถลบไฟล์ได้')
    } finally {
      setBusyAid(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">จัดการไฟล์</h1>
          <p className="text-blue-200/50 text-sm mt-1">
            ไฟล์ทั้งหมดในระบบจากทุกผู้ใช้ — ลบไฟล์ที่ไม่เหมาะสมได้ (ตามกฎเดียวกับการแบนผู้ใช้)
          </p>
        </div>
        <button
          disabled={isExporting}
          onClick={handleExport}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition disabled:opacity-40"
        >
          <i className="fas fa-file-csv mr-2" />
          Export CSV
        </button>
      </div>

      {selected.size > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
          <span className="text-red-300 text-sm font-medium">เลือกแล้ว {selected.size} ไฟล์</span>
          <div className="flex gap-2">
            <button
              disabled={isBulkBusy}
              onClick={handleBulkDelete}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition text-sm disabled:opacity-40"
            >
              ลบที่เลือกทั้งหมด
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition"
            >
              ยกเลิกการเลือก
            </button>
          </div>
        </div>
      )}

      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
            <label className="block text-sm text-blue-200/60 mb-2">สถานะ</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-slate-800">{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-blue-200/60 mb-2">ความเป็นส่วนตัว</label>
            <select
              value={privacyFilter}
              onChange={(e) => setPrivacyFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
            >
              <option value="all" className="bg-slate-800">ทั้งหมด</option>
              <option value="public" className="bg-slate-800">Public</option>
              <option value="private" className="bg-slate-800">Private</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <input
                type="checkbox"
                checked={selected.size === items.length}
                onChange={toggleSelectAll}
                className="accent-cyan-500 w-4 h-4"
              />
            )}
            <h2 className="text-white font-semibold text-lg">รายการไฟล์</h2>
          </div>
          {pagination && <span className="text-blue-200/50 text-sm">ทั้งหมด {pagination.total} รายการ</span>}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-white font-medium mb-1">ไม่พบไฟล์</p>
            <p className="text-blue-200/50 text-sm">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((file) => (
              <div
                key={file.aid}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selected.has(file.aid)}
                    onChange={() => toggleSelect(file.aid)}
                    className="accent-cyan-500 w-4 h-4 shrink-0"
                  />
                  <div className="w-11 h-11 shrink-0 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <span className="text-cyan-400 text-xs font-bold uppercase">{file.file_type ?? '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-white font-medium truncate" title={file.file_name ?? '-'}>{file.file_name ?? '-'}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          file.privacy
                            ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20'
                            : 'text-green-400 bg-green-500/10 border border-green-500/20'
                        }`}
                      >
                        {file.privacy ? 'PRIVATE' : 'PUBLIC'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[file.status ?? ''] ?? STATUS_BADGE.pending}`}>
                        {STATUS_LABEL[file.status ?? ''] ?? file.status ?? '-'}
                      </span>
                      {file.is_malicious && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20">
                          มัลแวร์
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-blue-200/50">
                      {file.owner_uid ? (
                        <Link href={`/admin/users/${file.owner_uid}`} className="hover:text-cyan-300 transition">
                          <i className="fas fa-user mr-1" />
                          {file.owner_username ?? '-'}
                        </Link>
                      ) : (
                        <span>{file.owner_username ?? '-'}</span>
                      )}
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

                <div className="flex items-center gap-2 shrink-0">
                  {file.task_id && (
                    <Link href={`/reports/${file.task_id}`} className="text-cyan-400 text-sm hover:text-cyan-300 transition px-2">
                      ดูรายงาน →
                    </Link>
                  )}
                  <button
                    disabled={busyAid === file.aid}
                    onClick={() => handleDelete(file)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-40"
                  >
                    <i className="fas fa-trash mr-1" />
                    ลบไฟล์
                  </button>
                </div>
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
  )
}
