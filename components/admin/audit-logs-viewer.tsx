'use client'

import React, { useState, useMemo } from 'react'
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  LogIn, 
  LogOut, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  FileText, 
  Layers, 
  Mail, 
  Info,
  Check,
  Copy,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  X
} from 'lucide-react'
import { DbAuditLog, AuditAction } from '@/lib/types/database'

interface AuditLogsViewerProps {
  initialLogs: DbAuditLog[]
  source?: 'database' | 'local_journal'
}

type FilterCategory = 'all' | 'sessions' | 'deletions' | 'members' | 'content'

function getDateKey(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return 'unknown'
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d)
  } catch {
    return 'unknown'
  }
}

function formatDateLabel(dateKey: string): string {
  try {
    if (dateKey === 'unknown') return 'Unknown'
    const [y, m, d] = dateKey.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
    
    const now = new Date()
    const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now)
    
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const yesterdayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(yesterday)
    
    const formatted = date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
    })
    
    if (dateKey === todayKey) return `Today (${formatted})`
    if (dateKey === yesterdayKey) return `Yesterday (${formatted})`
    return formatted
  } catch {
    return dateKey
  }
}

function formatDateHeader(dateKey: string): string {
  try {
    if (dateKey === 'unknown') return 'UNKNOWN TIMESTAMPS'
    const [y, m, d] = dateKey.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateKey
  }
}

function isSuperAdminAuditRecord(record: {
  actor_email?: string | null
  actor_name?: string | null
  actor_role?: string | null
}): boolean {
  const email = (record.actor_email || '').toLowerCase().trim()
  const name = (record.actor_name || '').toLowerCase().trim()
  const role = (record.actor_role || '').toLowerCase().trim()

  return (
    email === 'admin@proton.cyber' ||
    email === 'admin@proton' ||
    email === 'proton.admin@proton.cyber' ||
    email === 'proton.admin@proton' ||
    name === 'proton administrator' ||
    role === 'super_admin'
  )
}

const AUDIT_RESET_CUTOFF = '2026-09-26T06:25:00.000Z'

export function AuditLogsViewer({ initialLogs, source = 'database' }: AuditLogsViewerProps) {
  const [logs, setLogs] = useState<DbAuditLog[]>(() =>
    (initialLogs || []).filter(
      (l) =>
        !isSuperAdminAuditRecord(l) &&
        new Date(l.created_at).getTime() > new Date(AUDIT_RESET_CUTOFF).getTime()
    )
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all')
  const [selectedDate, setSelectedDate] = useState<string>('all')
  const [inspectingLog, setInspectingLog] = useState<DbAuditLog | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Available unique dates extracted from logs
  const availableDates = useMemo(() => {
    const counts = new Map<string, number>()
    for (const log of logs) {
      if (isSuperAdminAuditRecord(log)) continue
      const key = getDateKey(log.created_at)
      if (key !== 'unknown') {
        counts.set(key, (counts.get(key) || 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateKey, count]) => ({
        dateKey,
        count,
        label: formatDateLabel(dateKey),
      }))
  }, [logs])

  // Logs scoped to selected date (for metrics)
  const dateScopedLogs = useMemo(() => {
    if (selectedDate === 'all') return logs
    return logs.filter((l) => getDateKey(l.created_at) === selectedDate)
  }, [logs, selectedDate])

  // Metrics
  const stats = useMemo(() => {
    const total = dateScopedLogs.length
    const logins = dateScopedLogs.filter((l) => l.action === 'LOGIN' || l.action === 'LOGOUT').length
    const deletions = dateScopedLogs.filter((l) => l.action === 'MEMBER_PERMANENTLY_DELETED').length
    const rosterChanges = dateScopedLogs.filter((l) => 
      l.action === 'MEMBER_APPROVED' || 
      l.action === 'MEMBER_REJECTED' || 
      l.action === 'MEMBER_UPDATED'
    ).length
    return { total, logins, deletions, rosterChanges }
  }, [dateScopedLogs])

  // Filtered logs (by date, category, and search query)
  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return logs.filter((log) => {
      // Invisible super admin policy
      if (isSuperAdminAuditRecord(log)) return false

      // Date Filter
      if (selectedDate !== 'all') {
        const logDateKey = getDateKey(log.created_at)
        if (logDateKey !== selectedDate) return false
      }

      // Category Filter
      if (categoryFilter === 'sessions') {
        if (log.action !== 'LOGIN' && log.action !== 'LOGOUT') return false
      } else if (categoryFilter === 'deletions') {
        if (log.action !== 'MEMBER_PERMANENTLY_DELETED') return false
      } else if (categoryFilter === 'members') {
        if (
          log.action !== 'MEMBER_APPROVED' && 
          log.action !== 'MEMBER_REJECTED' && 
          log.action !== 'MEMBER_UPDATED' &&
          log.action !== 'MEMBER_PERMANENTLY_DELETED'
        ) {
          return false
        }
      } else if (categoryFilter === 'content') {
        if (
          !log.action.startsWith('EVENT_') && 
          !log.action.startsWith('GALLERY_') && 
          !log.action.startsWith('DESIGNATION_') &&
          !log.action.startsWith('INVITATION_')
        ) {
          return false
        }
      }

      // Search Query
      if (!q) return true

      const actionMatch = log.action.toLowerCase().includes(q)
      const actorEmailMatch = log.actor_email?.toLowerCase().includes(q)
      const actorNameMatch = log.actor_name?.toLowerCase().includes(q)
      const targetNameMatch = log.target_name?.toLowerCase().includes(q)
      const targetEmailMatch = log.target_email?.toLowerCase().includes(q)
      const detailsMatch = log.details ? JSON.stringify(log.details).toLowerCase().includes(q) : false

      return actionMatch || actorEmailMatch || actorNameMatch || targetNameMatch || targetEmailMatch || detailsMatch
    })
  }, [logs, selectedDate, categoryFilter, searchQuery])

  // Group filtered logs date-wise
  const groupedByDate = useMemo(() => {
    const map = new Map<string, DbAuditLog[]>()
    for (const log of filteredLogs) {
      const key = getDateKey(log.created_at)
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(log)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredLogs])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'LOGIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold font-mono">
            <LogIn className="w-3 h-3 text-[#00d05a]" />
            <span>LOGIN</span>
          </span>
        )
      case 'LOGOUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-700/60 text-[10px] font-bold font-mono">
            <LogOut className="w-3 h-3 text-neutral-400" />
            <span>LOGOUT</span>
          </span>
        )
      case 'MEMBER_PERMANENTLY_DELETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/50 text-[10px] font-bold font-mono shadow-[0_0_8px_rgba(244,63,94,0.2)]">
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>MEMBER EXPELLED</span>
          </span>
        )
      case 'MEMBER_APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
            <CheckCircle2 className="w-3 h-3 text-[#00d05a]" />
            <span>APPROVED</span>
          </span>
        )
      case 'MEMBER_REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">
            <XCircle className="w-3 h-3 text-amber-400" />
            <span>REJECTED</span>
          </span>
        )
      case 'MEMBER_UPDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold font-mono">
            <Edit3 className="w-3 h-3 text-cyan-400" />
            <span>PROFILE UPDATED</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30 text-[10px] font-bold font-mono">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>{action.replace(/_/g, ' ')}</span>
          </span>
        )
    }
  }

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return iso
      return d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#00d05a] mb-1">
            <ShieldAlert className="w-4 h-4 text-[#00d05a]" />
            <span>SECURITY AUDIT JOURNAL // IMMUTABLE RECORD</span>
          </div>
          <h1 className="text-xl font-bold font-mono uppercase text-foreground">
            AUDIT LOGS & USER ACTIVITY
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Tamper-proof record of logins, administrative modifications, and member expulsions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-[#222] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#00d05a] animate-pulse" />
            <span className="text-muted-foreground">
              Storage: <span className="text-white font-bold">{source === 'database' ? 'Postgres Live' : 'Encrypted Journal'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#222] bg-[#0c0c0c] space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest truncate">
            {selectedDate === 'all' ? 'TOTAL LOGGED EVENTS' : `EVENTS // ${formatDateLabel(selectedDate).toUpperCase()}`}
          </div>
          <div className="text-2xl font-mono font-bold text-foreground">
            {stats.total}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-[#222] bg-[#0c0c0c] space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            AUTHENTICATIONS
          </div>
          <div className="text-2xl font-mono font-bold text-[#00d05a]">
            {stats.logins}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-rose-950/40 bg-[#0c0c0c] space-y-1">
          <div className="text-[10px] font-mono text-rose-400/80 uppercase tracking-widest">
            PERMANENT EXPULSIONS
          </div>
          <div className="text-2xl font-mono font-bold text-rose-400">
            {stats.deletions}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-[#222] bg-[#0c0c0c] space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            ROSTER CHANGES
          </div>
          <div className="text-2xl font-mono font-bold text-cyan-400">
            {stats.rosterChanges}
          </div>
        </div>
      </div>

      {/* Date-Wise Selector Header (Top Date Selector) */}
      <div className="p-4 rounded-xl border border-[#222] bg-[#0c0c0c] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#00d05a]">
            <Calendar className="w-4 h-4 text-[#00d05a]" />
            <span>DAILY ACTIVITY JOURNAL // FILTER BY DATE</span>
            {selectedDate !== 'all' && (
              <span className="px-2 py-0.5 rounded-full bg-[#00d05a]/10 text-[#00d05a] border border-[#00d05a]/30 text-[10px] font-bold">
                Filtered: {formatDateLabel(selectedDate)}
              </span>
            )}
          </div>

          {/* Date Picker Input & Clear Filter */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Pick Date:</span>
            <input
              type="date"
              value={selectedDate === 'all' ? '' : selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || 'all')}
              className="bg-[#141414] hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] border border-[#222] focus:border-[#00d05a] text-xs font-mono text-foreground px-3 py-1.5 rounded-lg outline-none transition-colors cursor-pointer"
            />
            {selectedDate !== 'all' && (
              <button
                onClick={() => setSelectedDate('all')}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                Show All Days
              </button>
            )}
          </div>
        </div>

        {/* Clickable Date Pills with event counters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedDate('all')}
            className={`px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              selectedDate === 'all'
                ? 'bg-[#00d05a] text-black shadow-[0_0_12px_#00d05a]/30'
                : 'bg-[#141414] text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a] border border-[#222]'
            }`}
          >
            <span>All Dates</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedDate === 'all' ? 'bg-black/20 text-black' : 'bg-neutral-800 text-neutral-400'
            }`}>
              {logs.length}
            </span>
          </button>

          {availableDates.map(({ dateKey, label, count }) => {
            const isSelected = selectedDate === dateKey
            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#00d05a] text-black shadow-[0_0_12px_#00d05a]/30'
                    : 'bg-[#141414] text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a] border border-[#222]'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-neutral-500'}`} />
                <span>{label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-black text-[#00d05a]' : 'bg-neutral-800 text-neutral-300'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="p-4 rounded-xl border border-[#222] bg-[#0c0c0c] space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[#00d05a] text-black shadow-[0_0_10px_#00d05a]/30'
                  : 'bg-[#141414] text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a]'
              }`}
            >
              All ({dateScopedLogs.length})
            </button>
            <button
              onClick={() => setCategoryFilter('sessions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                categoryFilter === 'sessions'
                  ? 'bg-[#00d05a] text-black shadow-[0_0_10px_#00d05a]/30'
                  : 'bg-[#141414] text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a]'
              }`}
            >
              Logins &amp; Sessions
            </button>
            <button
              onClick={() => setCategoryFilter('deletions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                categoryFilter === 'deletions'
                  ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                  : 'bg-[#141414] text-rose-400/80 hover:text-rose-300 hover:bg-[#1a1a1a]'
              }`}
            >
              Expulsions ({stats.deletions})
            </button>
            <button
              onClick={() => setCategoryFilter('members')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                categoryFilter === 'members'
                  ? 'bg-[#00d05a] text-black shadow-[0_0_10px_#00d05a]/30'
                  : 'bg-[#141414] text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a]'
              }`}
            >
              Roster
            </button>
            <button
              onClick={() => setCategoryFilter('content')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                categoryFilter === 'content'
                  ? 'bg-[#00d05a] text-black shadow-[0_0_10px_#00d05a]/30'
                  : 'bg-[#141414] text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a]'
              }`}
            >
              Content Updates
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, email, reason, IP..."
              className="w-full bg-[#141414] border border-[#222] focus:border-[#00d05a] focus:ring-1 focus:ring-[#00d05a] rounded-lg pl-10 pr-4 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Entries */}
      <div className="rounded-xl border border-[#222] bg-[#0c0c0c] overflow-hidden">
        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-[#1a1a1a]">
          {groupedByDate.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground font-mono text-xs px-4">
              No activity logs recorded matching selected date or filters.
            </div>
          ) : (
            groupedByDate.map(([dateKey, dayLogs]) => (
              <React.Fragment key={dateKey}>
                {/* Date header */}
                <div className="py-2.5 px-4 font-mono font-bold text-xs text-[#00d05a] bg-gradient-to-r from-[#00d05a]/15 via-transparent to-transparent border-b border-[#26262b] bg-[#101012]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#00d05a]" />
                      <span className="uppercase tracking-wider">{formatDateHeader(dateKey)}</span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-normal">
                      {dayLogs.length} {dayLogs.length === 1 ? 'activity' : 'activities'}
                    </span>
                  </div>
                </div>
                {dayLogs.map((log) => {
                  const isExpulsion = log.action === 'MEMBER_PERMANENTLY_DELETED'
                  return (
                    <div
                      key={log.id}
                      className={`p-4 space-y-2.5 hover:bg-[#111] transition-colors ${isExpulsion ? 'bg-rose-950/10' : ''}`}
                    >
                      {/* Actor info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-foreground truncate">
                            {log.actor_name || log.actor_email}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate">
                            {log.actor_email}{log.actor_role ? ` • [${log.actor_role.toUpperCase()}]` : ''}
                          </div>
                        </div>
                        {getActionBadge(log.action)}
                      </div>
                      {/* Target + Details */}
                      {(log.target_name || log.target_email || log.details) && (
                        <div className="text-[11px] font-mono text-muted-foreground space-y-0.5">
                          {log.target_name && (
                            <div className="text-foreground font-semibold">{log.target_name}</div>
                          )}
                          {log.target_email && <div>{log.target_email}</div>}
                          {log.details?.reason && (
                            <div className="text-rose-300 italic">&ldquo;{log.details.reason}&rdquo;</div>
                          )}
                        </div>
                      )}
                      {/* Timestamp + Inspect */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{formatTimestamp(log.created_at)}</span>
                        </div>
                        <button
                          onClick={() => setInspectingLog(log)}
                          className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#222] text-muted-foreground hover:text-white border border-[#2c2c2c] transition-colors cursor-pointer text-[10px] uppercase font-bold"
                        >
                          Payload
                        </button>
                      </div>
                    </div>
                  )
                })}
              </React.Fragment>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[#222] bg-[#111] text-muted-foreground">
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">TIMESTAMP</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">ACTION / EVENT</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">ACTOR</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">TARGET / SCOPE</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">DETAILS / REASON</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {groupedByDate.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground font-mono">
                    No activity logs recorded matching selected date or filters.
                  </td>
                </tr>
              ) : (
                groupedByDate.map(([dateKey, dayLogs]) => (
                  <React.Fragment key={dateKey}>
                    {/* Date Sub-Header */}
                    <tr className="bg-[#101012] border-y border-[#26262b]">
                      <td colSpan={6} className="py-2.5 px-4 font-mono font-bold text-xs text-[#00d05a] bg-gradient-to-r from-[#00d05a]/15 via-transparent to-transparent">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#00d05a]" />
                            <span className="uppercase tracking-wider">{formatDateHeader(dateKey)}</span>
                          </div>
                          <span className="text-[11px] text-neutral-400 font-normal">
                            {dayLogs.length} {dayLogs.length === 1 ? 'activity' : 'activities'} recorded
                          </span>
                        </div>
                      </td>
                    </tr>

                    {dayLogs.map((log) => {
                      const isExpulsion = log.action === 'MEMBER_PERMANENTLY_DELETED'

                      return (
                        <tr
                          key={log.id}
                          className={`hover:bg-[#111] transition-colors ${
                            isExpulsion ? 'bg-rose-950/10' : ''
                          }`}
                        >
                          {/* Timestamp */}
                          <td className="py-3 px-4 whitespace-nowrap text-muted-foreground text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-neutral-500" />
                              <span>{formatTimestamp(log.created_at)}</span>
                            </div>
                          </td>

                          {/* Event Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {getActionBadge(log.action)}
                          </td>

                          {/* Actor */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-foreground">
                              {log.actor_name || log.actor_email}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {log.actor_email}
                              {log.actor_role ? ` • [${log.actor_role.toUpperCase()}]` : ''}
                            </div>
                          </td>

                          {/* Target */}
                          <td className="py-3 px-4">
                            {log.target_name ? (
                              <div className="font-bold text-foreground">
                                {log.target_name}
                              </div>
                            ) : log.target_type ? (
                              <div className="text-muted-foreground uppercase text-[10px]">
                                {log.target_type}
                              </div>
                            ) : (
                              <span className="text-neutral-600">—</span>
                            )}
                            {log.target_email && (
                              <div className="text-[10px] text-muted-foreground">
                                {log.target_email}
                              </div>
                            )}
                          </td>

                          {/* Details / Reason */}
                          <td className="py-3 px-4 max-w-xs truncate text-[11px]">
                            {log.details?.reason ? (
                              <span className="text-rose-300 font-semibold italic">
                                &ldquo;{log.details.reason}&rdquo;
                              </span>
                            ) : log.details?.destination ? (
                              <span className="text-muted-foreground">
                                Target: {log.details.destination}
                              </span>
                            ) : log.details?.status ? (
                              <span className="text-[#00d05a]">
                                Status: {log.details.status}
                              </span>
                            ) : (
                              <span className="text-neutral-500">
                                {log.details ? JSON.stringify(log.details) : '—'}
                              </span>
                            )}
                          </td>

                          {/* Inspect Button */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setInspectingLog(log)}
                              className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#222] text-muted-foreground hover:text-white border border-[#2c2c2c] transition-colors cursor-pointer text-[10px] uppercase font-bold"
                            >
                              Payload
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Immutability Footer Note */}
      <div className="p-4 rounded-xl bg-black/60 border border-neutral-800 text-xs font-mono text-neutral-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00d05a]" />
          <span>
            IMMUTABILITY POLICY: This audit journal is strictly append-only. No deletion or editing is permitted.
          </span>
        </div>
        <span className="text-[10px] text-neutral-600 uppercase">
          SEC_POLICY_V3 // ACTIVE
        </span>
      </div>

      {/* Log Payload Inspection Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0e0e0e] border border-[#222] rounded-xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#141414]">
              <div className="flex items-center gap-2 text-[#00d05a] font-mono text-xs font-bold uppercase">
                <Terminal className="w-4 h-4" />
                <span>AUDIT RECORD // PAYLOAD INSPECTION</span>
              </div>
              <button
                onClick={() => setInspectingLog(null)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-neutral-800">
                <div>
                  <div className="text-neutral-500 text-[10px] uppercase">EVENT ID:</div>
                  <div className="text-white select-all">{inspectingLog.id}</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px] uppercase">RECORDED AT:</div>
                  <div className="text-white">{formatTimestamp(inspectingLog.created_at)}</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px] uppercase">ACTION:</div>
                  <div>{getActionBadge(inspectingLog.action)}</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px] uppercase">ACTOR SIGNATURE:</div>
                  <div className="text-white">{inspectingLog.actor_email} ({inspectingLog.actor_name || 'N/A'})</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-neutral-500 text-[10px] uppercase">METADATA &amp; CONTEXT PAYLOAD:</span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(inspectingLog, null, 2), inspectingLog.id)}
                    className="inline-flex items-center gap-1 text-[10px] text-[#00d05a] hover:underline cursor-pointer"
                  >
                    {copiedId === inspectingLog.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === inspectingLog.id ? 'COPIED' : 'COPY JSON'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-black border border-[#222] text-[#00d05a] overflow-x-auto text-[11px] leading-relaxed max-h-72">
                  {JSON.stringify(inspectingLog, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setInspectingLog(null)}
                  className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs uppercase cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
