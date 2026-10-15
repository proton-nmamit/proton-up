'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, X, Info } from 'lucide-react'
import { loginAction } from '@/app/actions/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const redirectParam = searchParams.get('redirect')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)

      const result = await loginAction(formData)

      if (result?.error) {
        setErrorMessage(result.error)
        setIsLoading(false)
        return
      }

      if (result?.success) {
        let target = result.redirectUrl || '/member/dashboard'
        if (redirectParam) {
          if (target === '/admin' || target === '/admin/events') {
            if (redirectParam.startsWith('/admin')) {
              target = redirectParam
            }
          } else {
            target = redirectParam
          }
        }
        router.push(target)
        router.refresh()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      if (
        typeof window !== 'undefined' &&
        (msg.includes('was not found on the server') ||
         msg.includes('Failed to find Server Action') ||
         msg.includes('failed-to-find-server-action'))
      ) {
        setErrorMessage('A newer version of the application was deployed. Refreshing...')
        setTimeout(() => {
          window.location.reload()
        }, 300)
        return
      }
      setErrorMessage(msg)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="w-full">
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2.5 text-left animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Email Input Container - Translucent on pure black */}
      <div className="relative w-full rounded-2xl bg-[#141416] hover:bg-[#1a1a1e] focus-within:bg-[#1e1f24] border border-white/10 focus-within:border-white focus-within:ring-2 focus-within:ring-white/20 transition-all duration-200 px-5 py-3.5 mb-3.5 text-left">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-transparent text-white placeholder:text-neutral-400 text-sm font-sans outline-none"
        />
      </div>

      {/* Password Input Container - Translucent on pure black */}
      <div className="relative w-full rounded-2xl bg-[#141416] hover:bg-[#1a1a1e] focus-within:bg-[#1e1f24] border border-white/10 focus-within:border-white focus-within:ring-2 focus-within:ring-white/20 transition-all duration-200 px-5 py-3.5 mb-2.5 text-left">
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full bg-transparent text-white placeholder:text-neutral-400 text-sm font-sans outline-none"
        />
      </div>

      {/* Forgot Password link - Only shown for member login, strictly omitted for admin login */}
      {!redirectParam?.startsWith('/admin') && (
        <div className="flex justify-end mb-4 px-1">
          <Link
            href="/member/forgot-password"
            className="text-xs text-neutral-400 hover:text-white font-sans transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      )}

      {/* Sign in Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-2xl bg-[#26272b] hover:bg-[#34353a] text-white font-semibold text-sm transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed mb-6 border border-white/10"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>

      {/* Footer Text */}
      <p className="text-xs text-neutral-400 font-sans">
        Don&apos;t have an account?{' '}
        <Link href="/member/register" className="text-white underline font-semibold hover:text-[#00d05a] transition-colors">
          Sign up
        </Link>
      </p>
    </form>
  )
}

export default function MemberLoginPage() {
  const [showInviteInfo, setShowInviteInfo] = useState(false)

  return (
    <div className="min-h-screen bg-[#000000] text-foreground flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-[#00d05a] selection:text-black">
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111111_1px,transparent_1px),linear-gradient(to_bottom,#111111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Top Phosphor Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00d05a]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
        {/* Main Solid Pure Black Login Container */}
        <div className="w-full rounded-[32px] sm:rounded-[36px] bg-[#000000] border border-white/10 p-7 sm:p-9 shadow-2xl shadow-black relative text-center">
          {/* Close button */}
          <Link
            href="/"
            title="Return to home"
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-neutral-400 hover:text-white transition-all duration-200"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </Link>

          {/* Top Circular Emblem with PROTON Logo */}
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

          {/* Headline */}
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-white mb-6">
            PROTON
          </h1>

          <Suspense
            fallback={
              <div className="py-8 text-center text-xs text-neutral-400 animate-pulse font-sans">
                Loading secure portal...
              </div>
            }
          >
            <LoginForm />
          </Suspense>

          {/* Toggle for NMAMIT Invitation Details */}
          <div className="mt-5 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowInviteInfo((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 hover:text-[#00d05a] transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-[#00d05a]" />
              <span>{showInviteInfo ? 'Hide registration details' : 'How does member onboarding work?'}</span>
            </button>

            {showInviteInfo && (
              <div className="mt-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-left space-y-1.5 text-[11px] font-mono text-neutral-300 animate-in fade-in slide-in-from-top-2">
                <div className="text-white font-bold tracking-wide text-[11px]">
                  // NMAMIT MEMBER ACCESS:
                </div>
                <p>• Membership onboarding is strictly invitation-only for active students.</p>
                <p>• Batch coordinators issue single-use activation links to official student emails.</p>
                <p>• Need an invitation? Reach out at <span className="text-[#00d05a]">proton@nmamit.in</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Back Link */}
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
