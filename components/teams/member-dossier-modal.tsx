'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Shield, 
  Github, 
  Linkedin, 
  Instagram, 
  Globe, 
  Terminal, 
  CheckCircle2, 
  Cpu, 
  Hash, 
  Calendar, 
  ExternalLink,
  Radar
} from 'lucide-react'
import { PublicMember } from '@/lib/types/database'

interface MemberDossierModalProps {
  member: PublicMember | null
  onClose: () => void
}

export function MemberDossierModal({ member, onClose }: MemberDossierModalProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const initials = member?.full_name
    ? member.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'PR'

  const instagramHref = member?.instagram_url
    ? member.instagram_url.startsWith('http')
      ? member.instagram_url
      : `https://instagram.com/${member.instagram_url.replace('@', '')}`
    : null

  const departmentDisplay =
    member?.department ||
    `Cybersecurity (${member?.year || '3rd Year'})`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setMousePos({ x, y })
  }

  return (
    <AnimatePresence>
      {member && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop with cyber blur & vignette */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl z-0"
        >
          {/* Subtle animated matrix grid in background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d05a_1px,transparent_1px),linear-gradient(to_bottom,#00d05a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5 pointer-events-none" />
        </motion.div>

        {/* Modal Card with 3D Holographic Perspective */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75, y: 30, rotateX: 15 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            rotateX: mousePos.y * -10,
            rotateY: mousePos.x * 10,
          }}
          exit={{ opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.2 } }}
          transition={{
            type: 'spring',
            damping: 24,
            stiffness: 280,
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
          style={{ perspective: 1200 }}
          className="relative z-10 w-full max-w-lg bg-[#070707] border-2 border-[#00d05a]/80 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,208,90,0.3)] text-foreground flex flex-col"
        >
          {/* Holographic Laser Scanline Animation */}
          <motion.div
            initial={{ translateY: '-100%' }}
            animate={{ translateY: ['-100%', '400%'] }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-[#00d05a]/15 to-transparent pointer-events-none z-20"
          />

          {/* Holographic Glare Overlay tracking mouse */}
          <div
            style={{
              background: `radial-gradient(circle at ${50 + mousePos.x * 80}% ${50 + mousePos.y * 80}%, rgba(0, 208, 90, 0.15), transparent 60%)`,
            }}
            className="absolute inset-0 pointer-events-none z-10 transition-opacity"
          />

          {/* Futuristic Corner HUD Brackets */}
          <div className="absolute top-2 left-2 text-[#00d05a] font-mono text-xs select-none pointer-events-none z-30">
            ┌─ [NODE]
          </div>
          <div className="absolute top-2 right-2 text-[#00d05a] font-mono text-xs select-none pointer-events-none z-30">
            [SYS] ─┐
          </div>
          <div className="absolute bottom-2 left-2 text-[#00d05a] font-mono text-xs select-none pointer-events-none z-30">
            └─ [ID: {member.id.slice(0, 6).toUpperCase()}]
          </div>
          <div className="absolute bottom-2 right-2 text-[#00d05a] font-mono text-xs select-none pointer-events-none z-30">
            [CLEARANCE: L4] ─┘
          </div>

          {/* Modal Header */}
          <div className="px-6 pt-6 pb-4 border-b border-[#1a1a1a] flex items-center justify-between relative z-30">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00d05a] animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-widest text-[#00d05a] uppercase">
                OPERATIVE DOSSIER // VERIFIED AGENT
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="group p-2 rounded-xl bg-[#141414] hover:bg-rose-950/40 border border-[#262626] hover:border-rose-500/50 text-muted-foreground hover:text-rose-400 transition-all cursor-pointer shadow-md"
              title="Close (Esc)"
            >
              <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-6 relative z-30">
            {/* Avatar & Holographic Target Reticle */}
            <div className="flex flex-col items-center justify-center relative">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Rotating Cyber Reticle */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-[#00d05a]/40"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-2 rounded-full border border-dotted border-[#00d05a]/20"
                />

                {/* Avatar Photo Frame */}
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#00d05a] bg-black relative flex items-center justify-center shadow-[0_0_30px_#00d05a]/30">
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.full_name}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <span className="font-mono text-3xl font-bold text-[#00d05a]">
                      {initials}
                    </span>
                  )}
                </div>

                {/* Core Badge */}
                {member.is_core && (
                  <div
                    className="absolute bottom-1 right-1 p-2 rounded-full bg-black border-2 border-[#00d05a] text-[#00d05a] shadow-lg shadow-[#00d05a]/30"
                    title="Core Member"
                  >
                    <Shield className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Name & Designation */}
              <div className="text-center mt-5 space-y-1.5">
                <h2 className="text-2xl font-mono font-bold text-foreground tracking-tight flex items-center justify-center gap-2">
                  <span>{member.full_name}</span>
                  <CheckCircle2 className="w-5 h-5 text-[#00d05a] shrink-0" />
                </h2>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#00d05a]/15 text-[#00d05a] border border-[#00d05a]/40 shadow-[0_0_12px_#00d05a]/15">
                  <Terminal className="w-3 h-3" />
                  <span>{member.role}</span>
                </div>

                <p className="text-xs font-mono text-muted-foreground pt-1">
                  {departmentDisplay}
                </p>
              </div>
            </div>

            {/* Quote / Bio Terminal Callout */}
            {member.bio && (
              <div className="p-4 rounded-xl bg-[#0e0e0e] border border-[#1f1f1f] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#00d05a]" />
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#00d05a]/80 mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3 h-3" />
                  <span>OPERATIVE INTEL &amp; MOTTO</span>
                </div>
                <p className="text-xs font-mono italic text-foreground/90 leading-relaxed">
                  &ldquo;{member.bio}&rdquo;
                </p>
              </div>
            )}

            {/* Spec Attributes Bento */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#0c0c0c] border border-[#1a1a1a]">
                <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1.5 mb-1">
                  <Radar className="w-3 h-3 text-[#00d05a]" />
                  <span>DIVISION</span>
                </div>
                <div className="font-bold text-foreground truncate">
                  {member.category_label || 'Technical Wing'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0c0c] border border-[#1a1a1a]">
                <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3 h-3 text-[#00d05a]" />
                  <span>TENURE</span>
                </div>
                <div className="font-bold text-foreground">
                  {member.joining_year ? `Active since ${member.joining_year}` : 'Active Member'}
                </div>
              </div>
            </div>

            {/* Interactive Social Protocols */}
            <div className="pt-2 border-t border-[#1a1a1a]">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 mb-3 text-center">
                // EXTERNAL COMMS &amp; HANDLES
              </div>
              <div className="flex items-center justify-center gap-3">
                {member.github_url && (
                  <a
                    href={member.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#121212] hover:bg-[#00d05a] hover:text-black border border-[#222] text-foreground transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_0_15px_#00d05a]/30"
                    title="GitHub"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {member.linkedin_url && (
                  <a
                    href={member.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#121212] hover:bg-[#00d05a] hover:text-black border border-[#222] text-foreground transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_0_15px_#00d05a]/30"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {instagramHref && (
                  <a
                    href={instagramHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#121212] hover:bg-[#00d05a] hover:text-black border border-[#222] text-foreground transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_0_15px_#00d05a]/30"
                    title="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {member.portfolio_url && (
                  <a
                    href={member.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#121212] hover:bg-[#00d05a] hover:text-black border border-[#222] text-foreground transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_0_15px_#00d05a]/30"
                    title="Portfolio / Website"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Footer Status Bar */}
          <div className="px-6 py-3 bg-[#050505] border-t border-[#1a1a1a] flex items-center justify-between text-[10px] font-mono text-muted-foreground relative z-30">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d05a]" />
              <span>TERMINAL NODE SECURED</span>
            </span>
            <button
              onClick={onClose}
              className="text-[#00d05a] hover:underline uppercase cursor-pointer"
            >
              [ CLOSE DOSSIER ]
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  )
}
