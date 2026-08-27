'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import {
  useAdminTaskQueueList,
  useAdminTaskQueueDepth,
  useAdminRetryTask,
  useAdminCancelTask,
} from '@/hooks/queries/useAdminTaskQueue'

const STATUS_OPTIONS = [
  { value: '', label: 'กำลังทำงาน (ทั้งหมด)' },
  { value: 'dispatching', label: 'กำลังส่งงาน' },
  { value: 'queued', label: 'รอในคิว' },
  { value: 'processing', label: 'กำลังวิเคราะห์' },
  { value: 'success', label: 'สำเร็จ' },
  { value: 'failed', label: 'ล้มเหลว' },
]

function formatAge(seconds: number | null) {
  if (seconds === null) return '-'
  if (seconds < 60) return `${seconds} วินาที`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} นาที`
  return `${Math.floor(seconds / 3600)} ชั่วโมง`
}

export default function TaskQueuePage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)
  const notify = useToast()

  const { data: listResult, isLoading } = useAdminTaskQueueList({
    page,
    limit: 20,
    status: statusFilter || undefined,
    q: search || undefined,
  })
  const items = listResult?.data ?? []
  const pagination = listResult?.pagination ?? null

  const { data: depth } = useAdminTaskQueueDepth()
  const retryMutation = useAdminRetryTask()
  const cancelMutation = useAdminCancelTask()

  useEffect(() => {
    setPage(1)
  }, [statusFilter, search])

  const handleRetry = async (taskId: string) => {
    setBusyTaskId(taskId)
    try {
      const result = await retryMutation.mutateAsync(taskId)
      notify.success(result.message)
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'ไม่สามารถส่ง task ใหม่ได้')
    } finally {
      setBusyTaskId(null)
    }
  }

  const handleCancel = async (taskId: string) => {
    setBusyTaskId(taskId)
    try {
      const result = await cancelMutation.mutateAsync(taskId)
      notify.success(result.message)
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'ไม่สามารถยกเลิก task ได้')
    } finally {
      setBusyTaskId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">คิวงานวิเคราะห์</h1>
        <p className="text-blue-200/50 text-sm mt-1">จัดการงานวิเคราะห์ที่กำลังทำงานอยู่ในระบบ Celery</p>
      </div>

      {depth && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200/50 text-xs">Workers ออนไลน์</p>
            <p className="text-2xl font-bold text-white">{depth.workers_online}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200/50 text-xs">กำลังทำงาน</p>
            <p className="text-2xl font-bold text-cyan-400">{depth.active}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200/50 text-xs">จองไว้</p>
            <p className="text-2xl font-bold text-amber-400">{depth.reserved}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200/50 text-xs">รอกำหนดการ</p>
            <p className="text-2xl font-bold text-purple-400">{depth.scheduled}</p>
          </div>
        </div>
      )}

      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-blue-200/60 mb-2">ค้นหา</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาด้วยชื่อไฟล์, task_id..."
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
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">รายการงาน</h2>
          {pagination && <span className="text-blue-200/50 text-sm">ทั้งหมด {pagination.total} รายการ</span>}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-white font-medium mb-1">ไม่มีงานที่กำลังทำงานอยู่</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.aid} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-white font-medium truncate">{item.file_name ?? '-'}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20">
                      {item.status ?? '-'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-blue-200/50">
                    <span>{item.owner_username ?? '-'}</span>
                    <span>•</span>
                    <span>อายุ: {formatAge(item.age_seconds)}</span>
                    <span>•</span>
                    <span className="font-mono text-xs">{item.task_id}</span>
                  </div>
                  {item.tool_notes && <p className="text-amber-300/70 text-xs mt-1">{item.tool_notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={busyTaskId === item.task_id}
                    onClick={() => item.task_id && handleRetry(item.task_id)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition disabled:opacity-40"
                  >
                    <i className="fas fa-rotate-right mr-1" />
                    ลองใหม่
                  </button>
                  <button
                    disabled={busyTaskId === item.task_id}
                    onClick={() => item.task_id && handleCancel(item.task_id)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-40"
                  >
                    <i className="fas fa-ban mr-1" />
                    ยกเลิก
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
