"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface ProgressIndicatorProps {
  className?: string
  label?: string
}

export function ProgressIndicator({ className, label }: ProgressIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-blue-500/15 bg-blue-500/[0.04] px-3 py-2.5", className)}>
      {/* Conic-gradient spinning ring */}
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
        <div className="spinner-ring absolute inset-0 rounded-full" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
          <motion.span
            className="text-sm font-medium text-cyan-300"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            {label || "Processing"}
          </motion.span>
        </div>
        {/* Shimmer progress bar */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/60">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

      <style jsx>{`
        .spinner-ring {
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(34, 211, 238, 0.05) 120deg,
            #22d3ee 300deg,
            #3b82f6 360deg
          );
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px));
          animation: spin 1.1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("rounded-lg bg-gradient-to-r from-slate-800/50 via-slate-700/60 to-slate-800/50 bg-[length:200%_100%]", className)}
      animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
  )
}
