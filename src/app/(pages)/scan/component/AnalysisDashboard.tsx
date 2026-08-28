"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw } from "lucide-react"
import { AnalysisTimeline } from "./AnalysisTimeline"
import { mockScenarios, scenarioLabels } from "./mockData"
import GeometricLoader from "@/components/GeometricLoader"
import type { AnalysisResponse } from "./types"

const scenarioKeys = Object.keys(mockScenarios) as Array<keyof typeof mockScenarios>

export function AnalysisDashboard() {
  const [selectedScenario, setSelectedScenario] = useState<keyof typeof mockScenarios>("allSuccess")
  const [data, setData] = useState<AnalysisResponse>(mockScenarios.allSuccess)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [pendingScenario, setPendingScenario] = useState<keyof typeof mockScenarios | null>(null)

  const handleScenarioChange = (key: keyof typeof mockScenarios) => {
    if (key === selectedScenario) return
    setPendingScenario(key)
    setIsTransitioning(true)
  }

  const handleLoaderComplete = () => {
    setIsTransitioning(false)
    if (pendingScenario) {
      setSelectedScenario(pendingScenario)
      setData(mockScenarios[pendingScenario])
      setPendingScenario(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#050510] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Mock Scenario Selector
                </h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  Select a scenario to preview the analysis pipeline
                </p>
              </div>
              <button
                onClick={() => setData({ ...mockScenarios[selectedScenario] })}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {scenarioKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => handleScenarioChange(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedScenario === key
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                      : "bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:border-slate-600 hover:text-slate-400"
                  }`}
                >
                  {scenarioLabels[key]}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedScenario}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AnalysisTimeline data={data} />
          </motion.div>
        </AnimatePresence>
      </div>

      {isTransitioning && (
        <GeometricLoader
          isVisible={isTransitioning}
          loadingText="กำลังโหลด Scenario"
          duration={1000}
          onLoadingComplete={handleLoaderComplete}
        />
      )}
    </div>
  )
}
