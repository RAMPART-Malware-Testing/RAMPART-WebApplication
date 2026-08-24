"use client"

import { motion } from "framer-motion"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisResponse } from "./types"

interface AnalysisSummaryProps {
  data: AnalysisResponse
  className?: string
}

export function AnalysisSummary({ data, className }: AnalysisSummaryProps) {
  const { overallStatus, finalResult, virusTotal, mobsf, cape, ml, gemini } = data

  const isVTDetected = virusTotal.detectionCount > 0 && virusTotal.status === "completed"
  const bothAnalysisFailed = mobsf.status === "failed" && cape.status === "failed"
  const oneFailed = mobsf.status === "failed" || cape.status === "failed"
  const bothCompleted = mobsf.status === "completed" && cape.status === "completed"
  const geminiSkipped = gemini.status === "skipped"

  const getStatusIcon = () => {
    if (isVTDetected) return { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" }
    if (bothAnalysisFailed) return { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" }
    if (overallStatus === "completed") return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" }
    return { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" }
  }

  const getTitle = () => {
    if (isVTDetected) return "Malware Detected"
    if (bothAnalysisFailed) return "Analysis Incomplete"
    if (overallStatus === "completed") return "Analysis Completed"
    return "Analysis In Progress"
  }

  const getDescription = () => {
    if (isVTDetected) return "Threat identified by VirusTotal. Scan pipeline halted."
    if (bothAnalysisFailed) return "No analysis report available. Unable to continue."
    if (bothCompleted) return "All analysis engines completed successfully. 2 reports available."
    if (oneFailed) {
      if (mobsf.status === "completed") return "Only MobSF report available."
      if (cape.status === "completed") return "Only CAPE report available."
    }
    return "Some analysis engines are still processing."
  }

  const { icon: Icon, color, bg } = getStatusIcon()

  return (
    <motion.div
      className={cn(
        "rounded-2xl border p-6 backdrop-blur-sm",
        bg,
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          bg
        )}>
          <Icon className={cn("h-6 w-6", color)} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">{getTitle()}</h3>
          <p className="text-sm text-slate-400">{getDescription()}</p>
        </div>
      </div>

      {/* Detail summary chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {/* Final result */}
        {finalResult && (
          <span className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            finalResult === "Malware" ? "bg-red-500/15 text-red-400 border border-red-500/30" :
            "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          )}>
            {finalResult}
          </span>
        )}

        {/* Available reports */}
        {mobsf.status === "completed" && (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 border border-emerald-500/20">
            MobSF Report
          </span>
        )}
        {cape.status === "completed" && (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 border border-emerald-500/20">
            CAPE Report
          </span>
        )}

        {/* ML prediction */}
        {ml.status === "completed" && ml.prediction && (
          <span className={cn(
            "rounded-full px-3 py-1 text-xs border",
            ml.prediction === "Malware"
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          )}>
            ML: {ml.prediction}
          </span>
        )}

        {/* Gemini */}
        {gemini.status === "completed" && gemini.overallRisk && (
          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-400 border border-purple-500/20">
            Gemini: {gemini.overallRisk}
          </span>
        )}

        {geminiSkipped && (
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400 border border-amber-500/20">
            Report Unavailable
          </span>
        )}
      </div>
    </motion.div>
  )
}
