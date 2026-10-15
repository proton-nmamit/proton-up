'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, CheckCircle2, ArrowLeft, Mail, X, AlertTriangle, Clock } from 'lucide-react'
import { requestPasswordResetAction } from '@/app/actions/auth'

export default function MemberForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('email', email)

      const result = await requestPasswordResetAction(formData)

      if (result?.error) {
        setErrorMessage(result.error)
        setIsLoading(false)
        return
      }

      if (result?.success) {
        setMemberName(result.name || 'Member')
        setMemberEmail(result.email || email)
        setIsSubmitted(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process password reset request.'
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
    } finally {
      setIsLoading(false)
    }
  }

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
            Reset Member Password
          </h1>
          <p className="text-xs text-neutral-400 mb-6 font-sans">
            Enter your member email to receive a secure recovery link.
          </p>

          {isSubmitted ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 rounded-2xl bg-[#00d05a]/10 border border-[#00d05a]/30 text-emerald-300 text-xs font-mono text-left flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#00d05a] shrink-0 mt-0.5" />
                <div className="space-y-1.5 w-full">
                  <div className="font-bold text-[#00d05a] uppercase tracking-wider text-[11px]">
                    Recovery Link Dispatched
                  </div>
                  <div className="text-sm font-bold text-white font-sans">
                    Hey {memberName},
                  </div>
                  <div className="text-xs text-neutral-300 font-mono">
                    {memberEmail}
                  </div>
                  <p className="text-neutral-300 leading-relaxed text-[11px] font-sans pt-1">
                    A password reset link has been dispatched to your email address.
                  </p>
                </div>
              </div>

              {/* Prominent Spam / Junk Folder Reminder */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono text-left flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                    Please Check Your Spam / Junk Folder
                  </div>
                  <p className="text-neutral-300 leading-relaxed text-[11px] font-sans">
                    If you don&apos;t see the email in your primary inbox within 2 minutes, be sure to check your <strong>Spam</strong> or <strong>Junk</strong> folder.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-neutral-400 font-mono text-center flex items-center justify-center gap-1.5 py-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Reset links expire in 1 hour.</span>
              </div>

              <Link
                href="/member/login"
                className="w-full py-3.5 rounded-2xl bg-[#26272b] hover:bg-[#34353a] text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 border border-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign in</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full">
              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2.5 text-left animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="relative w-full rounded-2xl bg-[#141416] hover:bg-[#1a1a1e] focus-within:bg-[#1e1f24] border border-white/10 focus-within:border-white focus-within:ring-2 focus-within:ring-white/20 transition-all duration-200 px-5 py-3.5 mb-5 text-left">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Member email address"
                  className="w-full bg-transparent text-white placeholder:text-neutral-400 text-sm font-sans outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-[#26272b] hover:bg-[#34353a] text-white font-semibold text-sm transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed mb-5 border border-white/10"
              >
                <Mail className="w-4 h-4 text-[#00d05a]" />
                <span>{isLoading ? 'Sending recovery link...' : 'Send Recovery Link'}</span>
              </button>

              <div className="text-center">
                <Link
                  href="/member/login"
                  className="text-xs text-neutral-400 hover:text-white font-sans inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign in</span>
                </Link>
              </div>
            </form>
          )}
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
