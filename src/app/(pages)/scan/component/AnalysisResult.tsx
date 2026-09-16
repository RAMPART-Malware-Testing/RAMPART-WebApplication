"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { AnalysisResponse } from "./types"

const TOOL_META: Record<string, { label: string; logo: string }> = {
  virustotal: { label: "VirusTotal", logo: "/virustotal_logo.png" },
  mobsf: { label: "MobSF", logo: "/mobsf_logo.png" },
  cape: { label: "CAPE Sandbox", logo: "/cape_logo.png" },
  rampart_ai: { label: "RampartAI", logo: "/logo_bg_white.png" },
}

function scoreTier(score: number) {
  if (score < 30) {
    return {
      label: "อันตราย",
      text: "text-red-400",
      bar: "bg-red-500",
      badge: "border-red-500/20 bg-red-500/10",
      surface: "border-red-500/20",
    }
  }
  if (score < 60) {
    return {
      label: "ความเสี่ยงปานกลาง",
      text: "text-amber-400",
      bar: "bg-amber-500",
      badge: "border-amber-500/20 bg-amber-500/10",
      surface: "border-amber-500/20",
    }
  }
  return {
    label: "ปลอดภัย",
    text: "text-emerald-400",
    bar: "bg-emerald-500",
    badge: "border-emerald-500/20 bg-emerald-500/10",
    surface: "border-emerald-500/20",
  }
}

interface AnalysisResultProps {
  data: AnalysisResponse
  tools: string[]
  className?: string
}

export function AnalysisResult({ data, tools, className }: AnalysisResultProps) {
  const { score, riskLevel, riskIndicators, toolScores } = data

  const roundedScore = score != null ? Math.round(score) : null
  const tier = roundedScore != null ? scoreTier(roundedScore) : null
  const indicators = riskIndicators ?? []
  const scoredTools = Object.keys(TOOL_META).filter((key) => tools.includes(key))

  if (roundedScore == null && !riskLevel && indicators.length === 0 && scoredTools.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-4", className)}>
      {(roundedScore != null || riskLevel) && (
        <motion.div
          className={cn(
            "rounded-xl border bg-slate-900/60 p-4 backdrop-blur-sm",
            tier ? tier.surface : "border-slate-700/50"
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            คะแนนความปลอดภัยรวม
          </div>

          <div className="mt-3 rounded-lg bg-slate-800/50 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Overall Score</span>
              <span className={cn("text-lg font-bold font-mono", tier?.text)}>
                {roundedScore ?? "-"}
                {roundedScore != null && (
                  <span className="text-sm font-normal text-slate-500"> / 100</span>
                )}
              </span>
            </div>

            {roundedScore != null && (
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-700">
                <motion.div
                  className={cn("h-full rounded-full", tier?.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${roundedScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            )}
          </div>

          {(riskLevel || tier) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {tier && (
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    tier.badge,
                    tier.text
                  )}
                >
                  {tier.label}
                </span>
              )}
              {riskLevel && (
                <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                  {riskLevel}
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}

      {scoredTools.length > 0 && (
        <motion.div
          className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            คะแนนความเสี่ยงรายเครื่องมือ
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {scoredTools.map((key) => {
              const meta = TOOL_META[key]
              const value = toolScores?.[key]
              const rounded = value != null ? Math.round(value) : null
              const toolTier = rounded != null ? scoreTier(rounded) : null

              return (
                <div key={key} className="rounded-lg bg-slate-800/50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="relative h-5 w-5 shrink-0 rounded bg-slate-700">
                        <Image src={meta.logo} alt={meta.label} fill className="object-contain p-0.5" />
                      </div>
                      <span className="truncate text-xs text-slate-500">{meta.label}</span>
                    </div>
                    <span className={cn("shrink-0 text-sm font-bold font-mono", toolTier?.text)}>
                      {rounded != null ? `${rounded}/100` : "-"}
                    </span>
                  </div>

                  {rounded != null && (
                    <div className="mt-1.5 h-1.5 rounded-full bg-slate-700">
                      <motion.div
                        className={cn("h-full rounded-full", toolTier?.bar)}
                        initial={{ width: 0 }}
                        animate={{ width: `${rounded}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {indicators.length > 0 && (
        <motion.div
          className="rounded-xl border border-purple-500/20 bg-slate-900/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Risk Indicators
          </div>

          <ul className="mt-3 space-y-2">
            {indicators.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg bg-slate-800/50 px-3 py-2 text-xs text-slate-300"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}
