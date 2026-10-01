'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import NavbarComponent from '@/components/NavbarComponent'
import { usePublicReports, type PublicReportItem } from '@/hooks/queries/usePublicReports'
import { fileTypeLabel, hasFileType } from '@/lib/file-type'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL
const PAGE_SIZE = 5
const FILE_TYPES = ['apk', 'xapk', 'exe', 'msi', 'bat', 'dmg', 'ipa', 'zip', 'pkt']
const STATUS_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'success', label: 'สำเร็จ' },
  { value: 'processing', label: 'กำลังวิเคราะห์' },
  { value: 'failed', label: 'ไม่สำเร็จ' },
  { value: 'pending', label: 'รอดำเนินการ' },
]

type SortField = 'created_at' | 'file_name' | 'file_size' | 'score'

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'created_at', label: 'วันที่' },
  { value: 'file_name', label: 'ชื่อไฟล์' },
  { value: 'file_size', label: 'ขนาด' },
  { value: 'score', label: 'ความเสี่ยง' },
]

const clamp = (v: number) => Math.max(0, Math.min(100, v))

function dangerTier(score: number) {
  if (score >= 80) return { label: 'อันตรายร้ายแรง', text: 'text-red-400', chip: 'bg-red-500/10 border-red-500/20' }
  if (score >= 60) return { label: 'อันตราย', text: 'text-orange-400', chip: 'bg-orange-500/10 border-orange-500/20' }
  if (score >= 30) return { label: 'ความเสี่ยงปานกลาง', text: 'text-amber-400', chip: 'bg-amber-500/10 border-amber-500/20' }
  return { label: 'ปลอดภัย', text: 'text-emerald-400', chip: 'bg-emerald-500/10 border-emerald-500/20' }
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  success: { label: 'สำเร็จ', cls: 'text-green-400 bg-green-500/10 border-green-500/20' },
  processing: { label: 'กำลังวิเคราะห์', cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  pending: { label: 'รอดำเนินการ', cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  failed: { label: 'ไม่สำเร็จ', cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

const toolChips = (item: PublicReportItem) => {
  const r = item.report
  const aiRaw = r?.rampart_ai_score ?? null
  const aiValue = aiRaw == null ? null
    : typeof aiRaw === 'number' ? clamp(aiRaw)
    : aiRaw.malware_probability != null ? clamp(Number(aiRaw.malware_probability) * 100)
    : null
  const listed = (item.tools ?? '').split(',').map((t) => t.trim()).filter(Boolean)
  const defs = [
    { key: 'virustotal', label: 'VT', title: 'VirusTotal', value: r?.virustotal_score ?? null },
    { key: 'mobsf', label: 'MobSF', title: 'MobSF Static Analysis', value: r?.mobsf_score ?? null },
    { key: 'cape', label: 'CAPE', title: 'CAPE Sandbox', value: r?.cape_score ?? null },
    { key: 'rampart_ai', label: 'AI', title: 'RampartAI', value: aiValue },
  ]
  if (listed.length > 0) {
    return defs.filter((d) => listed.some((t) => t === d.key || (d.key === 'rampart_ai' && (t === 'rampart' || t === 'rampartai'))))
  }
  return defs.filter((d) => d.value != null)
}

const formatSize = (bytes?: number | null) => {
  if (!bytes) return '-'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatDate = (dateStr?: string | null) =>
  dateStr ? new Date(dateStr).toLocaleString('th-TH') : '-'

export default function PublicFilesPage() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [fileType, setFileType] = useState('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [query, status, fileType, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 1 ? -1 : 1))
    } else {
      setSortField(field)
      setSortDir(-1)
    }
  }

  const { data: result, isLoading, isFetching } = usePublicReports({
    page,
    limit: PAGE_SIZE,
    s: query || undefined,
    status: status !== 'all' ? status : undefined,
    file_type: fileType !== 'all' ? fileType : undefined,
    created_at: sortField === 'created_at' ? sortDir : 0,
    file_name: sortField === 'file_name' ? sortDir : 0,
    file_size: sortField === 'file_size' ? sortDir : 0,
    score: sortField === 'score' ? sortDir : 0,
  })

  const items = result?.data ?? []
  const pagination = result?.pagination ?? null

  const goToPage = (next: number) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <NavbarComponent />

      <div className="max-w-7xl mx-auto mt-6">
        <div className="mb-4 flex items-center gap-3">
          <i className="fas fa-globe text-blue-400" />
          <div>
            <h1 className="text-white font-semibold text-lg">ไฟล์สาธารณะ (Public)</h1>
            <p className="text-slate-400 text-sm">รายงานที่เปิดให้ทุกคนดูได้</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="lg:order-2 lg:sticky lg:top-20 bg-white/5 rounded-2xl p-5 border border-white/10">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <i className="fas fa-filter text-cyan-400" />
            ตัวกรอง
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm text-blue-200/60 mb-2">ค้นหาไฟล์</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาด้วยชื่อไฟล์ หรือ Hash..."
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-blue-200/60 mb-2">สถานะ</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-slate-800">{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-blue-200/60 mb-2">ประเภทไฟล์</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              >
                <option value="all" className="bg-slate-800">ทั้งหมด</option>
                {FILE_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-slate-800">{t.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-blue-200/50 text-sm">เรียงตาม:</span>
            {SORT_OPTIONS.map((o) => (
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


        <div className="lg:order-1 bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold text-lg">รายการทั้งหมด</h2>
            {pagination && (
              <span className="text-blue-200/50 text-sm">ทั้งหมด {pagination.total} รายการ</span>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-white font-medium mb-1">ไม่พบไฟล์สาธารณะ</p>
              <p className="text-blue-200/50 text-sm">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
            </div>
          ) : (
            <div className={`space-y-3 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
              {items.map((item) => {
                const score = item.report?.score != null ? Number(item.report.score) : null
                const tier = score != null ? dangerTier(score) : null
                const chips = toolChips(item)
                const badge = item.status ? STATUS_BADGE[item.status] : null
                return (
                  <Link
                    key={item.aid}
                    href={`/scan/analysis?taskId=${item.task_id}`}
                    className="flex flex-col gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition group sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">

                      <div className="w-11 h-11 shrink-0 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-105 transition">
                        <span
                          title={hasFileType(item.file_type) ? `ประเภทไฟล์: ${fileTypeLabel(item.file_type)}` : 'ไม่ระบุประเภทไฟล์'}
                          className={`font-bold uppercase ${hasFileType(item.file_type) ? 'text-cyan-400 text-xs' : 'text-slate-500 text-[10px]'}`}
                        >
                          {fileTypeLabel(item.file_type)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-white font-medium truncate" title={item.file_name ?? '-'}>{item.file_name ?? '-'}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20">
                            PUBLIC
                          </span>
                          {badge && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badge.cls}`}>
                              {badge.label}
                            </span>
                          )}
                          {item.report?.risk_level && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium border text-slate-300 bg-white/5 border-white/10">
                              {item.report.risk_level}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-blue-200/50">
                          <span>{formatSize(item.file_size)}</span>
                          <span>•</span>
                          <span>{formatDate(item.created_at)}</span>
                          {item.uploaded_by?.username && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1.5" title={`อัปโหลดโดย ${item.uploaded_by.username}`}>
                                <span className="h-4 w-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[8px] font-bold text-white overflow-hidden">
                                  {item.uploaded_by.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={`${SERVER_URL}${item.uploaded_by.avatar_url}`}
                                      alt="avatar"
                                      width={16}
                                      height={16}
                                      loading="lazy"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    item.uploaded_by.username.charAt(0).toUpperCase()
                                  )}
                                </span>
                                <span className="text-[11px] text-slate-400">{item.uploaded_by.username}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 sm:justify-end">
                      {score != null && tier ? (
                        <div className="text-left sm:text-right">
                          <div className="flex items-center justify-start sm:justify-end gap-2 flex-wrap">
                            <span className={`text-xl font-bold font-mono ${tier.text}`}>
                              {Math.round(score)}
                              <span className="text-xs font-normal text-slate-500">/100</span>
                            </span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${tier.chip} ${tier.text}`}>
                              {tier.label}
                            </span>
                          </div>
                          {chips.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap justify-start sm:justify-end gap-1.5">
                              {chips.map((c) => {
                                const chipTier = c.value != null ? dangerTier(c.value) : null
                                return (
                                  <span
                                    key={c.key}
                                    title={c.value != null ? `${c.title}: ${Math.round(c.value)}/100` : `${c.title}: ไม่มีข้อมูล`}
                                    className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${chipTier ? chipTier.chip + ' ' + chipTier.text : 'text-slate-500 bg-slate-800/50 border-slate-600/40'}`}
                                  >
                                    {c.label} {c.value != null ? Math.round(c.value) : '–'}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">{item.status === 'processing' ? 'กำลังวิเคราะห์...' : '–'}</span>
                      )}
                      <span className="text-cyan-400 shrink-0">→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {pagination && (
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">
              <button
                disabled={!pagination.has_prev || isFetching}
                onClick={() => goToPage(page - 1)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
              >
                ← ก่อนหน้า
              </button>

              <span className="text-blue-200/50 text-sm">
                หน้า {pagination.page} / {pagination.total_pages}
              </span>

              <button
                disabled={!pagination.has_next || isFetching}
                onClick={() => goToPage(page + 1)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
              >
                ถัดไป →
              </button>
            </div>
          )}
        </div>
        </div>

      </div>
    </div>
  )
}
