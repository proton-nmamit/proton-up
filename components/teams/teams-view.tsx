'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Shield, 
  Github, 
  Linkedin, 
  Instagram, 
  Globe, 
  Search, 
  Terminal,
  X,
  Sparkles,
} from 'lucide-react'
import { PublicMember } from '@/lib/types/database'
import { MemberDossierModal } from './member-dossier-modal'

const ease = [0.22, 1, 0.36, 1] as const

interface TeamsViewProps {
  members: PublicMember[]
}

interface TeamCategoryTab {
  id: string
  label: string
  count: number
  minOrder: number
}

export function TeamsView({ members }: TeamsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<PublicMember | null>(null)

  // Dynamically derive category filter tabs from approved members
  const dynamicCategories = useMemo(() => {
    const categoryMap = new Map<string, { label: string; minOrder: number; count: number }>()

    for (const m of members) {
      const catId = m.category || 'other'
      const label = m.category_label || (catId.charAt(0).toUpperCase() + catId.slice(1))
      const order = m.display_order ?? 999

      const existing = categoryMap.get(catId)
      if (existing) {
        existing.count += 1
        if (order < existing.minOrder) {
          existing.minOrder = order
        }
      } else {
        categoryMap.set(catId, {
          label,
          minOrder: order,
          count: 1,
        })
      }
    }

    const sortedCats = Array.from(categoryMap.entries())
      .sort((a, b) => a[1].minOrder - b[1].minOrder)
      .map(([id, data]) => ({
        id,
        label: data.label,
        count: data.count,
        minOrder: data.minOrder,
      }))

    return [
      { id: 'all', label: 'All Members', count: members.length, minOrder: 0 },
      ...sortedCats,
    ]
  }, [members])

  // Filter members based on selected category and search query
  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return members.filter((member) => {
      const matchCategory = selectedCategory === 'all' || member.category === selectedCategory
      if (!matchCategory) return false

      if (!q) return true

      const nameMatch = member.full_name.toLowerCase().includes(q)
      const roleMatch = member.role.toLowerCase().includes(q)
      const deptMatch = member.department ? member.department.toLowerCase().includes(q) : false
      const branchMatch = member.branch ? member.branch.toLowerCase().includes(q) : false
      const bioMatch = member.bio ? member.bio.toLowerCase().includes(q) : false

      return nameMatch || roleMatch || deptMatch || branchMatch || bioMatch
    })
  }, [members, selectedCategory, searchQuery])

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-12 lg:px-12 max-w-7xl mx-auto w-full space-y-12">
      {/* Header Hero Section */}
      <div className="text-center space-y-4 max-w-3xl pt-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/70 bg-card/60 text-[11px] font-mono text-[#00d05a] uppercase tracking-widest shadow-[0_0_10px_rgba(0,208,90,0.15)]"
        >
          <Users className="w-3.5 h-3.5" />
          <span>EXECUTIVE ROSTER // {members.length} VERIFIED MEMBERS</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="font-pixel text-4xl sm:text-6xl lg:text-7xl text-foreground tracking-tight select-none uppercase"
        >
          CORE TEAM & LEADS
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
          className="text-xs sm:text-sm md:text-base text-muted-foreground font-mono leading-relaxed"
        >
          Meet the student executives, security researchers, coordinators, and creatives directing PROTON Association at NMAMIT.
        </motion.p>
      </div>

      {/* Filter & Search Bar */}
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-4 p-5 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md">
          {/* Top Row: Search Input & Status */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="grep 'name, role, designation'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-background/80 border border-border/70 rounded-lg text-xs font-mono text-foreground focus:outline-none focus:border-[#00d05a] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground self-start sm:self-auto">
              <span>
                Showing <strong className="text-[#00d05a]">{filteredMembers.length}</strong> of {members.length} members
              </span>
              <span>//</span>
              <span>CSE (Cybersecurity)</span>
            </div>
          </div>

          {/* Dynamic Designation Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
            {dynamicCategories.map((cat) => {
              const isActive = selectedCategory === cat.id

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
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-black/20 text-black font-bold' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Empty State: Directory is empty */}
      {members.length === 0 && (
        <div className="w-full text-center py-20 px-6 border border-border/60 rounded-2xl bg-card/40 backdrop-blur-md space-y-4">
          <Terminal className="w-12 h-12 text-[#00d05a] mx-auto opacity-70" />
          <h2 className="text-lg font-mono font-bold uppercase text-foreground">
            [ TEAM DIRECTORY ]
          </h2>
          <p className="text-xs font-mono text-muted-foreground max-w-md mx-auto leading-relaxed">
            NO APPROVED MEMBERS FOUND IN DIRECTORY. The executive roster is currently undergoing verification by club administrators.
          </p>
        </div>
      )}

      {/* Empty State: Filter/Search returns 0 */}
      {members.length > 0 && filteredMembers.length === 0 && (
        <div className="w-full text-center py-16 px-6 border border-border/60 rounded-2xl bg-card/40 backdrop-blur-md space-y-4">
          <Search className="w-10 h-10 text-muted-foreground/60 mx-auto" />
          <h2 className="text-sm font-mono font-bold uppercase text-foreground">
            NO MATCHING MEMBERS FOUND
          </h2>
          <p className="text-xs font-mono text-muted-foreground max-w-sm mx-auto">
            No approved team members match your query &quot;{searchQuery}&quot; in the current filter category.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
            }}
            className="px-4 py-2 rounded bg-[#161616] hover:bg-[#222] border border-[#333] text-[#00d05a] font-mono text-xs uppercase cursor-pointer"
          >
            Clear Filters & Search
          </button>
        </div>
      )}

      {/* Team Grid */}
      {filteredMembers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          <AnimatePresence mode="popLayout">
            {filteredMembers.map((member, idx) => {
              const initials = member.full_name
                ? member.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'PR'

              const instagramHref = member.instagram_url
                ? member.instagram_url.startsWith('http')
                  ? member.instagram_url
                  : `https://instagram.com/${member.instagram_url.replace('@', '')}`
                : null

              const departmentDisplay = member.department || `Cybersecurity (${member.year || '3rd Year'})`

              return (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: idx * 0.03, ease }}
                  onClick={() => setSelectedMember(member)}
                  className="group rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-6 flex flex-col items-center text-center justify-between hover:border-[#00d05a] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 relative overflow-hidden shadow-md hover:shadow-2xl hover:shadow-[#00d05a]/15 cursor-pointer select-none"
                >
                  {/* Top ambient glow on hover */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00d05a]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Avatar Circle */}
                  <div className="relative mb-5">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border/80 group-hover:border-[#00d05a] transition-colors bg-background relative flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_#00d05a]/30">
                      {member.avatar_url ? (
                        <Image
                          src={member.avatar_url}
                          alt={member.full_name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-pixel text-2xl font-bold bg-[#00d05a]/10 text-[#00d05a]">
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Core Shield badge */}
                    {member.is_core && (
                      <div
                        className="absolute -bottom-1 -right-1 p-1 rounded-full bg-background border border-border/80 text-[#00d05a]"
                        title="Core Committee Member"
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="w-full space-y-2 mb-4">
                    <h3 className="font-bold text-base text-foreground group-hover:text-[#00d05a] transition-colors leading-tight">
                      {member.full_name}
                    </h3>

                    <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00d05a]/10 text-[#00d05a] border border-[#00d05a]/20 group-hover:border-[#00d05a]/50 transition-colors">
                      {member.role}
                    </div>

                    {departmentDisplay && (
                      <p className="text-[11px] font-mono text-muted-foreground truncate">
                        {departmentDisplay}
                      </p>
                    )}

                    {member.bio && (
                      <p className="text-[11px] font-mono text-muted-foreground italic leading-relaxed pt-1 line-clamp-2">
                        &ldquo;{member.bio}&rdquo;
                      </p>
                    )}

                    {/* Dossier click hint */}
                    <div className="text-[10px] font-mono text-[#00d05a] opacity-0 group-hover:opacity-100 transition-opacity pt-1 flex items-center justify-center gap-1">
                      <span>[ INSPECT DOSSIER ]</span>
                      <span>↗</span>
                    </div>
                  </div>

                  {/* Socials Bar */}
                  <div className="w-full pt-4 border-t border-border/50 flex items-center justify-center gap-3 text-muted-foreground">
                    {member.github_url && (
                      <a
                        href={member.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-md hover:bg-[#00d05a]/10 hover:text-[#00d05a] transition-colors cursor-pointer"
                        aria-label="GitHub Profile"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}

                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-md hover:bg-blue-500/10 hover:text-blue-400 transition-colors cursor-pointer"
                        aria-label="LinkedIn Profile"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}

                    {instagramHref && (
                      <a
                        href={instagramHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-md hover:bg-pink-500/10 hover:text-pink-400 transition-colors cursor-pointer"
                        aria-label="Instagram Profile"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}

                    {member.portfolio_url && (
                      <a
                        href={member.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-md hover:bg-[#00d05a]/10 hover:text-[#00d05a] transition-colors cursor-pointer"
                        aria-label="Portfolio Website"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}

                    {!member.github_url && !member.linkedin_url && !instagramHref && !member.portfolio_url && (
                      <span className="text-[10px] font-mono text-muted-foreground/60">
                        PROTON Verified Member
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Holographic Member Dossier Pop-up Modal */}
      <MemberDossierModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  )
}
