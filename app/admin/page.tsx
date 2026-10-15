import React from 'react'
import Link from 'next/link'
import { 
  Users, 
  Mail, 
  Calendar, 
  Image as ImageIcon, 
  Layers, 
  ShieldCheck, 
  ArrowUpRight, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  LogIn,
  LogOut,
  Trash2,
  KeyRound
} from 'lucide-react'
import { sql, isDbConfigured } from '@/lib/db'
import { getAuditLogs } from '@/lib/audit-service'
import { getCurrentUser } from '@/lib/auth/session'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'
import { isLocalDevMode, readLocalStore } from '@/lib/local-store'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Root Dashboard — PROTON CMS',
}

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()
  const perms = getAdminPermissions(user?.email)

  if (perms.isEventsManager) {
    redirect('/admin/events')
  }

  const recentLogs = perms.canViewAuditLogs ? (await getAuditLogs({ limit: 6 })).logs : []

  let stats = {
    totalMembers: 0,
    pendingMembers: 0,
    approvedMembers: 0,
    rejectedMembers: 0,
    coreMembers: 0,
    designationsCount: 0,
    totalEvents: 0,
    publishedEvents: 0,
    openRegistrations: 0,
    totalGallery: 0,
    totalAlbums: 0,
    pendingInvitations: 0,
    isConfigured: isDbConfigured() || isLocalDevMode(),
  }

  if (isLocalDevMode()) {
    const store = readLocalStore()
    const validProfiles = store.profiles.filter(
      (p) => (p.full_name || '').toLowerCase().trim() !== 'proton administrator' && p.role !== 'super_admin'
    )
    stats.totalMembers = validProfiles.length
    stats.pendingMembers = validProfiles.filter((p) => p.status === 'pending').length
    stats.approvedMembers = validProfiles.filter((p) => p.status === 'approved').length
    stats.rejectedMembers = validProfiles.filter((p) => p.status === 'rejected').length
    stats.coreMembers = validProfiles.filter((p) => {
      const des = store.designations.find((d) => d.id === p.designation_id)
      return des?.is_core === true || (p as any).is_core === true
    }).length

    stats.totalEvents = store.events.length
    stats.publishedEvents = store.events.filter((e) => e.status === 'published').length
    stats.openRegistrations = store.events.filter((e) => e.registration_open).length

    stats.totalGallery = store.gallery_images.length
    stats.totalAlbums = store.gallery_albums.length
    stats.designationsCount = store.designations.filter((d) => d.is_active).length
    stats.pendingInvitations = store.invitations.filter((i) => !i.accepted_at && !i.revoked_at).length
  } else if (isDbConfigured()) {
    try {
      const [
        profiles,
        eventsData,
        galleryData,
        albumsData,
        designationCountResult,
        inviteCountResult,
      ] = await Promise.all([
        sql`
          SELECT p.id, p.status, p.full_name, p.role, p.designation_id, d.is_core
          FROM public.profiles p
          LEFT JOIN public.designations d ON p.designation_id = d.id
        `,
        sql`SELECT id, status, registration_open FROM public.events`,
        sql`SELECT id, status FROM public.gallery_images`,
        sql`SELECT id, status FROM public.gallery_albums`,
        sql`SELECT count(*)::int as count FROM public.designations WHERE is_active = true`,
        sql`SELECT count(*)::int as count FROM public.invitations WHERE accepted_at IS NULL AND revoked_at IS NULL`,
      ])

      const rawProfiles = (profiles as any[]) || []
      const list = rawProfiles.filter(
        (p) => (p.full_name || '').toLowerCase().trim() !== 'proton administrator' && p.role !== 'super_admin'
      )
      stats.totalMembers = list.length
      stats.pendingMembers = list.filter((p) => p.status === 'pending').length
      stats.approvedMembers = list.filter((p) => p.status === 'approved').length
      stats.rejectedMembers = list.filter((p) => p.status === 'rejected').length
      stats.coreMembers = list.filter((p) => p.is_core === true).length

      const evs = (eventsData as any[]) || []
      stats.totalEvents = evs.length
      stats.publishedEvents = evs.filter((e) => e.status === 'published').length
      stats.openRegistrations = evs.filter((e) => e.registration_open).length

      const gal = (galleryData as any[]) || []
      stats.totalGallery = gal.length

      const alb = (albumsData as any[]) || []
      stats.totalAlbums = alb.length

      stats.designationsCount = (designationCountResult as any[])[0]?.count || 0
      stats.pendingInvitations = (inviteCountResult as any[])[0]?.count || 0
    } catch (err) {
      console.error('Error fetching admin dashboard stats from Neon:', err)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#222] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#00d05a] mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>SECURE CMS NODE // CONTROL CONSOLE</span>
          </div>
          <h1 className="text-2xl font-mono font-bold uppercase text-foreground">
            {perms.isVicePresident ? 'VICE PRESIDENT CONSOLE' : 'ADMINISTRATOR ROOT CONSOLE'}
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            {perms.isVicePresident
              ? 'Authorized scope: Member approval management and invitation link dispatch'
              : 'Comprehensive control over PROTON members, designations, events, gallery, and invitations'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00d05a] animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground">
            Status: {stats.isConfigured ? 'Live Database Active' : 'Fallback / Demo Mode'}
          </span>
        </div>
      </div>

      {!stats.isConfigured && (
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wider">NEON DATABASE PENDING CONFIGURATION</div>
            <p className="text-muted-foreground">
              Live database actions will be active once `DATABASE_URL` (or `POSTGRES_URL`) is populated in the environment. Public pages currently display resilient static club data.
            </p>
          </div>
        </div>
      )}

      {/* Stats Bento Grid — Live CMS Telemetry */}
      <div className={`grid grid-cols-1 ${perms.isVicePresident ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {/* 01: Members & Approvals */}
        <Link
          href="/admin/members"
          className="p-5 rounded-xl border border-[#222] hover:border-[#00d05a]/60 bg-[#0c0c0c] hover:bg-[#111111] transition-all group relative overflow-hidden block"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-mono uppercase tracking-wider group-hover:text-foreground transition-colors">
              Members &amp; Operatives
            </span>
            <Users className="w-4 h-4 text-[#00d05a]" />
          </div>
          <div className="text-3xl font-mono font-bold text-foreground">
            {stats.totalMembers}
          </div>
          <div className="text-[11px] font-mono text-muted-foreground mt-2 flex items-center justify-between gap-1 flex-wrap">
            {stats.pendingMembers > 0 ? (
              <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30 animate-pulse text-[10px]">
                <Clock className="w-3 h-3" />
                <span>{stats.pendingMembers} Pending Review</span>
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 font-bold text-[10px]">
                <CheckCircle2 className="w-3 h-3" />
                <span>{stats.approvedMembers} Active Approved</span>
              </span>
            )}
            <span className="text-muted-foreground text-[10px]">
              {stats.coreMembers} Core Leads
            </span>
          </div>
        </Link>

        {perms.isVicePresident ? (
          <>
            <Link
              href="/admin/invitations"
              className="p-5 rounded-xl border border-[#222] hover:border-[#00d05a]/60 bg-[#0c0c0c] hover:bg-[#111111] transition-all group relative overflow-hidden block"
            >
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-mono uppercase tracking-wider group-hover:text-foreground transition-colors">
                  Active Invitations
                </span>
                <Mail className="w-4 h-4 text-[#00d05a]" />
              </div>
              <div className="text-3xl font-mono font-bold text-foreground">
                {stats.pendingInvitations}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground mt-2 flex items-center justify-between">
                <span>Cryptographic Tokens</span>
                <span className="text-cyan-400 text-[10px] font-bold">DISPATCHED</span>
              </div>
            </Link>

            <Link
              href="/admin/members"
              className="p-5 rounded-xl border border-[#222] hover:border-emerald-500/60 bg-[#0c0c0c] hover:bg-[#111111] transition-all group relative overflow-hidden block"
            >
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-mono uppercase tracking-wider group-hover:text-foreground transition-colors">
                  Approved Active
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-mono font-bold text-emerald-400">
                {stats.approvedMembers}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground mt-2 flex items-center justify-between">
                <span>Active Public Members</span>
                <span className="text-muted-foreground text-[10px]">{stats.rejectedMembers} Rejected</span>
              </div>
            </Link>
          </>
        ) : (
          <>
            {/* 02: Designations & Hierarchy */}
            <Link
              href="/admin/designations"
              className="p-5 rounded-xl border border-[#222] hover:border-amber-500/60 bg-[#0c0c0c] hover:bg-[#111111] transition-all group relative overflow-hidden block"
            >
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-mono uppercase tracking-wider group-hover:text-foreground transition-colors">
                  Designations &amp; Posts
                </span>
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-mono font-bold text-foreground">
                {stats.designationsCount}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground mt-2 flex items-center justify-between">
                <span>Active Hierarchy Posts</span>
                {stats.pendingInvitations > 0 ? (
                  <span className="text-amber-400 text-[10px] font-bold">
                    {stats.pendingInvitations} Invites Sent
                  </span>
                ) : (
                  <span className="text-emerald-400 text-[10px] font-bold">Roster Synced</span>
                )}
              </div>
            </Link>

            {/* 03: Events & Workshops */}
            <Link
              href="/admin/events"
              className="p-5 rounded-xl border border-[#222] hover:border-blue-500/60 bg-[#0c0c0c] hover:bg-[#111111] transition-all group relative overflow-hidden block"
            >
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-mono uppercase tracking-wider group-hover:text-foreground transition-colors">
                  Events &amp; Workshops
                </span>
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-mono font-bold text-foreground">
                {stats.totalEvents}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground mt-2 flex items-center justify-between">
                <span>{stats.publishedEvents} Published</span>
                {stats.openRegistrations > 0 ? (
                  <span className="text-cyan-400 text-[10px] font-bold">
                    {stats.openRegistrations} Open Registrations
                  </span>
                ) : (
                  <span className="text-muted-foreground text-[10px]">
                    Archive Active
                  </span>
                )}
              </div>
            </Link>

            {/* 04: Gallery Archive & Albums */}
            <Link
              href="/admin/gallery"
              className="p-5 rounded-xl border border-[#222] hover:border-purple-500/60 bg-[#0c0c0c] hover:bg-[#111111] transition-all group relative overflow-hidden block"
            >
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-mono uppercase tracking-wider group-hover:text-foreground transition-colors">
                  Gallery &amp; Albums
                </span>
                <ImageIcon className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-mono font-bold text-foreground">
                {stats.totalGallery}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground mt-2 flex items-center justify-between">
                <span>Photos Curated</span>
                <span className="text-purple-400 text-[10px] font-bold">
                  {stats.totalAlbums} {stats.totalAlbums === 1 ? 'Album' : 'Albums'}
                </span>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Navigation Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
          // CMS MODULE CONTROL
        </h2>
        <div className={`grid grid-cols-1 ${perms.isVicePresident ? 'sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
          {(perms.canApproveMembers || perms.isFullAdmin) && (
            <Link
              href="/admin/members"
              prefetch={false}
              className="p-5 rounded-xl border border-[#222] hover:border-[#00d05a]/60 bg-[#0c0c0c] hover:bg-[#111] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="font-mono font-bold text-sm uppercase text-foreground flex items-center gap-2">
                <span>Member Management</span>
                {stats.pendingMembers > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-black font-bold">
                    {stats.pendingMembers}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Review pending registrations, verify student credentials, and approve members into the directory.
              </p>
            </Link>
          )}

          {perms.canManageInvitations && (
            <Link
              href="/admin/invitations"
              prefetch={false}
              className="p-5 rounded-xl border border-[#222] hover:border-[#00d05a]/60 bg-[#0c0c0c] hover:bg-[#111] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <Mail className="w-5 h-5 text-[#00d05a]" />
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-[#00d05a] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="font-mono font-bold text-sm uppercase text-foreground">
                Member Invitations
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Issue cryptographic, single-use token links to invite verified students into PROTON.
              </p>
            </Link>
          )}

          <Link
            href="/admin/profile"
            prefetch={false}
            className="p-5 rounded-xl border border-[#222] hover:border-[#00d05a]/60 bg-[#0c0c0c] hover:bg-[#111] transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <KeyRound className="w-5 h-5 text-[#00d05a]" />
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-[#00d05a] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div className="font-mono font-bold text-sm uppercase text-foreground">
              Profile &amp; Password
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              Update your account password, manage official credentials, and edit your profile dossier.
            </p>
          </Link>

          {perms.canManageDesignations && (
            <Link
              href="/admin/designations"
              prefetch={false}
              className="p-5 rounded-xl border border-[#222] hover:border-[#00d05a]/60 bg-[#0c0c0c] hover:bg-[#111] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="font-mono font-bold text-sm uppercase text-foreground">
                Designation Hierarchy
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Control the strict display order, core indicators, and organizational hierarchy of team posts.
              </p>
            </Link>
          )}

          {perms.canManageEvents && (
            <Link
              href="/admin/events"
              prefetch={false}
              className="p-5 rounded-xl border border-[#222] hover:border-[#00d05a]/60 bg-[#0c0c0c] hover:bg-[#111] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="font-mono font-bold text-sm uppercase text-foreground">
                Event Management
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Create, publish, edit, and archive workshops, competitions, talks, and registration links.
              </p>
            </Link>
          )}

          {perms.canManageGallery && (
            <Link
              href="/admin/gallery"
              prefetch={false}
              className="p-5 rounded-xl border border-[#222] hover:border-[#00d05a]/60 bg-[#0c0c0c] hover:bg-[#111] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <ImageIcon className="w-5 h-5 text-purple-400" />
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="font-mono font-bold text-sm uppercase text-foreground">
                Gallery Management
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Upload event photos, categorize club moments, organize albums, and curate visual highlights.
              </p>
            </Link>
          )}

          {perms.canViewAuditLogs && (
            <Link
              href="/admin/logs"
              prefetch={false}
              className="p-5 rounded-xl border border-[#222] hover:border-rose-500/60 bg-[#0c0c0c] hover:bg-[#111] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="font-mono font-bold text-sm uppercase text-foreground flex items-center gap-2">
                <span>Security &amp; Audit Logs</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-950/80 text-rose-300 border border-rose-800/40">
                  IMMUTABLE
                </span>
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Inspect user login sessions, member expulsions, and administrative modifications with zero deletion.
              </p>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      {perms.canViewAuditLogs && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
              // RECENT SECURITY &amp; USER ACTIVITY
            </h2>
            <Link
              href="/admin/logs"
              className="text-xs font-mono text-[#00d05a] hover:underline flex items-center gap-1"
            >
              <span>View All Activity Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-[#222] bg-[#0c0c0c] overflow-hidden">
            {recentLogs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground font-mono text-xs">
                No recent security activity recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-[#1a1a1a]">
                {recentLogs.map((log) => {
                  const isExpulsion = log.action === 'MEMBER_PERMANENTLY_DELETED'
                  const isLogin = log.action === 'LOGIN'
                  const isLogout = log.action === 'LOGOUT'

                  return (
                    <div
                      key={log.id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono hover:bg-[#111] transition-colors ${
                        isExpulsion ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#181818] border border-[#2c2c2c] flex items-center justify-center shrink-0">
                          {isExpulsion && <Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                          {isLogin && <LogIn className="w-3.5 h-3.5 text-[#00d05a]" />}
                          {isLogout && <LogOut className="w-3.5 h-3.5 text-neutral-400" />}
                          {!isExpulsion && !isLogin && !isLogout && (
                            <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">
                              {log.actor_name || log.actor_email}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                isExpulsion
                                  ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                                  : isLogin
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                  : 'bg-[#181818] text-neutral-400 border border-[#2c2c2c]'
                              }`}
                            >
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {log.target_name ? `Target: ${log.target_name}` : ''}
                            {log.details?.reason ? ` • Reason: "${log.details.reason}"` : ''}
                            {log.details?.destination ? ` • Destination: ${log.details.destination}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="text-muted-foreground text-[10px] shrink-0 self-end sm:self-center flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        <span>{new Date(log.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
