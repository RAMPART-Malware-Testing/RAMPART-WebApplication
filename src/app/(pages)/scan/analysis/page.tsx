"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import NavbarComponent from "@/components/NavbarComponent"
import { RealtimeAnalysis } from "../component/RealtimeAnalysis"
import GeometricLoader from "@/components/GeometricLoader"

function AnalysisBody() {
  const searchParams = useSearchParams()
  const taskId = searchParams.get("taskId")

  if (!taskId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="text-5xl">📄</div>
        <p className="text-white font-medium">ไม่พบ task ที่ต้องการวิเคราะห์</p>
        <a href="/scan" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold">
          ไปที่หน้าสแกน
        </a>
      </div>
    )
  }

  return <RealtimeAnalysis taskId={taskId} />
}

export default function AnalysisPage() {
  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <NavbarComponent />
      <Suspense fallback={<GeometricLoader loadingText="กำลังโหลด..." />}>
        <AnalysisBody />
      </Suspense>
    </div>
  )
}
