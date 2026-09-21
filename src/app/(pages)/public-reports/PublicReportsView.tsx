'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NavbarComponent from '@/components/NavbarComponent'
import Navbarservice from '@/components/Navbarservice'
import { usePublicReports, type PublicReportsSortField } from '@/hooks/queries/usePublicReports'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

const FILE_TYPES = ['apk', 'exe', 'msi', 'bat', 'dmg', 'ipa', 'zip']
const STATUS_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'success', label: 'สำเร็จ' },
  { value: 'processing', label: 'กำลังวิเคราะห์' },
  { value: 'failed', label: 'ไม่สำเร็จ' },
  { value: 'pending', label: 'รอดำเนินการ' },
]

type SortField = PublicReportsSortField

export default function PublicReportsView({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [fileType, setFileType] = useState('all')

  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)

  const [page, setPage] = useState(1)

  const { data: result, isLoading } = usePublicReports({
    page,
    limit: 5,
    s: search || undefined,
    status: status !== 'all' ? status : undefined,
    file_type: fileType !== 'all' ? fileType : undefined,
    sort: sortField,
    dir: sortDir,
  })
  const items = result?.data ?? []
  const pagination = result?.pagination ?? null

  useEffect(() => {
    setPage(1)
  }, [search, status, fileType, sortField, sortDir])

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

  const getprivacyColor = (score: boolean | null) => {
    if (score === null) return 'text-gray-400'
    if (score == false) return 'text-purple-400'
    if (score == true) return 'text-green-400'
    return 'text-green-400'
  }

  const getStatusBadge = (s: string | null) => {
    switch (s) {
      case 'success': return 'bg-emerald-500/10 text-emerald-400'
      case 'failed': return 'bg-rose-500/10 text-rose-400'
      default: return 'bg-amber-500/10 text-amber-400'
    }
  }
  const getprivacyBadge = (s: boolean | null) => {
    switch (s) {
      case true: return 'text-green-400 bg-green-500/10 border border-green-500/20'
      case false: return 'text-purple-400 bg-purple-500/10 border border-purple-500/20'
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

  const dangerTier = (score: number) => {
    if (score >= 80) return { label: 'อันตรายร้ายแรง', text: 'text-red-400', bar: 'bg-red-500', chip: 'bg-red-500/10 border-red-500/20' }
    if (score >= 60) return { label: 'อันตราย', text: 'text-orange-400', bar: 'bg-orange-500', chip: 'bg-orange-500/10 border-orange-500/20' }
    if (score >= 30) return { label: 'ความเสี่ยงปานกลาง', text: 'text-amber-400', bar: 'bg-amber-500', chip: 'bg-amber-500/10 border-amber-500/20' }
    return { label: 'ปลอดภัย', text: 'text-emerald-400', bar: 'bg-emerald-500', chip: 'bg-emerald-500/10 border-emerald-500/20' }
  }

  const RISK_LEVEL_STYLES: Record<string, string> = {
    Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Caution: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    High: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    Critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  const clamp = (v: number) => Math.max(0, Math.min(100, v))

  const toolChips = (item: AnalysisHistoryItem) => {
    const r = item.report
    const aiRaw = r?.rampart_ai_score ?? null
    const aiScore = aiRaw == null ? null
    : typeof aiRaw === 'number' ? clamp(aiRaw)
    : aiRaw.malware_probability != null ? clamp(Number(aiRaw.malware_probability) * 100)
    : null
    const listed = (item.tools ?? '').split(',').map((t) => t.trim()).filter(Boolean)
    const defs = [
      { key: 'virustotal', label: 'VT', title: 'VirusTotal', value: r?.virustotal_score ?? null },
      { key: 'mobsf', label: 'MobSF', title: 'MobSF Static Analysis', value: r?.mobsf_score ?? null },
      { key: 'cape', label: 'CAPE', title: 'CAPE Sandbox', value: r?.cape_score ?? null },
      { key: 'rampart_ai', label: 'AI', title: 'RampartAI', value: aiScore },
    ]
    if (listed.length > 0) {
      return defs.filter((d) => listed.some((t) => t === d.key || (d.key === 'rampart_ai' && (t === 'rampart' || t === 'rampartai'))))
    }
    return defs.filter((d) => d.value != null)
  }

  const SORT_OPTIONS: { value: SortField; label: string }[] = [
    { value: 'created_at', label: 'วันที่' },
    { value: 'file_name', label: 'ชื่อไฟล์' },
    { value: 'file_size', label: 'ขนาด' },
    { value: 'score', label: 'ความเสี่ยง' },
  ]

  const reportHref = (item: AnalysisHistoryItem) => `/scan/analysis?taskId=${item.task_id}`

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      {isLoggedIn ? <NavbarComponent /> : <Navbarservice />}

      <div className={`max-w-6xl mx-auto space-y-5 ${isLoggedIn ? 'mt-6' : 'pt-24'}`}>

        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-white">รายงานสาธารณะ</h1>
          <p className="text-blue-200/50 text-sm mt-1">
            รายงานการวิเคราะห์ที่เจ้าของไฟล์เปิดเผยต่อสาธารณะ — เข้าดูได้ทุกคน
          </p>
          {!isLoggedIn && (
            <p className="text-amber-300/70 text-xs mt-2">
              <i className="fas fa-circle-info mr-1" />
              ยังไม่ได้เข้าสู่ระบบ: ดูรายการได้ทุกคน แต่การเปิดรายละเอียดฉบับเต็มต้องเข้าสู่ระบบก่อน
            </p>
          )}
        </div>

        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

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

        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold text-lg">รายการทั้งหมด</h2>
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
                  href={reportHref(item)}
                  className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 shrink-0 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold uppercase">
                      {item.file_type ?? '?'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="text-white text-sm font-medium truncate" title={item.file_name ?? undefined}>{item.file_name ?? '-'}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getprivacyColor(item.privacy)} ${getprivacyBadge(item.privacy)}`}>
                          {item.privacy ? 'PUBLIC' : 'PRIVATE'}
                        </span>
                        {item.report?.risk_level && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${RISK_LEVEL_STYLES[item.report.risk_level] ?? 'text-orange-400 bg-orange-500/10 border-orange-500/20'}`}>
                            {item.report.risk_level}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatSize(item.file_size)} • {formatDate(item.created_at)}
                      </p>
                      {item.uploaded_by && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="h-4 w-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[8px] font-bold text-white overflow-hidden">
                            {item.uploaded_by.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={`${SERVER_URL}${item.uploaded_by.avatar_url}`} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              (item.uploaded_by.username || '?').charAt(0).toUpperCase()
                            )}
                          </span>
                          <span className="text-[11px] text-slate-400">{item.uploaded_by.username}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {item.status && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    )}
                    {item.report?.score != null ? (
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <span className={`text-sm font-bold font-mono ${dangerTier(item.report.score).text}`}>
                          {Math.round(item.report.score)}/100
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${dangerTier(item.report.score).chip} ${dangerTier(item.report.score).text}`}>
                          {dangerTier(item.report.score).label}
                        </span>
                        {toolChips(item).map((c) => {
                          const tier = c.value != null ? dangerTier(c.value) : null
                          return (
                            <span
                              key={c.key}
                              title={c.value != null ? `${c.title}: ${Math.round(c.value)}/100` : `${c.title}: ไม่มีข้อมูล`}
                              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${tier ? tier.chip + ' ' + tier.text : 'text-slate-500 bg-slate-800/50 border-slate-600/40'}`}
                            >
                              {c.label} {c.value != null ? Math.round(c.value) : '–'}
                            </span>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">{item.status === 'processing' ? 'กำลังวิเคราะห์...' : '–'}</span>
                    )}
                    <i className="fas fa-chevron-right text-slate-500 text-xs group-hover:translate-x-1 group-hover:text-cyan-400 transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}

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
