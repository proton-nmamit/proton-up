'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, CheckCircle2, ArrowLeft, KeyRound, X } from 'lucide-react'
import { resetPasswordAction } from '@/app/actions/auth'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    if (!token) {
      setErrorMessage('Missing password reset token. Please request a new link.')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      setIsLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('token', token)
      formData.append('password', password)
      formData.append('confirmPassword', confirmPassword)

      const result = await resetPasswordAction(formData)

      if (result?.error) {
        setErrorMessage(result.error)
        setIsLoading(false)
        return
      }

      if (result?.success) {
        setIsSuccess(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password.'
      if (
        typeof window !== 'undefined' &&
        (msg.includes('was not found on the server') ||
         msg.includes('Failed to find Server Action') ||
         msg.includes('failed-to-find-server-action'))
      ) {
        setErrorMessage('A newer version was deployed. Refreshing...')
        setTimeout(() => {
          window.location.reload()
        }, 300)
        return
      }
      setErrorMessage(msg)
      setIsLoading(false)
    }
  }

  if (!token && !isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-mono">
          No password reset token provided. Please click the link received in your email or request a new one.
        </div>
        <Link
          href="/member/forgot-password"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#00d05a] hover:underline"
        >
          <span>Request a new reset link &rarr;</span>
        </Link>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
        <div className="p-4 rounded-2xl bg-[#00d05a]/10 border border-[#00d05a]/30 text-emerald-300 text-xs font-mono text-left flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#00d05a] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Password Updated Successfully
            </div>
            <p className="text-neutral-300 leading-relaxed text-[11px]">
              Your member account password has been securely updated. You can now sign in with your new credentials.
            </p>
          </div>
        </div>

        <Link
          href="/member/login"
          className="w-full py-3.5 rounded-2xl bg-[#26272b] hover:bg-[#34353a] text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 border border-white/10"
        >
          <span>Proceed to Sign In &rarr;</span>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleReset} className="w-full">
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2.5 text-left animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* New Password */}
      <div className="relative w-full rounded-2xl bg-[#141416] hover:bg-[#1a1a1e] focus-within:bg-[#1e1f24] border border-white/10 focus-within:border-white focus-within:ring-2 focus-within:ring-white/20 transition-all duration-200 px-5 py-3.5 mb-3.5 text-left">
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 8 characters)"
          className="w-full bg-transparent text-white placeholder:text-neutral-400 text-sm font-sans outline-none"
        />
      </div>

      {/* Confirm New Password */}
      <div className="relative w-full rounded-2xl bg-[#141416] hover:bg-[#1a1a1e] focus-within:bg-[#1e1f24] border border-white/10 focus-within:border-white focus-within:ring-2 focus-within:ring-white/20 transition-all duration-200 px-5 py-3.5 mb-5 text-left">
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="w-full bg-transparent text-white placeholder:text-neutral-400 text-sm font-sans outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-2xl bg-[#26272b] hover:bg-[#34353a] text-white font-semibold text-sm transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed mb-5 border border-white/10"
      >
        <KeyRound className="w-4 h-4 text-[#00d05a]" />
        <span>{isLoading ? 'Updating Password...' : 'Save New Password'}</span>
      </button>

      <div className="text-center">
        <Link
          href="/member/login"
          className="text-xs text-neutral-400 hover:text-white font-sans inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel and Return to Sign In</span>
        </Link>
      </div>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-foreground flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-[#00d05a] selection:text-black">
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111111_1px,transparent_1px),linear-gradient(to_bottom,#111111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Top Phosphor Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00d05a]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
        <div className="w-full rounded-[32px] sm:rounded-[36px] bg-[#000000] border border-white/10 p-7 sm:p-9 shadow-2xl shadow-black relative text-center">
          {/* Close button */}
          <Link
            href="/member/login"
            title="Return to login"
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-neutral-400 hover:text-white transition-all duration-200"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </Link>

          {/* Top Circular Emblem */}
          <div className="w-16 h-16 rounded-full bg-[#141416] border border-white/20 flex items-center justify-center shadow-lg shadow-black mx-auto mb-4 p-3 relative group">
            <Image
              src="/images/Protton_logo.png"
              alt="PROTON Logo"
              width={42}
              height={42}
              className="object-contain group-hover:scale-110 transition-transform duration-300"
              priority
            />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Set New Password
          </h1>
          <p className="text-xs text-neutral-400 mb-6 font-sans">
            Enter your new secure password below to regain access.
          </p>

          <Suspense
            fallback={
              <div className="py-8 text-center text-xs text-neutral-400 animate-pulse font-sans">
                Verifying recovery token...
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>

        {/* Home Backlink */}
        <Link
          href="/"
          className="mt-6 text-xs font-mono text-neutral-400 hover:text-[#00d05a] transition-colors uppercase tracking-widest"
        >
          ← Return to PROTON Home
        </Link>
      </div>
    </div>
  )
}
