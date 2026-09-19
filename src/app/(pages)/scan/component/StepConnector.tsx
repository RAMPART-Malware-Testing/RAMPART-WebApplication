"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { TaskStatus } from "./types"

const STATUS_COLORS: Record<TaskStatus, string> = {
  waiting: "bg-slate-700 border-slate-600",
  running: "bg-amber-500/20 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]",
  completed: "bg-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]",
  failed: "bg-red-500 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]",
  skipped: "bg-slate-600 border-slate-500",
}

const LINE_COLORS: Record<TaskStatus, string> = {
  waiting: "bg-slate-700",
  running: "bg-amber-500/40",
  completed: "bg-emerald-500/40",
  failed: "bg-red-500/40",
  skipped: "bg-slate-600/40",
}

interface StepConnectorProps {
  status: TaskStatus
  index: number
  isLast?: boolean
}

export function StepConnector({ status, index, isLast = false }: StepConnectorProps) {
  return (
    <div className="flex flex-col items-center w-8 shrink-0">
      <motion.div
        className={cn(
          "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
          STATUS_COLORS[status]
        )}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.15, duration: 0.3 }}
      >
        {status === "running" && (
          <motion.span
            className="absolute inset-0 rounded-full bg-amber-500/30"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <span className="relative z-10 text-xs font-bold text-white">
          {index + 1}
        </span>
      </motion.div>

      {!isLast && (
        <motion.div
          className={cn("w-0.5 h-full min-h-[24px] flex-1", LINE_COLORS[status])}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: index * 0.15 + 0.2, duration: 0.4 }}
          style={{ originY: 0 }}
        />
      )}
    </div>
  )
}
