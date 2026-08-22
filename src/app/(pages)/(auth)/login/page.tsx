'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Hero from '@/components/HeroComponent'
import Navbarservice from '@/components/Navbarservice'
import { useToast } from '@/components/ui/ToastProvider'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

function oauthLoginUrl(provider: 'google' | 'github') {
  return `${SERVER_URL}/api/auth/${provider}/login`
}

function LoginContent() {
  const searchParams = useSearchParams()
  const notify = useToast()
  const [redirecting, setRedirecting] = useState<'google' | 'github' | null>(null)

  useEffect(() => {
    const message = searchParams.get('error')
    if (message) notify.error(message)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    setRedirecting(provider)
    window.location.href = oauthLoginUrl(provider)
  }

  return (
    <>
      <Navbarservice />
      <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated gradient blobs background */}
        <div className="fixed inset-0 overflow-hidden -z-10">
          <div className="blob-bg top-[-200px] left-[-150px] animate-pulse" style={{ animationDuration: "12s" }} />
          <div
            className="blob-bg bottom-[-250px] right-[-200px]"
            style={{
              background:
                "radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.1) 70%)",
              animationDelay: "-3s",
              animationDuration: "15s",
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] top-1/3 left-1/4 rounded-full bg-cyan-500/10 blur-[100px] animate-pulse"
            style={{ animationDuration: "18s" }}
          />
          <div className="absolute w-[600px] h-[600px] bottom-10 right-0 bg-indigo-600/10 blur-[120px] spin-slow" />
        </div>

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 w-full max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
            <Hero />

            <div className="w-full lg:w-auto lg:min-w-[450px] flex-1 max-w-md">
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl border border-white/10 p-8 lg:p-10 hover-glow transition-all duration-500">
                <div className="text-center mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                    เข้าสู่ระบบ
                  </h2>
                  <p className="text-purple-200/60 text-sm">เข้าสู่ระบบเพื่อใช้บริการวิเคราะห์มัลแวร์</p>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={redirecting !== null}
                    className="group relative w-full bg-white py-4 px-4 rounded-2xl font-bold text-gray-800 shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    {redirecting === 'google' ? (
                      <div className="w-5 h-5 border-2 border-gray-400/40 border-t-gray-700 rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    <span>{redirecting === 'google' ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Google'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOAuthLogin('github')}
                    disabled={redirecting !== null}
                    className="group relative w-full bg-[#181717] py-4 px-4 rounded-2xl font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-300 flex items-center justify-center gap-3 border border-white/10"
                  >
                    {redirecting === 'github' ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                      </svg>
                    )}
                    <span>{redirecting === 'github' ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย GitHub'}</span>
                  </button>
                </div>

                <p className="text-center text-xs text-purple-200/40 mt-8">
                  เมื่อเข้าสู่ระบบ ระบบจะสร้างบัญชีให้อัตโนมัติหากยังไม่เคยใช้งานมาก่อน
                </p>
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes slowSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spin-slow { animation: slowSpin 20s linear infinite; }
          .blob-bg {
            position: absolute;
            width: 700px;
            height: 700px;
            background: radial-gradient(circle, rgba(79,70,229,0.25) 0%, rgba(6,182,212,0.1) 70%, transparent 100%);
            filter: blur(70px);
            border-radius: 50%;
            z-index: 0;
          }
          .hover-glow { transition: all 0.4s ease; }
          .hover-glow:hover {
            box-shadow: 0 0 28px rgba(99, 102, 241, 0.6);
            transform: translateY(-6px) scale(1.01);
          }
        `}</style>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
