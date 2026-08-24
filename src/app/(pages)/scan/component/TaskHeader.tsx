"use client"

import { LucideIcon } from "lucide-react"
import { StatusBadge } from "./StatusBadge"
import type { TaskStatus } from "./types"
import { cn } from "@/lib/utils"

interface TaskHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  status: TaskStatus
  className?: string
}

export function TaskHeader({
  icon: Icon,
  title,
  subtitle,
  status,
  className,
}: TaskHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            status === "running" && "bg-blue-500/20",
            status === "completed" && "bg-emerald-500/20",
            status === "failed" && "bg-red-500/20",
            status === "skipped" && "bg-amber-500/20",
            status === "waiting" && "bg-slate-700/50"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              status === "running" && "text-blue-400",
              status === "completed" && "text-emerald-400",
              status === "failed" && "text-red-400",
              status === "skipped" && "text-amber-400",
              status === "waiting" && "text-slate-500"
            )}
          />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <StatusBadge status={status} />
    </div>
  )
}
