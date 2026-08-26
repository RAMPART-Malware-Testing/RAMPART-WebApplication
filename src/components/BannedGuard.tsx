'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

/** Global response interceptor: the moment ANY backend-proxied call comes
 * back with the ACCOUNT_BANNED status/code (see services/admin/authz.py::
 * ensure_not_banned, retrofitted onto every authenticated backend
 * endpoint), immediately log the session out and redirect to /banned -
 * instead of waiting for the 7-day access token to expire naturally. A
 * user banned mid-session loses UI access on their very next request, not
 * just their next login. Mounted once, globally, in the root layout. */
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
