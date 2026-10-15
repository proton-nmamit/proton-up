import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Shield, ShieldAlert, KeyRound, ArrowLeft, X } from 'lucide-react'
import { verifyInvitationToken } from '@/lib/auth/invitations'
import { RegisterForm } from '@/components/member/register-form'

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function MemberRegisterPage({ searchParams }: PageProps) {
  const { token } = await searchParams

  const verification = token ? await verifyInvitationToken(token) : { valid: false, reason: 'No invitation token provided.' }

  return (
    <div className="min-h-screen bg-[#000000] text-foreground flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-[#00d05a] selection:text-black">
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111111_1px,transparent_1px),linear-gradient(to_bottom,#111111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Top Phosphor Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00d05a]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 rounded-t-xl border-b-0">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              title="Close and return to home"
              className="w-3 h-3 rounded-full bg-rose-500/90 hover:bg-rose-500 transition-all flex items-center justify-center group shadow-[0_0_8px_rgba(244,63,94,0.4)] hover:shadow-[0_0_12px_rgba(244,63,94,0.8)] cursor-pointer"
              aria-label="Close"
            >
              <X className="w-2 h-2 text-black opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
            </Link>
            <span className="text-[10px] font-mono text-muted-foreground ml-1 tracking-widest uppercase">
              PROTON_ONBOARDING // TOKEN_GATED
            </span>
          </div>
          <KeyRound className="w-3.5 h-3.5 text-[#00d05a]" />
        </div>

        {/* Card Body */}
        <div className="border border-[#222222] bg-[#0c0c0c]/90 backdrop-blur-xl p-8 rounded-b-xl shadow-2xl shadow-black relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d05a] to-transparent" />

          {/* Logo & Headline */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
              <div className="relative w-10 h-10 rounded border border-[#222222] bg-black/60 p-1 flex items-center justify-center group-hover:border-[#00d05a]/50 transition-colors">
                <Image
                  src="/images/Protton_logo.png"
                  alt="PROTON"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
            </Link>
            <h1 className="text-xl font-bold font-mono tracking-wider uppercase text-foreground">
              MEMBER ONBOARDING
            </h1>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              Complete your profile registration to join the PROTON directory
            </p>
          </div>

          {!verification.valid ? (
            /* Invalid or Missing Token State */
            <div className="text-center py-8 px-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 mx-auto flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-base font-mono font-bold uppercase text-rose-400 tracking-wider">
                  INVITATION INVALID OR EXPIRED
                </h2>
                <p className="text-xs font-mono text-muted-foreground mt-2 leading-relaxed max-w-md mx-auto">
                  {verification.reason || 'This registration link is invalid, has already been redeemed, or has expired.'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#111111] border border-[#222222] text-left text-xs font-mono text-muted-foreground space-y-1.5">
                <div className="text-foreground font-bold uppercase">// SECURITY PROTOCOL:</div>
                <div>• Public unrestricted registration is disabled for PROTON systems.</div>
                <div>• Account creation requires an active, single-use administrator invitation.</div>
                <div>• If you are an active member, contact a core club lead to reissue an invitation.</div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/member/login"
                  className="w-full sm:w-auto px-5 py-2.5 rounded bg-[#161616] hover:bg-[#222222] border border-[#333] text-foreground font-mono text-xs uppercase tracking-wider transition-colors"
                >
                  Go to Login
                </Link>
                <Link
                  href="/"
                  className="w-full sm:w-auto px-5 py-2.5 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            /* Valid Token -> Show Form */
            <RegisterForm
              invitation={verification.invitation!}
              token={token!}
            />
          )}
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/member/login"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-[#00d05a] transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Already registered? Member Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
