"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useProfile } from "@/hooks/queries/useProfile"

const SETUP_PATH = "/setup"

export function MasterSetupGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: profile } = useProfile()

  useEffect(() => {
    if (!profile?.must_setup) return
    if (pathname === SETUP_PATH) return
    router.replace(SETUP_PATH)
  }, [profile?.must_setup, pathname, router])

  return null
}
