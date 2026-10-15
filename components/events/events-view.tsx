'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  X, 
  ArrowUpRight, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react'
import { ProtonEvent } from '@/lib/proton-data'

const ease = [0.22, 1, 0.36, 1] as const

interface EventsViewProps {
  initialEvents: ProtonEvent[]
}

export function EventsView({ initialEvents }: EventsViewProps) {
  const [events] = useState<ProtonEvent[]>(initialEvents)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeModalEvent, setActiveModalEvent] = useState<ProtonEvent | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Derive categories dynamically from events while maintaining default labels
  const categories = useMemo(() => {
    const defaultLabels: Record<string, string> = {
      all: 'All Events',
      workshop: 'Workshops',
      competition: 'Competitions',
      talk: 'Keynotes & Talks',
      outreach: 'Outreach',
      cultural: 'Cultural',
      technical: 'Technical Workshops',
    }

    const set = new Set<string>()
    for (const ev of events) {
      if (ev.category) set.add(ev.category)
    }

    const cats = [{ id: 'all', label: 'All Events' }]
    for (const c of set) {
      cats.push({
        id: c,
        label: defaultLabels[c] || (c.charAt(0).toUpperCase() + c.slice(1)),
      })
    }
    return cats
  }, [events])

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchCategory = selectedCategory === 'all' || ev.category.toLowerCase() === selectedCategory.toLowerCase()
      const q = searchQuery.toLowerCase().trim()
      const matchQuery = 
        !q ||
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q)
      return matchCategory && matchQuery
    })
  }, [events, selectedCategory, searchQuery])

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-12 lg:px-12 max-w-7xl mx-auto w-full space-y-12">
      {/* Header Hero */}
      <div className="text-center space-y-4 max-w-3xl pt-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/70 bg-card/60 text-[11px] font-mono text-[#00d05a] uppercase tracking-widest shadow-[0_0_10px_rgba(0,208,90,0.15)]"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>ACTIVITIES DIRECTORY // {events.length} EVENTS RECORDED</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="font-pixel text-4xl sm:text-6xl lg:text-7xl text-foreground tracking-tight select-none uppercase"
        >
          PROTON EVENTS
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
          className="text-xs sm:text-sm md:text-base text-muted-foreground font-mono leading-relaxed"
        >
          Explore our hands-on cybersecurity workshops, technical bootcamps, national hackathons, and guest lectures hosted at NMAMIT.
        </motion.p>
      </div>

      {/* Filter & Search Bar */}
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-4 p-5 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md">
          {/* Top Row: Search Input & Status */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="grep 'search events, topics, venues'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background/80 border border-border/70 rounded-lg text-xs font-mono text-foreground focus:outline-none focus:border-[#00d05a] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground self-start sm:self-auto">
              <span>
                Showing <strong className="text-[#00d05a]">{filteredEvents.length}</strong> of {events.length} events
              </span>
              <span>//</span>
              <span>NMAMIT Cyber Node</span>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
            {categories.map((cat) => {
              const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase()
              const count = cat.id === 'all'
                ? events.length
                : events.filter((ev) => ev.category?.toLowerCase() === cat.id.toLowerCase()).length

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#00d05a] text-black font-bold shadow-[0_0_12px_rgba(0,208,90,0.3)]'
                      : 'bg-background/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-black/20 text-black font-bold' : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 w-full">
          {filteredEvents.map((ev, idx) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05, ease }}
              onClick={() => setActiveModalEvent(ev)}
              className="group max-w-sm sm:max-w-none mx-auto w-full rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md overflow-hidden flex flex-col justify-between hover:border-[#00d05a]/60 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:shadow-[#00d05a]/5"
            >
              {/* Image Header - Instagram 4:5 Poster Ratio */}
              <div className="relative aspect-[4/5] w-full bg-background overflow-hidden">
                <Image
                  src={ev.imageUrl || '/images/hero-1.png'}
                  alt={ev.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-background/90 backdrop-blur-md border border-border/80 text-[#00d05a]">
                    {ev.categoryLabel || ev.category}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase backdrop-blur-md border ${
                      ev.status?.toLowerCase() === 'completed'
                        ? 'bg-black/85 text-zinc-400 border-zinc-700/60'
                        : ev.status?.toLowerCase() === 'ongoing'
                        ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/60 shadow-[0_0_10px_rgba(0,208,90,0.3)]'
                        : ev.status?.toLowerCase() === 'postponed'
                        ? 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                        : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50'
                    }`}
                  >
                    {ev.status?.toLowerCase() === 'completed'
                      ? 'COMPLETED'
                      : ev.status?.toLowerCase() === 'ongoing'
                      ? '● LIVE NOW'
                      : ev.status?.toLowerCase() === 'postponed'
                      ? 'POSTPONED'
                      : 'UPCOMING'}
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#00d05a]" />
                    <span>{ev.formattedDate || ev.date || 'TBD'}</span>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-[#00d05a] transition-colors leading-snug mb-1.5 line-clamp-1">
                    {ev.title}
                  </h3>

                  <p className="text-xs font-mono text-muted-foreground leading-relaxed line-clamp-2">
                    {ev.description}
                  </p>
                </div>

                {/* Footer Bar */}
                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-muted-foreground flex items-center gap-1.5 truncate max-w-[150px]">
                    <MapPin className="w-3.5 h-3.5 text-[#00d05a] shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </span>

                  <span className="text-[#00d05a] font-bold inline-flex items-center gap-1 group-hover:underline">
                    <span>View Details</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="w-full py-16 text-center rounded-2xl border border-border bg-card/40 backdrop-blur-sm space-y-3">
          <Filter className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-bold text-foreground">No matching events found</h3>
          <p className="text-xs font-mono text-muted-foreground">
            Try adjusting your search query or switching categories.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all')
              setSearchQuery('')
            }}
            className="mt-2 px-4 py-2 text-xs font-mono bg-[#00d05a] text-black rounded-md font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Interactive Event Detail Modal Rendered into Portal at Root */}
      {mounted && createPortal(
        <AnimatePresence>
          {activeModalEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] w-screen h-screen flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl"
              onClick={() => setActiveModalEvent(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl bg-card border border-border/90 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                {/* Modal Banner Image - Instagram 4:5 Ratio */}
                <div className="relative aspect-[4/5] max-h-[380px] sm:max-h-[420px] w-full bg-black/95 overflow-hidden shrink-0 flex items-center justify-center">
                  <Image
                    src={activeModalEvent.imageUrl || '/images/hero-1.png'}
                    alt=""
                    fill
                    className="object-cover blur-2xl opacity-25 scale-110 -z-0"
                  />
                  <Image
                    src={activeModalEvent.imageUrl || '/images/hero-1.png'}
                    alt={activeModalEvent.title}
                    fill
                    className="object-contain z-10 p-2"
                  />
                  
                  <button
                    onClick={() => setActiveModalEvent(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer z-20 border border-white/20 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6 font-mono text-xs text-foreground/90">
                  {/* Event Title & Category Header */}
                  <div className="space-y-2 border-b border-border/60 pb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#00d05a]/15 text-[#00d05a] border border-[#00d05a]/30 uppercase tracking-wider">
                        {activeModalEvent.categoryLabel || activeModalEvent.category}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider border ${
                          activeModalEvent.status?.toLowerCase() === 'completed'
                            ? 'bg-zinc-900 text-zinc-400 border-zinc-700/60'
                            : activeModalEvent.status?.toLowerCase() === 'ongoing'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(0,208,90,0.2)]'
                            : activeModalEvent.status?.toLowerCase() === 'postponed'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                            : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                        }`}
                      >
                        {activeModalEvent.status?.toLowerCase() === 'completed'
                          ? 'COMPLETED'
                          : activeModalEvent.status?.toLowerCase() === 'ongoing'
                          ? '● LIVE NOW'
                          : activeModalEvent.status?.toLowerCase() === 'postponed'
                          ? 'POSTPONED'
                          : 'UPCOMING'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight tracking-wide">
                      {activeModalEvent.title}
                    </h2>
                  </div>

                  {/* Meta Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg border border-border/70 bg-background/50">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-[#00d05a]" />
                        <span>DATE</span>
                      </div>
                      <div className="font-bold text-foreground">{activeModalEvent.formattedDate || activeModalEvent.date}</div>
                    </div>

                    <div className="p-3 rounded-lg border border-border/70 bg-background/50">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mb-1">
                        <Clock className="w-3.5 h-3.5 text-[#00d05a]" />
                        <span>TIME</span>
                      </div>
                      <div className="font-bold text-foreground">{activeModalEvent.time || 'TBD'}</div>
                    </div>

                    <div className="p-3 rounded-lg border border-border/70 bg-background/50 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-[#00d05a]" />
                        <span>LOCATION</span>
                      </div>
                      <div className="font-bold text-foreground truncate">{activeModalEvent.location}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase tracking-widest text-[#00d05a] font-bold">
                      EVENT BRIEFING
                    </h4>
                    <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                      {activeModalEvent.description}
                    </p>
                  </div>

                  {/* Highlights */}
                  {activeModalEvent.highlights && activeModalEvent.highlights.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase tracking-widest text-[#00d05a] font-bold">
                        KEY HIGHLIGHTS & OUTCOMES
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeModalEvent.highlights.map((h, i) => (
                          <div key={i} className="flex items-center gap-2 p-2.5 rounded-md border border-border/60 bg-background/40">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00d05a] shrink-0" />
                            <span className="text-[11px] text-foreground">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-4 border-t border-border/70 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-muted-foreground">
                      Official Record // NMAMIT Cybersecurity
                    </span>

                    {activeModalEvent.registrationLink && activeModalEvent.registrationLink !== '#' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          window.open(activeModalEvent.registrationLink, '_blank', 'noopener,noreferrer')
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00d05a] hover:bg-[#00d05a]/90 active:scale-95 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#00d05a]/20 cursor-pointer"
                      >
                        <span>REGISTER / VIEW FORM</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
