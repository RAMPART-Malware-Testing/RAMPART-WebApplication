'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function BannedGuard() {
  const router = useRouter()

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => {
        const status = response?.data?.status
        if (status === 'ACCOUNT_BANNED') {
          axios.post('/api/logout').finally(() => {
            router.push('/banned')
          })
        }
        return response
      },
      (error) => {
        const status = error?.response?.data?.status
        if (status === 'ACCOUNT_BANNED') {
          axios.post('/api/logout').finally(() => {
            router.push('/banned')
          })
        }
        return Promise.reject(error)
      },
    )

    return () => {
      axios.interceptors.response.eject(interceptorId)
    }
  }, [router])

  return null
}
