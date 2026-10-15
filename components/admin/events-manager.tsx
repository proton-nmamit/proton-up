'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { 
  Calendar, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  X, 
  Upload, 
  ExternalLink, 
  Sparkles, 
  MapPin, 
  Globe,
  Lock,
  ShieldAlert
} from 'lucide-react'
import { DbEvent, ContentStatus } from '@/lib/types/database'
import { CyberConfirmDialog } from '@/components/ui/cyber-confirm-dialog'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'
import { 
  createEventAction, 
  updateEventAction, 
  toggleEventStatusAction, 
  deleteEventAction 
} from '@/app/actions/events'

interface EventsManagerProps {
  initialEvents: DbEvent[]
  userEmail?: string
}

export function EventsManager({ initialEvents, userEmail }: EventsManagerProps) {
  const permissions = getAdminPermissions(userEmail)
  const [events, setEvents] = useState<DbEvent[]>(initialEvents)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<DbEvent | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    id: string
    title: string
    isLoading: boolean
  }>({
    isOpen: false,
    id: '',
    title: '',
    isLoading: false,
  })

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return events.filter((ev) => {
      if (statusFilter !== 'all' && ev.status !== statusFilter) return false
      if (!q) return true
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.category.toLowerCase().includes(q) ||
        (ev.location ? ev.location.toLowerCase().includes(q) : false) ||
        ev.description.toLowerCase().includes(q)
      )
    })
  }, [events, searchQuery, statusFilter])

  const handleToggleStatus = async (id: string, currentStatus: ContentStatus) => {
    const nextStatus: ContentStatus = currentStatus === 'published' ? 'draft' : 'published'
    if (nextStatus === 'published' && !permissions.canPublishEvents) {
      setErrorMsg('Permission denied: Event approval and publishing requires an authorized administrator.')
      return
    }
    const res = await toggleEventStatusAction(id, nextStatus)
    if (res.success) {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: nextStatus } : e))
      )
    } else if (res.error) {
      setErrorMsg(res.error)
    }
  }

  const handleDelete = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      id,
      title,
      isLoading: false,
    })
  }

  const handleExecuteDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, isLoading: true }))
    try {
      const res = await deleteEventAction(confirmDialog.id)
      if (res.success) {
        setEvents((prev) => prev.filter((e) => e.id !== confirmDialog.id))
        setConfirmDialog({ isOpen: false, id: '', title: '', isLoading: false })
      } else if (res.error) {
        setErrorMsg(res.error)
        setConfirmDialog((prev) => ({ ...prev, isLoading: false }))
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed')
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)

      const file = formData.get('poster_file') as File | null
      if (file && file.size > 10 * 1024 * 1024) {
        setErrorMsg(`Poster file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum allowed limit is 10 MB.`)
        setIsSubmitting(false)
        return
      }

      const res = await createEventAction(formData)
      if (res.success) {
        window.location.reload()
      } else if (res.error) {
        setErrorMsg(res.error)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Event creation failed.'
      if (msg.toLowerCase().includes('unexpected response')) {
        setErrorMsg('The server could not process the event creation. Please ensure the poster file is under 10 MB.')
      } else {
        setErrorMsg(msg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEvent) return
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      formData.append('id', editingEvent.id)

      const file = formData.get('poster_file') as File | null
      if (file && file.size > 10 * 1024 * 1024) {
        setErrorMsg(`Poster file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum allowed limit is 10 MB.`)
        setIsSubmitting(false)
        return
      }

      const res = await updateEventAction(formData)
      if (res.success) {
        window.location.reload()
      } else if (res.error) {
        setErrorMsg(res.error)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Event update failed.'
      setErrorMsg(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#00d05a] mb-1">
            <Calendar className="w-4 h-4" />
            <span>ACTIVITIES // HACKATHONS & WORKSHOPS</span>
          </div>
          <h1 className="text-xl font-bold font-mono uppercase text-foreground">
            EVENT MANAGEMENT CONSOLE
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Create, publish, schedule, and curate club workshops, talks, and cybersecurity competitions
          </p>
        </div>

        <button
          data-testid="new-event-btn"
          onClick={() => {
            setIsCreateOpen(true)
            setErrorMsg('')
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-[#222] bg-[#0c0c0c] flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'published', 'draft', 'archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#00d05a] text-black font-bold'
                  : 'bg-[#141414] text-muted-foreground hover:text-foreground'
              }`}
            >
              {st} ({st === 'all' ? events.length : events.filter((e) => e.status === st).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#262626] focus:border-[#00d05a] rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-foreground outline-none"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground font-mono text-xs border border-[#222] rounded-xl bg-[#0c0c0c]">
            No events match the selected criteria. Click &quot;New Event&quot; to publish one.
          </div>
        ) : (
          filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="border border-[#222] rounded-xl bg-[#0c0c0c] overflow-hidden flex flex-col justify-between hover:border-[#333] transition-all shadow-lg"
            >
              <div>
                {/* Poster Preview - Instagram 4:5 Ratio */}
                <div className="relative aspect-[4/5] w-full bg-[#141414] border-b border-[#222] overflow-hidden">
                  <Image
                    src={ev.poster_url || '/images/hero-1.png'}
                    alt={ev.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        ev.timeline_status === 'completed'
                          ? 'bg-zinc-900/90 text-zinc-300 border border-zinc-700'
                          : ev.timeline_status === 'ongoing'
                          ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/50'
                          : ev.timeline_status === 'postponed'
                          ? 'bg-rose-950/90 text-rose-300 border border-rose-500/50'
                          : 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50'
                      }`}
                    >
                      {ev.timeline_status === 'completed'
                        ? 'COMPLETED'
                        : ev.timeline_status === 'ongoing'
                        ? '● LIVE NOW'
                        : ev.timeline_status === 'postponed'
                        ? 'POSTPONED'
                        : 'UPCOMING'}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase ${
                        ev.status === 'published'
                          ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/40'
                          : ev.status === 'draft'
                          ? 'bg-amber-950/90 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {ev.status === 'draft' ? '⏳ DRAFT' : ev.status === 'published' ? '✓ LIVE' : 'ARCHIVED'}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-0.5 rounded bg-black/85 text-[#00d05a] border border-[#00d05a]/30 text-[9.5px] font-mono font-bold uppercase">
                      {ev.category_label || ev.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3.5 space-y-1.5 font-mono">
                  <h3 className="font-bold text-xs text-foreground line-clamp-1">
                    {ev.title}
                  </h3>
                  <div className="flex items-center gap-2.5 text-[10.5px] text-muted-foreground">
                    <div className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-[#00d05a]" />
                      <span>{ev.formatted_date || ev.date || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pt-0.5">
                    {ev.description}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 pt-2.5 border-t border-[#1a1a1a] flex items-center justify-between text-xs font-mono">
                {permissions.canPublishEvents ? (
                  <button
                    onClick={() => handleToggleStatus(ev.id, ev.status)}
                    className={`px-2.5 py-1 rounded text-[9.5px] font-bold uppercase cursor-pointer transition-all ${
                      ev.status === 'published'
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                        : 'bg-[#00d05a] text-black hover:bg-[#00d05a]/90 shadow-[0_0_12px_rgba(0,208,90,0.25)]'
                    }`}
                  >
                    {ev.status === 'published' ? '✕ Revert to Draft' : '✓ Approve & Publish'}
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    {ev.status === 'published' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        PUBLISHED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                        <Clock className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                        PENDING APPROVAL
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingEvent(ev)
                      setErrorMsg('')
                    }}
                    className="p-1 rounded bg-[#1c1c1c] hover:bg-[#262626] text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Edit event"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id, ev.title)}
                    className="p-1 rounded bg-[#1c1c1c] hover:bg-rose-950/40 text-muted-foreground hover:text-rose-400 cursor-pointer"
                    title="Delete event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0e0e0e] border border-[#222] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#141414] shrink-0">
              <span className="font-mono text-xs font-bold uppercase text-foreground">
                CREATE NEW EVENT
              </span>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto font-mono text-xs flex-1">
              <div>
                <label className="block uppercase text-muted-foreground mb-1">Event Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Hack The Grid 2025"
                  className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Category Slug *</label>
                  <input
                    type="text"
                    name="category"
                    required
                    defaultValue="technical"
                    placeholder="workshop / competition"
                    className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Category Label *</label>
                  <input
                    type="text"
                    name="category_label"
                    required
                    defaultValue="Technical Workshop"
                    placeholder="Cyber Competition"
                    className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Event Date (YYYY-MM-DD) *</label>
                  <input
                    type="date"
                    name="event_date"
                    required
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Display Date</label>
                  <input
                    type="text"
                    name="formatted_date"
                    placeholder="e.g. October 24, 2025"
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Event Time</label>
                  <input
                    type="text"
                    name="event_time"
                    placeholder="09:30 AM - 04:30 PM"
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Sambhram Auditorium"
                  className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Timeline State</label>
                  <select
                    name="timeline_status"
                    defaultValue="upcoming"
                    className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none cursor-pointer"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing (Live)</option>
                    <option value="completed">Completed</option>
                    <option value="postponed">Postponed</option>
                  </select>
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Publication Status</label>
                  <div className="w-full bg-[#141414] border border-[#262626] rounded p-2 text-xs font-mono flex items-center justify-between text-amber-400">
                    <span className="flex items-center gap-1.5 font-bold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      DRAFT (REQUIRES ADMIN APPROVAL)
                    </span>
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                  <input type="hidden" name="status" value="draft" />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>New events are saved as Drafts. An admin must click &quot;Approve &amp; Publish&quot; before the event appears on the public website.</span>
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1">
                  Upload Poster Image (Max 5 MB, JPEG/PNG/WebP) &bull; <span className="text-[#00d05a] font-bold">Instagram 4:5 (1080×1350) Ratio</span>
                </label>
                <input
                  type="file"
                  name="poster_file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setPosterPreview(URL.createObjectURL(f))
                    else setPosterPreview(null)
                  }}
                  className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground text-xs file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:bg-[#00d05a] file:text-black file:font-bold file:cursor-pointer"
                />
                {posterPreview && (
                  <div className="mt-3 p-3 rounded-xl border border-[#262626] bg-[#101010] flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00d05a] animate-pulse" />
                      Instagram Poster (4:5) Live Preview
                    </span>
                    <div className="relative w-44 aspect-[4/5] rounded-lg overflow-hidden border border-[#00d05a]/50 shadow-xl bg-black">
                      <Image
                        src={posterPreview}
                        alt="Instagram Poster Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1">Description *</label>
                <textarea
                  rows={3}
                  name="description"
                  required
                  placeholder="Comprehensive event brief..."
                  className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="registration_open" value="true" className="rounded bg-[#161616]" />
                  <span>Registration Open</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_featured" value="true" className="rounded bg-[#161616]" />
                  <span>Featured Event</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-[#1a1a1a] text-muted-foreground uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'SAVING...' : 'SAVE EVENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0e0e0e] border border-[#222] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#141414] shrink-0">
              <span className="font-mono text-xs font-bold uppercase text-foreground">
                EDIT EVENT // {editingEvent.title}
              </span>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 overflow-y-auto font-mono text-xs flex-1">
              <div>
                <label className="block uppercase text-muted-foreground mb-1">Event Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingEvent.title}
                  className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Category Slug</label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={editingEvent.category}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Category Label</label>
                  <input
                    type="text"
                    name="category_label"
                    defaultValue={editingEvent.category_label}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Event Date (YYYY-MM-DD) *</label>
                  <input
                    type="date"
                    name="event_date"
                    required
                    defaultValue={editingEvent.event_date || (editingEvent as any).date}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Display Date</label>
                  <input
                    type="text"
                    name="formatted_date"
                    defaultValue={editingEvent.formatted_date || ''}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Event Time</label>
                  <input
                    type="text"
                    name="event_time"
                    defaultValue={editingEvent.event_time || (editingEvent as any).time || ''}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editingEvent.location || ''}
                    className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Timeline State</label>
                  <select
                    name="timeline_status"
                    defaultValue={editingEvent.timeline_status || 'upcoming'}
                    className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none text-xs cursor-pointer"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing (Live)</option>
                    <option value="completed">Completed</option>
                    <option value="postponed">Postponed</option>
                  </select>
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Publication Status</label>
                  {!permissions.canPublishEvents ? (
                    <div className="w-full bg-[#141414] border border-[#262626] rounded p-2 text-xs font-mono flex items-center justify-between">
                      <span className={editingEvent.status === 'published' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {editingEvent.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                      <input type="hidden" name="status" value={editingEvent.status} />
                    </div>
                  ) : (
                    <select
                      name="status"
                      defaultValue={editingEvent.status}
                      className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none text-xs cursor-pointer"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1">
                  Replace Poster Image (Optional, Max 5 MB) &bull; <span className="text-[#00d05a] font-bold">Instagram 4:5 Ratio</span>
                </label>
                <input
                  type="file"
                  name="poster_file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setPosterPreview(URL.createObjectURL(f))
                    else setPosterPreview(null)
                  }}
                  className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground text-xs file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:bg-[#00d05a] file:text-black file:font-bold file:cursor-pointer"
                />
                <div className="mt-3 p-3 rounded-xl border border-[#262626] bg-[#101010] flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d05a]" />
                    {posterPreview ? 'New Poster Preview (4:5)' : 'Current Poster &bull; Instagram Ratio (4:5)'}
                  </span>
                  <div className="relative w-36 aspect-[4/5] rounded-lg overflow-hidden border border-[#333] shadow-md bg-black">
                    <Image
                      src={posterPreview || editingEvent.poster_url || '/images/hero-1.png'}
                      alt="Poster Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1">Description *</label>
                <textarea
                  rows={3}
                  name="description"
                  required
                  defaultValue={editingEvent.description}
                  className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="registration_open"
                    value="true"
                    defaultChecked={editingEvent.registration_open}
                    className="rounded bg-[#161616]"
                  />
                  <span>Registration Open</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    value="true"
                    defaultChecked={editingEvent.is_featured}
                    className="rounded bg-[#161616]"
                  />
                  <span>Featured Event</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-3.5 py-1.5 rounded bg-[#1a1a1a] text-muted-foreground uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Cyber Confirmation Dialog */}
      <CyberConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="DELETE EVENT // SCHEDULE ARCHIVE"
        subtitle="PERMANENT REMOVAL PROTOCOL"
        message={
          <span>
            Are you sure you want to permanently delete event <strong className="text-white font-bold">&quot;{confirmDialog.title}&quot;</strong>? This will remove all associated schedule records.
          </span>
        }
        confirmLabel="DELETE EVENT"
        cancelLabel="CANCEL"
        variant="danger"
        isLoading={confirmDialog.isLoading}
        onConfirm={handleExecuteDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, id: '', title: '', isLoading: false })}
      />
    </div>
  )
}
