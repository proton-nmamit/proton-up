import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { 
  User, 
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Terminal,
  Layers,
  CheckCircle2
} from 'lucide-react'
import { getMemberPortalData } from '@/app/actions/profile'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'
import { ProfileEditor } from '@/components/member/profile-editor'

export const metadata = {
  title: 'Executive Profile — PROTON CMS',
}

export default async function AdminProfilePage() {
  const { profile, email, designations, error } = await getMemberPortalData()

  if (error === 'Not authenticated' || !email) {
    redirect('/member/login?redirect=%2Fadmin%2Fprofile')
  }

  const permissions = getAdminPermissions(email)

  // Fallback initial profile structure if row is pending creation
  const activeProfile = profile || {
    id: 'admin-temp-id',
    full_name: email.split('@')[0],
    email: email,
    status: 'approved' as const,
    role: 'admin' as const,
    joining_year: '2024',
    created_at: new Date().toISOString(),
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border border-[#1f1f1f] bg-[#0c0c0c]/90 backdrop-blur-xl rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl shadow-black relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00d05a]/60 to-transparent" />

        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-[#00d05a]">
            <Terminal className="w-4 h-4" />
            <span className="uppercase font-bold tracking-widest">OPERATOR CONSOLE // IDENTITY DOSSIER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-foreground flex items-center gap-3">
            <span>Executive Profile</span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono uppercase ${
              permissions.isVicePresident
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-[#00d05a]/10 text-[#00d05a] border-[#00d05a]/20'
            }`}>
              {permissions.roleLabel}
            </span>
          </h1>
          <p className="text-xs font-mono text-muted-foreground max-w-2xl leading-relaxed">
            Customize your administrator profile, upload your official photo, and configure your designation, bio, and social handles. Changes reflect immediately on the public Teams page.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 z-10">
          <Link
            href="/teams"
            target="_blank"
            className="px-3.5 py-2 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] border border-[#2a2a2a] text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
          >
            <span>View Teams Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#00d05a]" />
          </Link>
        </div>
      </div>

      {/* Member / Admin Profile Editor */}
      <ProfileEditor
        initialProfile={activeProfile}
        email={email}
        designations={designations}
      />
    </div>
  )
}
