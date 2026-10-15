'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Mail, 
  Users, 
  Layers, 
  Calendar, 
  Image as ImageIcon,
  ShieldAlert,
  KeyRound,
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'
import { logoutAction } from '@/app/actions/auth'

const ADMIN_MODULE_LINKS = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Members', href: '/admin/members', icon: Users },
  { label: 'Invitations', href: '/admin/invitations', icon: Mail },
  { label: 'Designations', href: '/admin/designations', icon: Layers },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Gallery', href: '/admin/gallery', icon: ImageIcon },
  { label: 'Audit Logs', href: '/admin/logs', icon: ShieldAlert },
]

interface AdminNavProps {
  userEmail?: string
}

export function AdminNav({ userEmail }: AdminNavProps) {
  const pathname = usePathname()
  const permissions = getAdminPermissions(userEmail)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const availableModules = permissions.isEventsManager
    ? ADMIN_MODULE_LINKS.filter((l) => l.href === '/admin/events' || l.href === '/admin/gallery')
    : permissions.isVicePresident
      ? ADMIN_MODULE_LINKS.filter((l) => l.href === '/admin' || l.href === '/admin/members' || l.href === '/admin/invitations')
      : ADMIN_MODULE_LINKS

  /** Shared nav link renderer */
  const NavLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      <nav className="p-4 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 px-3 py-2">
          // MODULES
        </div>
        {availableModules.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-colors ${
                isActive
                  ? 'bg-[#141414] text-[#00d05a] border border-[#00d05a]/30 font-bold shadow-[0_0_10px_#00d05a]/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[#111111]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#00d05a]' : 'text-muted-foreground'}`} />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 pt-2 border-t border-[#1a1a1a] space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 px-3 py-2">
          // ACCOUNT
        </div>
        <Link
          href="/admin/profile"
          prefetch={false}
          onClick={onLinkClick}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-colors ${
            pathname === '/admin/profile'
              ? 'bg-[#141414] text-[#00d05a] border border-[#00d05a]/30 font-bold shadow-[0_0_10px_#00d05a]/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-[#111111]'
          }`}
        >
          <KeyRound className={`w-4 h-4 ${pathname === '/admin/profile' ? 'text-[#00d05a]' : 'text-muted-foreground'}`} />
          <span>Profile & Password</span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-colors text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Terminate Session</span>
          </button>
        </form>
      </div>
    </>
  )

  /** Shared brand logo block */
  const BrandBlock = () => (
    <Link href="/" className="flex items-center gap-3 group">
      <div className="relative w-8 h-8 rounded border border-[#222] bg-black p-1 flex items-center justify-center group-hover:border-[#00d05a]/60 transition-colors">
        <Image
          src="/images/Protton_logo.png"
          alt="PROTON"
          width={24}
          height={24}
          className="object-contain"
        />
      </div>
      <div>
        <div className="text-xs font-mono font-bold tracking-widest text-foreground group-hover:text-[#00d05a] transition-colors uppercase">
          PROTON CMS
        </div>
        <div className="text-[10px] font-mono flex items-center gap-1.5 mt-0.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              permissions.isEventsManager
                ? 'bg-cyan-400'
                : permissions.isVicePresident
                  ? 'bg-amber-400'
                  : 'bg-[#00d05a]'
            } animate-pulse`}
          />
          <span
            className={
              permissions.isEventsManager
                ? 'text-cyan-400 font-bold'
                : permissions.isVicePresident
                  ? 'text-amber-400 font-bold'
                  : 'text-[#00d05a]'
            }
          >
            {permissions.roleLabel.toUpperCase()}
          </span>
        </div>
      </div>
    </Link>
  )

  return (
    <>
      {/* ── MOBILE: sticky top header bar ── */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-[#1a1a1a]">
        <BrandBlock />
        <button
          aria-label="Open navigation menu"
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#141414] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── MOBILE: slide-in drawer ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col overflow-y-auto animate-in slide-in-from-left duration-200">
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
              <BrandBlock />
              <button
                aria-label="Close navigation menu"
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#141414] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Drawer nav links */}
            <NavLinks onLinkClick={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      {/* ── DESKTOP: left sidebar ── */}
      <aside className="hidden md:flex w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] flex-col justify-between shrink-0">
        <div>
          {/* Brand / Root Badge */}
          <div className="p-6 border-b border-[#1a1a1a]">
            <BrandBlock />
          </div>
          <NavLinks />
        </div>
      </aside>
    </>
  )
}
