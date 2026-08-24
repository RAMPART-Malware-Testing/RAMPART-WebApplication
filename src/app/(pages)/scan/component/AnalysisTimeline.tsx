"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Shield, FileText, Activity, Workflow, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { StepConnector } from "./StepConnector"
import { VirusTotalCard, MobSFCard, CAPECard, MLCard, GeminiCard } from "./PipelineCard"
import { AnalysisSummary } from "./AnalysisSummary"
import type { AnalysisResponse, TaskStatus } from "./types"

interface AnalysisTimelineProps {
  data: AnalysisResponse
  className?: string
}

const stageColorMap: Record<string, string> = {
  waiting: "from-slate-800 to-slate-800/50",
  running: "from-blue-500/10 to-blue-500/5",
  completed: "from-emerald-500/10 to-emerald-500/5",
  failed: "from-red-500/10 to-red-500/5",
  skipped: "from-amber-500/10 to-amber-500/5",
}

function deriveStageStatus(tasks: TaskStatus[]): TaskStatus {
  if (tasks.every((s) => s === "waiting")) return "waiting"
  // If anything is still processing, the stage is still running.
  if (tasks.some((s) => s === "running")) return "running"
  // If at least one tool succeeded (others skipped/failed), the stage is done.
  if (tasks.some((s) => s === "completed")) return "completed"
  if (tasks.every((s) => s === "skipped")) return "skipped"
  if (tasks.every((s) => s === "failed" || s === "skipped")) return "failed"
  return "waiting"
}

function getVTStageStatus(vt: AnalysisResponse["virusTotal"]): TaskStatus {
  return vt.status
}

function getEngineStageStatus(mobsf: AnalysisResponse["mobsf"], cape: AnalysisResponse["cape"], ml: AnalysisResponse["ml"]): TaskStatus {
  return deriveStageStatus([mobsf.status, cape.status, ml.status])
}

export function AnalysisTimeline({ data, className }: AnalysisTimelineProps) {
  const stages = [
    {
      id: "vt",
      label: "VirusTotal",
      status: getVTStageStatus(data.virusTotal),
    },
    {
      id: "engines",
      label: "Analysis Engines",
      status: getEngineStageStatus(data.mobsf, data.cape, data.ml),
    },
    {
      id: "gemini",
      label: "Gemini AI",
      status: data.gemini.status,
    },
  ]

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Analysis Pipeline</h2>
          <div className={cn(
            "h-px flex-1 bg-gradient-to-r",
            data.overallStatus === "completed"
              ? "from-emerald-500/30 to-transparent"
              : "from-blue-500/30 to-transparent"
          )} />
        </div>
        <p className="text-sm text-slate-500">{data.fileName}</p>
      </motion.div>

      {/* Pipeline Visualization */}
      <div className="flex gap-0">
        {/* Left timeline track */}
        <div className="flex flex-col items-center">
          {stages.map((stage, idx) => (
            <StepConnector
              key={stage.id}
              status={stage.status}
              index={idx}
              isLast={idx === stages.length - 1}
            />
          ))}
        </div>

        {/* Right content */}
        <div className="ml-4 flex-1 space-y-4 pb-4">
          {/* Stage 1: VirusTotal */}
          <AnimatePresence mode="wait">
            <motion.div
              key="vt-stage"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                className={cn(
                  "rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-sm",
                  stageColorMap[data.virusTotal.status],
                  data.virusTotal.status === "completed" && "border-emerald-500/20",
                  data.virusTotal.status === "running" && "border-blue-500/30",
                  data.virusTotal.status === "failed" && "border-red-500/20",
                  data.virusTotal.detectionCount > 0 && data.virusTotal.status === "completed" && "border-red-500/30 bg-red-500/5"
                )}
              >
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Stage 1 — Initial Triage
                </div>
                <VirusTotalCard data={data.virusTotal} />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Stage 2: Analysis Engines */}
          <AnimatePresence mode="wait">
            <motion.div
              key="engines-stage"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className={cn(
                  "rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-sm",
                  stageColorMap[getEngineStageStatus(data.mobsf, data.cape, data.ml)],
                  getEngineStageStatus(data.mobsf, data.cape, data.ml) === "completed" && "border-emerald-500/20",
                  getEngineStageStatus(data.mobsf, data.cape, data.ml) === "running" && "border-blue-500/30",
                )}
              >
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Stage 2 — Multi-Engine Analysis
                </div>

                {/* Status header for stage */}
                <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-0.5 flex-1 bg-slate-800" />
                  <span>Parallel Processing</span>
                  <span className="h-0.5 flex-1 bg-slate-800" />
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <MobSFCard data={data.mobsf} />
                  <CAPECard data={data.cape} />
                  <MLCard data={data.ml} className="md:col-span-2 xl:col-span-1" />
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Stage 3: Gemini AI */}
          <AnimatePresence mode="wait">
            <motion.div
              key="gemini-stage"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className={cn(
                  "rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-sm",
                  stageColorMap[data.gemini.status],
                  data.gemini.status === "completed" && "border-purple-500/20",
                  data.gemini.status === "running" && "border-blue-500/30",
                  data.gemini.status === "skipped" && "border-amber-500/20",
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Stage 3 — AI Recommendation
                  </div>
                  {data.gemini.status !== "waiting" && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-500">
                      Input: {[data.mobsf.status === "completed" ? "MobSF" : "", data.cape.status === "completed" ? "CAPE" : ""].filter(Boolean).join(" + ") || "None"}
                    </span>
                  )}
                </div>
                <GeminiCard data={data.gemini} />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Summary at bottom */}
      <AnalysisSummary data={data} />
    </div>
  )
}
