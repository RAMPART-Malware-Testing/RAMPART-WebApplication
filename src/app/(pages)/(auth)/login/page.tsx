'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Hero from '@/components/HeroComponent'
import Navbarservice from '@/components/Navbarservice'
import { useToast } from '@/components/ui/ToastProvider'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

function LoginBody() {
  const notify = useToast();
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const err = searchParams.get('error')
    const message = searchParams.get('message')
    if (err) {
      const text = message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      setError(text)
      notify.error(text)
    }
  }, [searchParams, notify])

  const googleUrl = `${SERVER_URL}/api/auth/google/login`
  const githubUrl = `${SERVER_URL}/api/auth/github/login`

  return (
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

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm animate-shake mb-6">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-exclamation-circle text-red-400"></i>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <a
                  href={googleUrl}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-4 px-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-lg"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  เข้าสู่ระบบด้วย Google
                </a>

                <a
                  href={githubUrl}
                  className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-4 rounded-2xl border border-white/10 transition-all duration-300 hover:scale-[1.02] shadow-lg"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.13-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.41-2.69 5.38-5.25 5.66.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
                  </svg>
                  เข้าสู่ระบบด้วย GitHub
                </a>
              </div>

              <div className="text-center mt-8 pt-6 border-t border-white/10">
                <p className="text-sm text-purple-200/60">
                  ยังไม่มีบัญชี?{" "}
                  <Link href="/login" className="font-bold text-purple-400 hover:text-purple-300 transition-colors duration-200">
                    ลงทะเบียนด้วย Google / GitHub
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .spin-slow {
          animation: slowSpin 20s linear infinite;
        }

        .blob-bg {
          position: absolute;
          width: 700px;
          height: 700px;
          background: radial-gradient(
            circle,
            rgba(79, 70, 229, 0.25) 0%,
            rgba(6, 182, 212, 0.1) 70%,
            transparent 100%
          );
          filter: blur(70px);
          border-radius: 50%;
          z-index: 0;
        }

        .hover-glow {
          transition: all 0.4s ease;
        }

        .hover-glow:hover {
          box-shadow: 0 0 28px rgba(99, 102, 241, 0.6);
          transform: translateY(-6px) scale(1.01);
        }

        @keyframes slowSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <>
      <Navbarservice />
      <Suspense fallback={null}>
        <LoginBody />
      </Suspense>
    </>
  )
}
