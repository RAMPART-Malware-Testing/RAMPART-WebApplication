'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { useAdminRateLimits, useAdminClearRateLimit } from '@/hooks/queries/useAdminRateLimits'

export default function RateLimitsPage() {
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const notify = useToast()

  const { data, isLoading, refetch } = useAdminRateLimits()
  const clearMutation = useAdminClearRateLimit()

  const load = () => { refetch() }

  const handleClear = async (key: string) => {
    setBusyKey(key)
    try {
      const result = await clearMutation.mutateAsync(key)
      notify.success(result.message)
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'ไม่สามารถปลดล็อกได้')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">ตรวจจับการใช้งานผิดปกติ</h1>
          <p className="text-blue-200/50 text-sm mt-1">รายการบัญชี/อุปกรณ์ที่ถูกล็อกจากการใช้งานเกินขีดจำกัด (Rate Limit)</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition text-sm"
        >
          <i className="fas fa-rotate mr-2" />
          รีเฟรช
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-blue-200/50">ไม่สามารถโหลดข้อมูลได้</div>
      ) : (
        <>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <p className="text-blue-200/50 text-sm">ทั้งหมดที่ถูกล็อกอยู่ตอนนี้</p>
            <p className="text-3xl font-bold text-white">{data.total_locked}</p>
          </div>

          {data.groups.map((group) => (
            <div key={group.pattern} className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">{group.label}</h2>
                <span className="text-blue-200/50 text-sm">{group.count} รายการ</span>
              </div>
              {group.entries.length === 0 ? (
                <p className="text-blue-200/40 text-sm py-4 text-center">ไม่มีรายการที่ถูกล็อก</p>
              ) : (
                <div className="space-y-2">
                  {group.entries.map((entry) => (
                    <div key={entry.key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <p className="text-white text-sm font-mono">{entry.identifier}</p>
                        {entry.ttl_seconds !== null && (
                          <p className="text-amber-300/70 text-xs">เหลืออีก {entry.ttl_seconds} วินาที</p>
                        )}
                      </div>
                      <button
                        disabled={busyKey === entry.key}
                        onClick={() => handleClear(entry.key)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-40"
                      >
                        ปลดล็อก
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
