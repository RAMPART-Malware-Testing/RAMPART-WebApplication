"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import type { TaskStatus } from "./types"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      status: {
        waiting: "bg-slate-700/50 text-slate-400 border border-slate-600/50",
        running: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
        completed: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        failed: "bg-red-500/15 text-red-400 border border-red-500/30",
        skipped: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
      } satisfies Record<TaskStatus, string>,
    },
    defaultVariants: {
      status: "waiting",
    },
  }
)

const dotVariants = cva("h-1.5 w-1.5 rounded-full", {
  variants: {
    status: {
      waiting: "bg-slate-500",
      running: "bg-blue-500 animate-pulse",
      completed: "bg-emerald-500",
      failed: "bg-red-500",
      skipped: "bg-amber-500",
    } satisfies Record<TaskStatus, string>,
  },
  defaultVariants: {
    status: "waiting",
  },
})

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  className?: string
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  waiting: "Waiting",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  skipped: "Skipped",
}

export function StatusBadge({ status = "waiting", className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      <span className={cn(dotVariants({ status }))} />
      {STATUS_LABELS[status!]}
    </span>
  )
}
