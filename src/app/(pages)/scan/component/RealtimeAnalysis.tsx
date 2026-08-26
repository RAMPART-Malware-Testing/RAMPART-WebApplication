"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import axios from "axios"
import { AnalysisTimeline } from "./AnalysisTimeline"
import GeometricLoader from "@/components/GeometricLoader"
import ReportDownload from "../../details/[tool]/[taskid]/components/ReportDownload"
import type { AnalysisResponse, TaskStatus } from "./types"

interface ToolProgress { status?: unknown; score?: number }
interface TaskProgress { stage?: string; message?: string; tools?: Record<string, ToolProgress> }
interface TaskPoll { success: boolean; task_id: string; status?: string; message?: string; progress?: TaskProgress; report?: any }

function normalizeToolStatus(v?: unknown): TaskStatus {
  if (v === true || v === "success" || v === "completed") return "completed"
  if (v === false) return "failed"
  if (v === "skipped") return "skipped"
  if (v === "processing" || v === "pending" || v === "running" || v === "queued") return "running"
  return "waiting"
}

function deriveToolStatuses(progress?: TaskProgress): { virustotal: TaskStatus; mobsf: TaskStatus; cape: TaskStatus; ml: TaskStatus; gemini: TaskStatus } {
  const s = { virustotal: "waiting" as TaskStatus, mobsf: "waiting" as TaskStatus, cape: "waiting" as TaskStatus, ml: "waiting" as TaskStatus, gemini: "waiting" as TaskStatus }

  // Authoritative per-tool statuses when the backend provides them
  // (published during the gemini / finalise phase).
  const toolsExec = progress?.tools
  const hasTools = !!(toolsExec && Object.keys(toolsExec).length)
  if (hasTools && toolsExec) {
    Object.entries(toolsExec).forEach(([k, v]) => {
      const status = normalizeToolStatus(v?.status)
      if (k === "virustotal") s.virustotal = status
      else if (k === "mobsf") s.mobsf = status
      else if (k === "cape") s.cape = status
      else if (k === "rampart_ai") s.ml = status
      else if (k === "gemini") s.gemini = status
    })
    return s
  }

  // Stage-based, sequential: only ONE stage runs at a time. As the pipeline
  // advances, earlier stages flip to "completed" instead of staying "running",
  // so two stages never appear active simultaneously.
  const stage = progress?.stage
  if (stage === "virustotal") {
    s.virustotal = "running"
  } else if (stage === "sandboxes" || stage === "mobsf") {
    s.virustotal = "completed"
    s.mobsf = "running"
  } else if (stage === "cape") {
    s.mobsf = "completed"
    s.cape = "running"
  } else if (stage === "rampartai" || stage === "rampart") {
    s.mobsf = "completed"
    s.cape = "completed"
    s.ml = "running"
  } else if (stage === "gemini") {
    s.gemini = "running"
  }

  return s
}

function emptyAnalysis(): AnalysisResponse {
  return {
    fileId: "",
    fileName: "กำลังโหลดสถานะ...",
    overallStatus: "analyzing",
    virusTotal: { status: "waiting", detectionCount: 0, totalEngines: 0 },
    mobsf: { status: "waiting" },
    cape: { status: "waiting" },
    ml: { status: "waiting" },
    gemini: { status: "waiting" },
  }
}

function sumStats(stats?: Record<string, number>): number {
  if (!stats) return 0
  return Object.values(stats).reduce((a, b) => a + (Number(b) || 0), 0)
}

function mapRisk(risk?: string): "Low" | "Medium" | "High" | "Critical" | undefined {
  const r = (risk || "").toLowerCase()
  if (r.includes("critical")) return "Critical"
  if (r.includes("high") || r.includes("severe")) return "High"
  if (r.includes("medium")) return "Medium"
  return undefined
}

function buildReport(report: any, raw: Record<string, any>): AnalysisResponse {
  const tools: string[] = (report?.tools ?? "").split(",").map((t: string) => t.trim()).filter(Boolean)
  const vt = raw.virustotal
  const vtStats = vt?.data?.attributes?.last_analysis_stats
  const vtDetection = Number(vtStats?.malicious || 0)
  const vtTotal = sumStats(vtStats)
  const ms = raw.mobsf?.appsec ?? raw.mobsf ?? {}
  const cape = raw.cape ?? {}
  const rpred = report?.rampart_ai_score
  const rscore = rpred && typeof rpred === "object"
    ? (rpred.malware_probability != null ? Number(rpred.malware_probability) * 100 : undefined)
    : (rpred != null ? Number(rpred) : undefined)
  const mlPrediction = rpred && typeof rpred === "object" && typeof rpred.prediction === "string"
    ? (rpred.prediction === "malware" ? "Malware" : "Benign")
    : (rscore != null ? (rscore >= 50 ? "Malware" : "Benign") : undefined)

  return {
    fileId: report?.task_id,
    fileName: report?.file_name || "ไม่ทราบชื่อไฟล์",
    overallStatus: "completed",
    finalResult: vtDetection > 0 ? "Malware" : "Benign",
    virusTotal: {
      status: raw.virustotal || tools.includes("virustotal") ? "completed" : "skipped",
      detectionCount: vtDetection,
      totalEngines: vtTotal,
    },
    mobsf: {
      status: raw.mobsf || tools.includes("mobsf") ? "completed" : "skipped",
      permissions: Array.isArray(ms.permissions) ? ms.permissions.length : ms.permissions_count,
      activities: Array.isArray(ms.activities) ? ms.activities.length : undefined,
      services: Array.isArray(ms.services) ? ms.services.length : undefined,
      receivers: Array.isArray(ms.receivers) ? ms.receivers.length : undefined,
      riskScore: ms.security_score != null ? Math.round(100 - Number(ms.security_score)) : undefined,
    },
    cape: {
      status: raw.cape || tools.includes("cape") ? "completed" : "skipped",
      network: Array.isArray(cape.network) ? cape.network.length : undefined,
      registry: Array.isArray(cape.registry) ? cape.registry.length : undefined,
      files: Array.isArray(cape.files) ? cape.files.length : undefined,
      processes: Array.isArray(cape.processes) ? cape.processes.length : undefined,
    },
    ml: {
      status: rpred != null ? "completed" : "skipped",
      prediction: mlPrediction,
      confidence: rscore != null ? Math.round(rscore) : undefined,
      modelConfidence: rpred && typeof rpred === "object" && rpred.confidence != null ? Number(rpred.confidence) : undefined,
      benignProbability: rpred && typeof rpred === "object" && rpred.benign_probability != null ? Number(rpred.benign_probability) : undefined,
      malwareProbability: rpred && typeof rpred === "object" && rpred.malware_probability != null ? Number(rpred.malware_probability) : undefined,
    },
    gemini: {
      status: report ? "completed" : "skipped",
      summary: report?.analysis_summary,
      recommendation: report?.recommendation,
      overallRisk: mapRisk(report?.risk_level),
    },
  }
}

async function fetchToolReports(taskId: string, tools: string[]): Promise<Record<string, any>> {
  const raw: Record<string, any> = {}
  const routes = ["virustotal", "mobsf", "cape", "rampartai"]
  for (const t of tools) {
    const route = t === "rampart_ai" || t === "rampart" ? "rampartai" : t
    if (!routes.includes(route)) continue
    try {
      const { data } = await axios.get(`/api/report_target/${taskId}?tool=${route}`, { timeout: 10000 })
      if (data?.success) raw[route] = data.report
    } catch { /* per-tool ok */ }
  }
  return raw
}

export function RealtimeAnalysis({ taskId }: { taskId: string }) {
  const [analysis, setAnalysis] = useState<AnalysisResponse>(emptyAnalysis())
  const [status, setStatus] = useState<"loading" | "running" | "completed" | "failed" | "notfound">("loading")
  const [error, setError] = useState("")
  const [privacy, setPrivacy] = useState(false)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [md5, setMd5] = useState<string>()
  const [availableTools, setAvailableTools] = useState<string[]>([])
  const [ownUid, setOwnUid] = useState<string>()
  const [reportUid, setReportUid] = useState<string>()
  const finishedRef = useRef(false)

  // ดึง uid ของผู้ใช้ปัจจุบัน เพื่อตัดสินใจว่าเป็นเจ้าของรายงานหรือไม่
  useEffect(() => {
    let active = true
    axios.get("/api/profile")
      .then(({ data }) => { if (active && data?.success && data?.data?.uid) setOwnUid(data.data.uid) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const isOwner = !!reportUid && reportUid === ownUid

  async function changePrivacy(next: boolean) {
    if (savingPrivacy) return
    setSavingPrivacy(true)
    setPrivacy(next)
    try {
      await axios.patch(`/api/analy/privacy/${taskId}`, { privacy: next })
    } catch {
      setPrivacy((prev) => !prev)
    } finally {
      setSavingPrivacy(false)
    }
  }

  useEffect(() => {
    if (!taskId) return
    let cancelled = false
    async function poll() {
      if (cancelled || finishedRef.current) return
      try {
        const { data } = await axios.get<TaskPoll>(`/api/task_id/${taskId}`, { timeout: 8000 })
        if (cancelled) return
        if (data?.success === false && !data?.status) { finishedRef.current = true; setStatus("notfound"); setError(data?.message || "ไม่พบ task นี้"); return }
        if (data?.status === "failed") { finishedRef.current = true; setStatus("failed"); setError(data?.message || "การวิเคราะห์ล้มเหลว"); return }

        const st = deriveToolStatuses(data.progress)
        if (typeof data.report?.privacy === "boolean") setPrivacy(data.report.privacy)
        if (data.report?.uid) setReportUid(data.report.uid)
        if (data.report?.md5) setMd5(data.report.md5)
        if (data.report?.tools) setAvailableTools(String(data.report.tools).split(",").map((t: string) => t.trim()).filter(Boolean))
        setAnalysis((prev) => ({
          ...prev,
          overallStatus: "analyzing",
          fileName: data?.report?.file_name || data?.progress?.message || prev.fileName,
          virusTotal: { ...prev.virusTotal, status: st.virustotal },
          mobsf: { ...prev.mobsf, status: st.mobsf },
          cape: { ...prev.cape, status: st.cape },
          ml: { ...prev.ml, status: st.ml },
          gemini: { ...prev.gemini, status: st.gemini },
        }))
        setStatus("running")

        if (data?.status === "success") {
          finishedRef.current = true
          const rawReports = await fetchToolReports(taskId, (data.report?.tools ?? "").split(","))
          if (cancelled) return
          setAnalysis(buildReport(data.report, rawReports))
          setStatus("completed")
        }
      } catch { if (!cancelled) setStatus("running") }
    }
    poll()
    const id = setInterval(poll, 2500)
    return () => { cancelled = true; clearInterval(id) }
  }, [taskId])

  if (status === "notfound" || status === "failed") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="text-5xl">{status === "failed" ? "⚠️" : "🔍"}</div>
        <p className="text-white font-medium">{error}</p>
        <button onClick={() => (window.location.href = "/scan")} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold">กลับไปหน้าสแกน</button>
      </div>
    )
  }
  if (status === "loading") return <GeometricLoader loadingText="กำลังโหลดสถานะการวิเคราะห์..." />

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-4">
        {/* Live status line */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Live Analysis</h2>
          <span className={cn_status(status)}>{statusText(status)}</span>
        </div>

        {/* Privacy toggle — เจ้าของรายงานเท่านั้นที่ปรับได้ */}
        {isOwner && (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">ความเป็นส่วนตัวของรายงาน</p>
            <p className="text-xs text-slate-400 mt-0.5">สาธารณะ: ทุกคนมองเห็นรายงาน • ส่วนตัว: เฉพาะคุณ</p>
          </div>
          <div className="flex gap-1 rounded-full bg-white/5 p-1">
            <button
              type="button"
              onClick={() => changePrivacy(true)}
              disabled={savingPrivacy}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${privacy ? "bg-blue-500 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              สาธารณะ
            </button>
            <button
              type="button"
              onClick={() => changePrivacy(false)}
              disabled={savingPrivacy}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${!privacy ? "bg-purple-500 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              ส่วนตัว
            </button>
          </div>
        </div>
        )}

        {/* Original timeline UI, fed with real data */}
        <AnalysisTimeline data={analysis} />

        {/* Clickable links to per-tool detail pages */}
        {status === "completed" && (
          <div className="pt-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">ดูรายละเอียดแต่ละเครื่องมือ</p>
            <div className="flex flex-wrap gap-3">
              {[
                analysis.virusTotal.status === "completed" && { tool: "virustotal", title: "VirusTotal", icon: "fas fa-shield-virus" },
                analysis.mobsf.status === "completed" && { tool: "mobsf", title: "MobSF", icon: "fas fa-robot" },
                analysis.cape.status === "completed" && { tool: "cape", title: "CAPE Sandbox", icon: "fas fa-flask" },
              ].filter(Boolean).map((t: any) => (
                <Link
                  key={t.tool}
                  href={`/details/${t.tool}/${taskId}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 hover:border-cyan-500/30 hover:scale-[1.02] transition-all"
                >
                  <i className={`${t.icon} text-cyan-400`}></i>
                  <span>{t.title}</span>
                  <i className="fas fa-arrow-right text-xs text-slate-500"></i>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Download reports (on completion) */}
        {status === "completed" && md5 && availableTools.length > 0 && (
          <ReportDownload taskid={taskId} md5={md5} variant="dark" tools={availableTools} />
        )}
      </div>
    </div>
  )
}

function statusText(s: string) {
  if (s === "completed") return "เสร็จสมบูรณ์"
  if (s === "running") return "กำลังวิเคราะห์"
  return s
}
function cn_status(s: string) {
  return s === "completed"
    ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 border border-emerald-500/20"
    : "rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400 border border-blue-500/20"
}
