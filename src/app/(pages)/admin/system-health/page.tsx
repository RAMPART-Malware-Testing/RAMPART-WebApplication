'use client'

import { useState } from 'react'
import { useAdminSystemHealth, HEALTH_CHECK_NAMES } from '@/hooks/queries/useAdminSystemHealth'

const STATUS_COLORS: Record<string, string> = {
  up: 'text-green-400 bg-green-500/10 border-green-500/20',
  down: 'text-red-400 bg-red-500/10 border-red-500/20',
  degraded: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  unconfigured: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  checking: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  up: 'ปกติ',
  down: 'ล่ม',
  degraded: 'ผิดปกติ',
  unconfigured: 'ยังไม่ตั้งค่า',
  checking: 'กำลังตรวจสอบ...',
}

const NAME_LABELS: Record<string, string> = {
  postgresql: 'ฐานข้อมูล PostgreSQL',
  redis: 'Redis',
  celery_workers: 'Celery Workers',
  mobsf: 'MobSF',
  cape: 'CAPE Sandbox',
  rampart_ai: 'RampartAI',
  disk_space: 'พื้นที่ดิสก์',
  memory: 'หน่วยความจำ (RAM)',
}

type DisplayHealthCheck = Omit<HealthCheckItem, 'status'> & { status: HealthCheckItem['status'] | 'checking' }

export default function SystemHealthPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { data, isLoading, isFetching, refetch } = useAdminSystemHealth(autoRefresh)
  const load = () => { refetch() }

  const checksByName = new Map((data?.checks ?? []).map((c) => [c.name, c]))
  const displayChecks: DisplayHealthCheck[] = HEALTH_CHECK_NAMES.map(
    (name) => checksByName.get(name) ?? { name, status: 'checking' as const, latency_ms: null, detail: null },
  )

  const overallColor =
    !data
      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
      : data.overall_status === 'up'
        ? 'text-green-400 bg-green-500/10 border-green-500/20'
        : data.overall_status === 'down'
          ? 'text-red-400 bg-red-500/10 border-red-500/20'
          : 'text-amber-400 bg-amber-500/10 border-amber-500/20'

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">สถานะระบบ</h1>
          <p className="text-blue-200/50 text-sm mt-1">ตรวจสอบสุขภาพของระบบทั้งหมดแบบเรียลไทม์</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-blue-200/60 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="accent-cyan-500" />
            รีเฟรชอัตโนมัติ (15s)
          </label>
          <button
            onClick={load}
            disabled={isFetching}
            className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition text-sm disabled:opacity-50"
          >
            <i className={`fas fa-rotate mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'กำลังรีเฟรช...' : 'รีเฟรชตอนนี้'}
          </button>
        </div>
      </div>

      <div className={`rounded-2xl p-6 border flex items-center justify-between ${overallColor}`}>
        <div>
          <p className="text-sm opacity-70">สถานะโดยรวม</p>
          <p className="text-2xl font-bold">
            {!data ? 'กำลังตรวจสอบระบบ...' : STATUS_LABELS[data.overall_status]}
          </p>
        </div>
        <p className="text-xs opacity-60">
          {data
            ? `อัปเดตล่าสุด: ${new Date(data.checked_at).toLocaleString('th-TH')}`
            : 'กำลังเชื่อมต่อ PostgreSQL, Redis, Celery และเครื่องมือวิเคราะห์ทั้งหมด...'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayChecks.map((check) => (
          <div key={check.name} className={`rounded-2xl p-5 border transition-colors ${STATUS_COLORS[check.status]}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-white">{NAME_LABELS[check.name] || check.name}</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${STATUS_COLORS[check.status]}`}>
                {check.status === 'checking' && (
                  <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {STATUS_LABELS[check.status]}
              </span>
            </div>
            {check.latency_ms !== null && check.latency_ms !== undefined && (
              <p className="text-xs opacity-60">latency: {check.latency_ms}ms</p>
            )}
            {check.detail && <p className="text-xs opacity-70 mt-1">{check.detail}</p>}
            {check.workers && check.workers.length > 0 && (
              <div className="mt-2 space-y-1">
                {check.workers.map((w) => (
                  <p key={w.name} className="text-xs opacity-60">
                    {w.name}: active={w.active_tasks} reserved={w.reserved_tasks}
                  </p>
                ))}
              </div>
            )}
            {check.percent_used !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${check.percent_used < 85 ? 'bg-green-500' : check.percent_used < 95 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${check.percent_used}%` }}
                  />
                </div>
                {check.total_gb !== undefined && (
                  <p className="text-xs opacity-60 mt-1">
                    {(check.used_gb ?? check.total_gb - (check.available_gb ?? 0)).toFixed(2)} / {check.total_gb.toFixed(2)} GB
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!isLoading && !data && (
        <div className="text-center py-6 text-blue-200/50">ไม่สามารถโหลดข้อมูลสถานะระบบได้ ลองรีเฟรชอีกครั้ง</div>
      )}
    </div>
  )
}
