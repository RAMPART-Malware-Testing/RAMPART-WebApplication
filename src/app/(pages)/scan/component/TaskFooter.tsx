"use client"

import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskFooterProps {
  startedAt?: string
  finishedAt?: string
  className?: string
}

function formatTime(isoString?: string): string {
  if (!isoString) return ""
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function formatDuration(startedAt?: string, finishedAt?: string): string {
  if (!startedAt || !finishedAt) return ""
  const diff = new Date(finishedAt).getTime() - new Date(startedAt).getTime()
  const seconds = Math.round(diff / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

export function TaskFooter({ startedAt, finishedAt, className }: TaskFooterProps) {
  if (!startedAt) return null

  return (
    <div className={cn("flex items-center gap-3 text-xs text-slate-500", className)}>
      <Clock className="h-3 w-3" />
      <span>{formatTime(startedAt)}</span>
      {finishedAt && (
        <>
          <span className="text-slate-700">→</span>
          <span>{formatTime(finishedAt)}</span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-400">
            {formatDuration(startedAt, finishedAt)}
          </span>
        </>
      )}
    </div>
  )
}
