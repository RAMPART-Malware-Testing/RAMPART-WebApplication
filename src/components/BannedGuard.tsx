'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const SESSION_INVALID_STATUSES = new Set([
  'TOKEN_INVALID',
  'TOKEN_EXPIRED',
  'TOKEN_WRONG_TYPE',
  'USER_NOT_FOUND',
  'ACCOUNT_INACTIVE',
])

export default function BannedGuard() {
  const router = useRouter()
  const handlingRef = useRef(false)

  useEffect(() => {
    const handle = (status: unknown) => {
      if (handlingRef.current || typeof status !== 'string') return
      if (status === 'ACCOUNT_BANNED') {
        handlingRef.current = true
        axios.post('/api/logout').finally(() => router.replace('/banned'))
        return
      }
      if (SESSION_INVALID_STATUSES.has(status)) {
        handlingRef.current = true
        axios.post('/api/logout').finally(() => router.replace('/login?error=SESSION_EXPIRED'))
      }
    }

    const interceptorId = axios.interceptors.response.use(
      (response) => {
        handle(response?.data?.status)
        return response
      },
      (error) => {
        handle(error?.response?.data?.status)
        return Promise.reject(error)
      },
    )

    return () => {
      axios.interceptors.response.eject(interceptorId)
      handlingRef.current = false
    }
  }, [router])

  return null
}
