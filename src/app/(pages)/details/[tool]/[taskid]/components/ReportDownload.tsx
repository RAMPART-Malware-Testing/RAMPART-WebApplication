"use client"

import { useState } from "react"
import axios from "axios"

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

const TOOLS = [
  { key: "virustotal", label: "VirusTotal" },
  { key: "mobsf", label: "MobSF" },
  { key: "cape", label: "CAPE" },
  { key: "rampartai", label: "RampartAI" },
]

export default function ReportDownload({ taskid, md5, variant = "light", tools }: { taskid: string; md5?: string; variant?: "light" | "dark"; tools?: string[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const dark = variant === "dark"

  const toolNames = tools ?? []
  const isAvailable = (key: string) =>
    toolNames.includes(key) || (key === "rampartai" && toolNames.includes("rampart_ai"))
  const buttons = toolNames.length > 0 ? TOOLS.filter((t) => isAvailable(t.key)) : TOOLS

  const download = async (tool: string) => {
    if (busy || !md5) return
    setBusy(tool)
    try {
      const url = `${SERVER_URL}/api/analy/v1/download/report/${tool}-${md5}.json`
      const a = document.createElement("a")
      a.href = url
      a.download = `${tool}-${md5}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      axios.post("/api/profile/download", { file_name: md5, tool, md5 }).catch(() => {})
    } catch {
      alert(`ดาวน์โหลด ${tool} ไม่สำเร็จ (ไม่มีรายงานนี้)`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={dark ? "rounded-2xl border border-white/10 bg-white/[0.03] p-5" : "bg-white rounded-lg shadow-sm p-4 mb-6"}>
      <h3 className={dark ? "text-sm font-semibold text-white mb-3" : "text-lg font-semibold mb-3"}>ดาวน์โหลดรายงาน</h3>
      <div className="flex flex-wrap gap-3">
        {buttons.map((t) => (
          <button
            key={t.key}
            type="button"
            disabled={!!busy}
            onClick={() => download(t.key)}
            className={dark
              ? "px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 disabled:opacity-50 transition"
              : "px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition"}
          >
            {busy === t.key ? "โหลด..." : `${t.label} ↓ JSON`}
          </button>
        ))}
      </div>
    </div>
  )
}