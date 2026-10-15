import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { 
  Shield, 
  LogOut, 
  ExternalLink,
  Terminal,
  UserCheck
} from 'lucide-react'
import { getMemberPortalData } from '@/app/actions/profile'
import { logoutAction } from '@/app/actions/auth'
import { ProfileEditor } from '@/components/member/profile-editor'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'

export const metadata = {
  title: 'Member Self-Service Portal — PROTON',
}

export default async function MemberDashboardPage() {
  const { profile, email, designations, error } = await getMemberPortalData()

  if (error === 'Not authenticated' || !email) {
    redirect('/member/login')
  }

  if (profile?.role === 'admin' || profile?.role === 'super_admin') {
    const perms = getAdminPermissions(email)
    redirect(perms.isEventsManager ? '/admin/events' : '/admin')
  }

  // Fallback initial profile structure if row is pending creation
  const activeProfile = profile || {
    id: 'temp-id',
    full_name: email.split('@')[0],
    email: email,
    status: 'pending' as const,
    role: 'member' as const,
    joining_year: '2024',
    created_at: new Date().toISOString(),
  }

  return (
    <div className="min-h-screen bg-[#050505] text-foreground px-4 py-8 relative selection:bg-[#00d05a] selection:text-black">
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f0f_1px,transparent_1px),linear-gradient(to_bottom,#0f0f0f_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-40" />

      {/* Top Phosphor Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#00d05a]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* Header Bar */}
        <header className="border border-[#222222] bg-[#0c0c0c]/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl shadow-black">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 rounded border border-[#222] bg-black p-1.5 flex items-center justify-center group-hover:border-[#00d05a]/60 transition-colors">
                <Image
                  src="/images/Protton_logo.png"
                  alt="PROTON"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-xs font-mono font-bold tracking-widest text-foreground group-hover:text-[#00d05a] uppercase flex items-center gap-1.5">
                  <span>PROTON PORTAL</span>
                  <span className="text-[10px] text-[#00d05a] bg-[#00d05a]/10 px-1.5 py-0.2 rounded border border-[#00d05a]/20">
                    V3.0
                  </span>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase">
                  MEMBER CONSOLE // {activeProfile.full_name}
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <Link
              href="/teams"
              target="_blank"
              className="px-3 py-1.5 rounded bg-[#141414] hover:bg-[#1f1f1f] border border-[#2a2a2a] text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <span>View Public Teams</span>
              <ExternalLink className="w-3 h-3 text-[#00d05a]" />
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 border border-rose-800/40 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </form>
          </div>
        </header>

        {/* Member Profile Editor & Live Preview */}
        <main>
          <ProfileEditor
            initialProfile={activeProfile}
            email={email}
            designations={designations}
          />
        </main>

        {/* Footer info */}
        <footer className="pt-8 border-t border-[#1a1a1a] text-center text-[11px] font-mono text-muted-foreground/60 space-y-1">
          <div>PROTON Association — Department of Computer Science & Engineering (Cybersecurity)</div>
          <div>All confidential data is protected by strict zero-trust security policies.</div>
        </footer>
      </div>
    </div>
  )
}
