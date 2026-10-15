'use client'

import React from 'react'
import Image from 'next/image'
import { Shield, Github, Linkedin, Instagram, Globe, ExternalLink, Sparkles } from 'lucide-react'

interface PublicProfilePreviewProps {
  fullName: string
  designationName?: string | null
  department?: string | null
  avatarUrl?: string | null
  bio?: string | null
  branch?: string | null
  year?: string | null
  githubUrl?: string | null
  linkedinUrl?: string | null
  instagramUrl?: string | null
  portfolioUrl?: string | null
}

export function PublicProfilePreview({
  fullName,
  designationName,
  department,
  avatarUrl,
  bio,
  branch,
  year,
  githubUrl,
  linkedinUrl,
  instagramUrl,
  portfolioUrl,
}: PublicProfilePreviewProps) {
  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'PR'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-muted-foreground uppercase flex items-center gap-1.5 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#00d05a]" />
          <span>PUBLIC TEAMS PREVIEW</span>
        </span>
        <span className="text-[10px] text-muted-foreground/60 uppercase">
          // LIVE VISITOR PERSPECTIVE
        </span>
      </div>

      <div className="rounded-2xl border border-[#222222] bg-[#0c0c0c] p-6 flex flex-col items-center text-center justify-between relative overflow-hidden shadow-xl max-w-sm mx-auto">
        {/* Top ambient glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00d05a]/60 to-transparent" />

        {/* Avatar Circle */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#2a2a2a] bg-[#141414] relative flex items-center justify-center shadow-lg">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName || 'Member'}
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono text-xl font-bold bg-[#00d05a]/10 text-[#00d05a]">
                {initials}
              </div>
            )}
          </div>

          {/* Badge */}
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-black border border-[#333] text-[#00d05a]">
            <Shield className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Info */}
        <div className="w-full space-y-2 mb-4">
          <h3 className="font-bold font-mono text-base text-foreground leading-tight">
            {fullName || 'Your Name'}
          </h3>

          <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00d05a]/10 text-[#00d05a] border border-[#00d05a]/20">
            {designationName || 'General Member'}
          </div>

          <p className="text-[11px] font-mono text-muted-foreground truncate">
            {department || `Cybersecurity • ${year || '3rd Year'}`}
          </p>

          {bio && (
            <p className="text-[11px] font-mono text-muted-foreground italic leading-relaxed pt-1 line-clamp-3">
              &ldquo;{bio}&rdquo;
            </p>
          )}
        </div>

        {/* Socials Bar */}
        <div className="w-full pt-4 border-t border-[#1e1e1e] flex items-center justify-center gap-3 text-muted-foreground">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-[#00d05a]/10 hover:text-[#00d05a] transition-colors"
              title="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-[#00d05a]/10 hover:text-[#00d05a] transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          )}
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-[#00d05a]/10 hover:text-[#00d05a] transition-colors"
              title="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          )}
          {portfolioUrl && (
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-[#00d05a]/10 hover:text-[#00d05a] transition-colors"
              title="Portfolio"
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
          {!githubUrl && !linkedinUrl && !instagramUrl && !portfolioUrl && (
            <span className="text-[10px] font-mono text-muted-foreground/40 italic">
              No social links configured
            </span>
          )}
        </div>

        {/* Confidential fields note */}
        <div className="mt-4 pt-3 border-t border-[#161616] w-full text-[9px] font-mono text-muted-foreground/50">
          🛡️ Private fields (USN, Phone, Email) are strictly hidden from public view.
        </div>
      </div>
    </div>
  )
}
