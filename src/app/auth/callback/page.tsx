'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import GeometricLoader from '@/components/GeometricLoader'

/**
 * Landing spot for the browser after the backend finishes a Google/GitHub
 * OAuth login: the backend 302-redirects here with either
 *   ?access_token=...&token_type=bearer&expires_in=604800
 * or
 *   ?error=<code>&message=<text>
 * in the query string. This page's only job is to hand the token off to
 * /api/auth/session (which persists it as an httpOnly cookie) and then move
 * on to /dashboard.
 */
function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const expiresInRaw = searchParams.get('expires_in')
    const oauthError = searchParams.get('error')
    const message = searchParams.get('message')

    if (oauthError) {
      router.replace(`/login?error=${encodeURIComponent(message || oauthError)}`)
      return
    }

    if (!accessToken) {
      router.replace('/login?error=' + encodeURIComponent('ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง'))
      return
    }

    const expiresIn = expiresInRaw ? parseInt(expiresInRaw, 10) : undefined

    axios
      .post('/api/auth/session', { access_token: accessToken, expires_in: expiresIn })
      .then((res) => {
        if (res.data?.success) {
          router.replace('/dashboard')
        } else {
          setError(res.data?.message || 'ไม่สามารถเข้าสู่ระบบได้')
          setTimeout(() => router.replace('/login'), 2000)
        }
      })
      .catch(() => {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง')
        setTimeout(() => router.replace('/login'), 2000)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <i className="fas fa-exclamation-circle text-red-400 text-4xl"></i>
          <p className="text-red-300">{error}</p>
          <p className="text-purple-200/50 text-sm">กำลังกลับไปหน้าเข้าสู่ระบบ...</p>
        </div>
      </div>
    )
  }

  return <GeometricLoader loadingText="กำลังเข้าสู่ระบบ" />
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<GeometricLoader loadingText="กำลังเข้าสู่ระบบ" />}>
      <CallbackContent />
    </Suspense>
  )
}
