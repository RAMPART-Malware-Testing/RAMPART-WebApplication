"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, Activity, FileText, Database, Network, FolderTree, Cpu, Workflow, ScanSearch, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskCard } from "./TaskCard"
import type { VirusTotalResult, MobSFResult, CAPEResult, MLResult, GeminiResult, TaskStatus } from "./types"

interface VirusTotalCardProps {
  data: VirusTotalResult
  className?: string
}

export function VirusTotalCard({ data, className }: VirusTotalCardProps) {
  const isDetected = data.detectionCount > 0

  return (
    <TaskCard
      icon={Shield}
      title="VirusTotal Scan"
      subtitle="Multi-engine antivirus detection"
      status={data.status}
      startedAt={data.startedAt}
      finishedAt={data.finishedAt}
      message={data.message}
      className={cn(isDetected && data.status === "completed" && "border-red-500/30 bg-red-500/5", className)}
    >
      {data.status === "completed" && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanSearch className={cn("h-4 w-4", isDetected ? "text-red-400" : "text-emerald-400")} />
            <span className="text-sm text-slate-300">Detection</span>
          </div>
          <span className={cn(
            "text-lg font-bold font-mono",
            isDetected ? "text-red-400" : "text-emerald-400"
          )}>
            {data.detectionCount} <span className="text-sm font-normal text-slate-500">/ {data.totalEngines}</span>
          </span>
        </div>
      )}
    </TaskCard>
  )
}

interface MobSFCardProps {
  data: MobSFResult
  className?: string
}

const METRIC_CONFIG = [
  { key: "permissions", label: "Permissions" },
  { key: "activities", label: "Activities" },
  { key: "services", label: "Services" },
  { key: "receivers", label: "Receivers" },
] as const

export function MobSFCard({ data, className }: MobSFCardProps) {
  return (
    <TaskCard
      icon={FileText}
      title="MobSF Static Analysis"
      subtitle="Mobile Security Framework"
      status={data.status}
      startedAt={data.startedAt}
      finishedAt={data.finishedAt}
      message={data.message}
      className={className}
    >
      {data.status === "completed" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {METRIC_CONFIG.map(({ key, label }) => {
              const value = data[key as keyof typeof data]
              if (value === undefined) return null
              return (
                <div key={key} className="rounded-lg bg-slate-800/50 px-3 py-2">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-sm font-semibold text-white">{value}</div>
                </div>
              )
            })}
            {data.riskScore !== undefined && (
              <div className="col-span-2 rounded-lg bg-slate-800/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">Risk Score</div>
                  <div className={cn(
                    "text-sm font-bold",
                    data.riskScore < 30 ? "text-emerald-400" :
                    data.riskScore < 60 ? "text-amber-400" : "text-red-400"
                  )}>
                    {data.riskScore}/100
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-700">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      data.riskScore < 30 ? "bg-emerald-500" :
                      data.riskScore < 60 ? "bg-amber-500" : "bg-red-500"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${data.riskScore}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </TaskCard>
  )
}

interface CAPECardProps {
  data: CAPEResult
  className?: string
}

const CAPE_METRICS = [
  { key: "network", label: "Network", icon: Network },
  { key: "registry", label: "Registry", icon: Database },
  { key: "files", label: "Files", icon: FolderTree },
  { key: "processes", label: "Processes", icon: Cpu },
] as const

export function CAPECard({ data, className }: CAPECardProps) {
  return (
    <TaskCard
      icon={Activity}
      title="CAPE Analysis"
      subtitle="Automated malware sandbox"
      status={data.status}
      startedAt={data.startedAt}
      finishedAt={data.finishedAt}
      message={data.message}
      className={className}
    >
      {data.status === "completed" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {CAPE_METRICS.map(({ key, label, icon: Icon }) => {
              const value = data[key as keyof typeof data]
              if (value === undefined) return null
              return (
                <div key={key} className="rounded-lg bg-slate-800/50 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Icon className="h-3 w-3" />
                    {label}
                  </div>
                  <div className="text-sm font-semibold text-white">{value}</div>
                </div>
              )
            })}
          </div>
          {data.behaviorReport && (
            <div className="rounded-lg bg-slate-800/50 px-3 py-2">
              <div className="text-xs text-slate-500">Behavior Report</div>
              <div className="mt-0.5 text-sm text-slate-300">{data.behaviorReport}</div>
            </div>
          )}
        </div>
      )}
    </TaskCard>
  )
}

interface MLCardProps {
  data: MLResult
  className?: string
}

export function MLCard({ data, className }: MLCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const hasDetail = (data.malwareProbability !== undefined || data.benignProbability !== undefined)

  return (
    <TaskCard
      icon={Workflow}
      title="Machine Learning Detection"
      subtitle="ML-based prediction model"
      status={data.status}
      startedAt={data.startedAt}
      finishedAt={data.finishedAt}
      message={data.message}
      className={className}
    >
      {data.status === "completed" && data.prediction && (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
            <span className="text-xs text-slate-500">Prediction</span>
            <span className={cn(
              "text-sm font-bold",
              data.prediction === "Benign" ? "text-emerald-400" : "text-red-400"
            )}>
              {data.prediction}
            </span>
          </div>
          {data.modelConfidence !== undefined && (
            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
              <span className="text-xs text-slate-500">Confidence</span>
              <span className="text-sm font-bold text-blue-400">{data.modelConfidence}</span>
            </div>
          )}

          {showDetail && (
            <div className="space-y-2">
              {data.malwareProbability !== undefined && (
                <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
                  <span className="text-xs text-slate-500">Malware Probability</span>
                  <span className="text-sm font-bold text-rose-400">{data.malwareProbability}</span>
                </div>
              )}
              {data.benignProbability !== undefined && (
                <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
                  <span className="text-xs text-slate-500">Benign Probability</span>
                  <span className="text-sm font-bold text-emerald-400">{data.benignProbability}</span>
                </div>
              )}
            </div>
          )}

          {hasDetail && (
            <button
              type="button"
              onClick={() => setShowDetail((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-800/40 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-700/60 hover:text-white transition"
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showDetail && "rotate-180")} />
              {showDetail ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
            </button>
          )}

          {(data.modelConfidence !== undefined || data.malwareProbability !== undefined) && (
            <div className="h-1.5 rounded-full bg-slate-700">
              <motion.div
                className={cn("h-full rounded-full", data.prediction === "Malware" ? "bg-rose-500" : "bg-emerald-500")}
                initial={{ width: 0 }}
                animate={{ width: `${((data.modelConfidence ?? data.malwareProbability ?? 0)) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          )}
        </div>
      )}
    </TaskCard>
  )
}

interface GeminiCardProps {
  data: GeminiResult
  className?: string
}

export function GeminiCard({ data, className }: GeminiCardProps) {
  const RISK_COLORS: Record<string, string> = {
    Low: "text-emerald-400",
    Medium: "text-amber-400",
    High: "text-orange-400",
    Critical: "text-red-400",
  }

  return (
    <TaskCard
      icon={Activity}
      title="Gemini AI Analysis"
      subtitle="AI-powered security recommendation"
      status={data.status}
      startedAt={data.startedAt}
      finishedAt={data.finishedAt}
      message={data.message}
      className={className}
    >
      {data.status === "completed" && (
        <div className="space-y-2">
          {data.summary && (
            <div className="rounded-lg bg-slate-800/50 px-3 py-2">
              <div className="text-xs text-slate-500">Summary</div>
              <div className="mt-0.5 text-sm text-white">{data.summary}</div>
            </div>
          )}
          {data.threatAssessment && (
            <div className="rounded-lg bg-slate-800/50 px-3 py-2">
              <div className="text-xs text-slate-500">Threat Assessment</div>
              <div className="mt-0.5 text-sm text-slate-300">{data.threatAssessment}</div>
            </div>
          )}
          {data.behavior && (
            <div className="rounded-lg bg-slate-800/50 px-3 py-2">
              <div className="text-xs text-slate-500">Behavior</div>
              <div className="mt-0.5 text-sm text-slate-300">{data.behavior}</div>
            </div>
          )}
          {data.recommendation && (
            <div className="rounded-lg bg-slate-800/50 px-3 py-2">
              <div className="text-xs text-slate-500">Recommendation</div>
              <div className="mt-0.5 text-sm text-slate-300">{data.recommendation}</div>
            </div>
          )}
          {data.overallRisk && (
            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
              <span className="text-xs text-slate-500">Overall Risk</span>
              <span className={cn("text-sm font-bold", RISK_COLORS[data.overallRisk] || "text-slate-400")}>
                {data.overallRisk}
              </span>
            </div>
          )}
        </div>
      )}
    </TaskCard>
  )
}
