import React from 'react'
import Link from 'next/link'
import { ExternalLink, LogOut, KeyRound } from 'lucide-react'
import { AdminNav } from '@/components/admin/admin-nav'
import { requireAdminSession } from '@/lib/auth/session'
import { logoutAction } from '@/app/actions/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'PROTON CMS — Admin Dashboard',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let userEmail: string | undefined
  try {
    const session = await requireAdminSession()
    userEmail = session.user.email
  } catch {
    redirect('/member/login?redirect=%2Fadmin')
  }

  return (
    <div className="min-h-screen bg-[#050505] text-foreground flex flex-col md:flex-row selection:bg-[#00d05a] selection:text-black">
      {/* Sidebar Nav (desktop) / Top bar + Drawer (mobile) */}
      <AdminNav userEmail={userEmail} />

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-screen p-4 sm:p-6 lg:p-8 bg-[#000000] relative flex flex-col">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f0f_1px,transparent_1px),linear-gradient(to_bottom,#0f0f0f_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-30" />
        
        {/* Top Right Header Controls */}
        <div className="relative z-20 flex items-center justify-between pb-5 mb-3 border-b border-[#161616] max-w-7xl w-full mx-auto">
          {/* Breadcrumb / Session Identity — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[#00d05a] animate-pulse" />
            <span className="text-foreground font-bold uppercase tracking-wider">ADMIN CONSOLE</span>
            <span className="text-muted-foreground/30">//</span>
            <span className="text-muted-foreground truncate">{userEmail}</span>
          </div>

          {/* Top Right Options */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Profile & Password — icon only on mobile, full text on sm+ */}
            <Link
              href="/admin/profile"
              aria-label="Profile & Password"
              className="inline-flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-[#0e0e0e] hover:bg-[#181818] border border-[#222222] hover:border-[#333] text-xs font-mono text-muted-foreground hover:text-foreground transition-all"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#00d05a]" />
              <span className="hidden sm:inline">Profile &amp; Password</span>
            </Link>

            {/* Public Site — icon only on mobile, full text on sm+ */}
            <Link
              href="/"
              target="_blank"
              aria-label="Public Site"
              className="inline-flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-[#0e0e0e] hover:bg-[#181818] border border-[#222222] hover:border-[#333] text-xs font-mono text-muted-foreground hover:text-foreground transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Public Site</span>
              <span className="hidden sm:inline text-[10px] text-muted-foreground/60">↗</span>
            </Link>

            {/* Terminate Session — icon only on mobile, full text on sm+ */}
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Terminate Session"
                className="inline-flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-rose-900/40 hover:border-rose-700/60 text-xs font-mono tracking-wider transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Terminate Session</span>
              </button>
            </form>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
