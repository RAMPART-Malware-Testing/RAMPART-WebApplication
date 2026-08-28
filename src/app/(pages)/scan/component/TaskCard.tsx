"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskHeader } from "./TaskHeader"
import { TaskFooter } from "./TaskFooter"
import { SkeletonBlock } from "./ProgressIndicator"
import type { TaskStatus } from "./types"

interface TaskCardProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  status: TaskStatus
  startedAt?: string
  finishedAt?: string
  message?: string
  children?: React.ReactNode
  className?: string
}

export function TaskCard({
  icon,
  title,
  subtitle,
  status,
  startedAt,
  finishedAt,
  message,
  children,
  className,
}: TaskCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-xl border bg-slate-900/60 p-4 backdrop-blur-sm",
        status === "running" && "border-blue-500/30 bg-blue-500/5",
        status === "completed" && "border-emerald-500/20",
        status === "failed" && "border-red-500/20 bg-red-500/5",
        status === "skipped" && "border-amber-500/20 bg-amber-500/5 opacity-70",
        status === "waiting" && "border-slate-700/50 opacity-60",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <TaskHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        status={status}
      />

      {status === "running" && (
        <div className="mt-3 space-y-2">
          <SkeletonBlock className="h-2.5 w-full" />
          <SkeletonBlock className="h-2.5 w-3/4" />
          <SkeletonBlock className="h-5 w-full rounded-lg" />
        </div>
      )}

      {status !== "running" && message && (
        <p className="mt-2 text-xs text-slate-400">{message}</p>
      )}

      {status === "completed" && children && (
        <div className="mt-3 border-t border-slate-800 pt-3">{children}</div>
      )}

      <div className="mt-3">
        <TaskFooter startedAt={startedAt} finishedAt={finishedAt} />
      </div>
    </motion.div>
  )
}
