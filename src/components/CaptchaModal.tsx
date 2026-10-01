'use client'

import { useEffect, type RefObject } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { ShieldCheck, X } from 'lucide-react'

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LcGkdsrAAAAAFW6CFipeSplG7nLqICIKPm-gSln'

interface CaptchaModalProps {
  open: boolean
  captchaRef: RefObject<ReCAPTCHA | null>
  onVerify: (token: string | null) => void
  onExpired: () => void
  onClose: () => void
  title?: string
  description?: string
}

export default function CaptchaModal({
  open,
  captchaRef,
  onVerify,
  onExpired,
  onClose,
  title = 'ยืนยันตัวตน',
  description = 'กรุณายืนยัน reCAPTCHA เพื่อดำเนินการต่อ',
}: CaptchaModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-cyan-500/30 bg-[#0a0a18] p-6 shadow-[0_0_60px_rgba(34,211,238,0.25)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
            <ShieldCheck className="h-6 w-6 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div className="mt-5 flex justify-center">
          <div className="origin-center scale-[0.92] sm:scale-100">
            <ReCAPTCHA
              sitekey={SITE_KEY}
              ref={captchaRef}
              theme="dark"
              onChange={onVerify}
              onExpired={onExpired}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
