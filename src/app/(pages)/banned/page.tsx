'use client'

import Link from 'next/link'

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-2xl font-bold text-white mb-3">บัญชีของคุณถูกระงับการใช้งาน</h1>
        <p className="text-blue-200/60 mb-8">
          บัญชีนี้ถูกระงับโดยผู้ดูแลระบบ หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อทีมผู้ดูแลระบบ
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  )
}
