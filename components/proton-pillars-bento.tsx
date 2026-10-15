"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  Terminal,
  Users,
  Flame,
  Award,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { PROTON_META } from "@/lib/proton-data"

// --- Minimal Cyber Spotlight Card Wrapper ---
interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

function CyberSpotlightCard({
  children,
  className = "",
  glowColor = "rgba(0, 208, 90, 0.1)",
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setMousePos({ x: -1000, y: -1000 })
      }}
      className={`relative rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-[#00d05a]/40 ${className}`}
      style={{
        boxShadow: isHovered
          ? "0 0 30px rgba(0, 208, 90, 0.08), inset 0 0 15px rgba(0, 208, 90, 0.02)"
          : "none",
      }}
    >
      {/* Subtle Dynamic Cursor Spotlight in Phosphor Green */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(380px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 80%)`,
        }}
      />

      <div className="relative z-10 h-full flex flex-col justify-between">{children}</div>
    </div>
  )
}

// Minimal Toolchain Data
const TOOLS = [
  {
    id: "ghidra",
    name: "Ghidra",
    sub: "Reverse Eng",
    target: "target_payload.bin",
    status: "Decompiled",
    code: ["0x00401122  mov eax, [rbp-0x4]", "0x0040112c  call bypass_auth() → MITIGATED"],
  },
  {
    id: "burp",
    name: "Burp Suite",
    sub: "Web Recon",
    target: "portal.nitte.edu",
    status: "0 Vulns",
    code: ["POST /api/v2/auth HTTP/2", "Status: 403 Forbidden (WAF Active)"],
  },
  {
    id: "metasploit",
    name: "Metasploit",
    sub: "Red Team",
    target: "192.168.10.45",
    status: "Hardened",
    code: ["[*] Sending exploit payload...", "[+] Target hardened. Access Denied."],
  },
  {
    id: "wireshark",
    name: "Wireshark",
    sub: "Packets",
    target: "eth0 (Live)",
    status: "TLS 1.3",
    code: ["01  10.0.4.12 → TLSv1.3 Encrypted", "02  10.0.4.1  → TCP 443 [ACK]"],
  },
]

// Minimal Hackathon Data
const HACKATHONS = [
  { id: "fish", name: "Fish Tank 3.0", tag: "3h Event", type: "National Hackathon" },
  { id: "ctrl", name: "Ctrl + Alt + Code", tag: "Algorithms", type: "Speed Sprint" },
  { id: "conq", name: "Game of Conquest", tag: "Non Tech Event", type: "Non-Tech Event" },
]

export function ProtonPillarsBento() {
  const [activeTool, setActiveTool] = useState(TOOLS[0])
  const [activeHack, setActiveHack] = useState(HACKATHONS[0])
  const [isShielding, setIsShielding] = useState(false)
  const [shieldCount, setShieldCount] = useState(1200)

  const handleShieldClick = () => {
    if (isShielding) return
    setIsShielding(true)
    setShieldCount((c) => c + 1)
    setTimeout(() => setIsShielding(false), 900)
  }

  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto select-none">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-14">
        <h2 className="font-pixel text-3xl sm:text-5xl lg:text-6xl tracking-tight text-foreground mb-3">
          CORE DOMAINS
        </h2>

        <p className="text-xs sm:text-sm font-mono text-muted-foreground max-w-xl leading-relaxed">
          Hands-on red teaming, national hackathons, faculty-guided research, and student defense outreach.
        </p>
      </div>

      {/* Bento Grid (Uniform White & Green Theme) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* ========================================================= */}
        {/* CARD 1: Offensive & Defensive Lab (2 Columns)             */}
        {/* ========================================================= */}
        <CyberSpotlightCard className="md:col-span-2">
          <div>
            {/* Title & Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border border-[#00d05a]/30 bg-[#00d05a]/10 text-[#00d05a]">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    Offensive & Defensive Security
                  </h3>
                  <span className="text-xs font-mono text-muted-foreground">
                    Hands-on vulnerability analysis and binary reverse engineering.
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Tool Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {TOOLS.map((t) => {
                const isSelected = activeTool.id === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTool(t)}
                    className={`px-3 py-2 rounded-lg border text-xs font-mono transition-all text-left flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "border-[#00d05a] bg-[#00d05a]/15 text-white font-bold"
                        : "border-white/[0.08] bg-black/30 text-muted-foreground hover:text-foreground hover:border-white/20"
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className="text-[9px] text-muted-foreground/70 font-normal">{t.sub}</span>
                  </button>
                )
              })}
            </div>

            {/* Minimal Terminal Preview */}
            <div className="rounded-xl border border-white/[0.08] bg-black/60 p-3.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pb-2 mb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-white/20" />
                    <span className="w-2 h-2 rounded-full bg-white/20" />
                    <span className="w-2 h-2 rounded-full bg-white/20" />
                  </div>
                  <span className="text-white/60">{activeTool.target}</span>
                </div>
                <span className="text-[#00d05a] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {activeTool.status}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTool.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-1 text-[11px]"
                >
                  {activeTool.code.map((line, i) => (
                    <div key={i} className="text-white/80">
                      <span className="text-[#00d05a] mr-2">&gt;</span>
                      {line}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground text-[11px]">NMAMIT Cyber Defense Lab</span>
            <Link
              href="/events"
              className="inline-flex items-center gap-1 text-[#00d05a] hover:underline font-bold"
            >
              <span>Explore Workshops</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CyberSpotlightCard>

        {/* ========================================================= */}
        {/* CARD 2: Community & Cadets (1 Column)                     */}
        {/* ========================================================= */}
        <CyberSpotlightCard>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg border border-[#00d05a]/30 bg-[#00d05a]/10 text-[#00d05a]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Community & Reach</h3>
                <span className="text-xs font-mono text-muted-foreground">
                  Active cadet cybersecurity society.
                </span>
              </div>
            </div>

            {/* 3 Clean Stat Blocks */}
            <div className="space-y-2.5 my-2">
              <div className="p-3 rounded-lg border border-white/[0.08] bg-black/30 flex items-center justify-between font-mono">
                <span className="text-xs text-muted-foreground">Community Touchpoints</span>
                <span className="text-base font-bold text-foreground">{PROTON_META.stats.members}</span>
              </div>
              <div className="p-3 rounded-lg border border-white/[0.08] bg-black/30 flex items-center justify-between font-mono">
                <span className="text-xs text-muted-foreground">Events Conducted</span>
                <span className="text-base font-bold text-[#00d05a]">{PROTON_META.stats.eventsConducted}</span>
              </div>
              <div className="p-3 rounded-lg border border-white/[0.08] bg-black/30 flex items-center justify-between font-mono">
                <span className="text-xs text-muted-foreground">Core Officers</span>
                <span className="text-base font-bold text-[#00d05a]">30+</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground text-[11px]">Campus & Regional</span>
            <Link
              href="/teams"
              className="inline-flex items-center gap-1 text-[#00d05a] hover:underline font-bold"
            >
              <span>Meet Team</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CyberSpotlightCard>

        {/* ========================================================= */}
        {/* CARD 3: Hackathons & Sprints (1 Column)                   */}
        {/* ========================================================= */}
        <CyberSpotlightCard>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg border border-[#00d05a]/30 bg-[#00d05a]/10 text-[#00d05a]">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Hackathons & CTFs</h3>
                <span className="text-xs font-mono text-muted-foreground">
                  Competitive coding and CTF arenas.
                </span>
              </div>
            </div>

            {/* Event Switcher */}
            <div className="space-y-2 mb-3">
              {HACKATHONS.map((h) => {
                const isSelected = activeHack.id === h.id
                return (
                  <button
                    key={h.id}
                    onClick={() => setActiveHack(h)}
                    className={`w-full p-2.5 rounded-lg border text-xs font-mono transition-all flex items-center justify-between cursor-pointer gap-2 ${
                      isSelected
                        ? "border-[#00d05a] bg-[#00d05a]/15 text-white font-bold"
                        : "border-white/[0.08] bg-black/30 text-muted-foreground hover:text-foreground hover:border-white/20"
                    }`}
                  >
                    <span className="truncate">{h.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#00d05a]/15 text-[#00d05a] font-normal shrink-0 whitespace-nowrap">
                      {h.tag}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
            <span className="text-[#00d05a] text-[11px] font-bold">{activeHack.type}</span>
            <Link
              href="/events"
              className="inline-flex items-center gap-1 text-[#00d05a] hover:underline font-bold"
            >
              <span>View Sprints</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CyberSpotlightCard>

        {/* ========================================================= */}
        {/* CARD 4: Research & Publications (1 Column)                */}
        {/* ========================================================= */}
        <CyberSpotlightCard>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg border border-[#00d05a]/30 bg-[#00d05a]/10 text-[#00d05a]">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Research & Papers</h3>
                <span className="text-xs font-mono text-muted-foreground">
                  Faculty-guided research & publications.
                </span>
              </div>
            </div>

            {/* Mentor & Indexed Badges */}
            <div className="space-y-2.5 my-2">
              <div className="p-3 rounded-lg border border-[#00d05a]/25 bg-[#00d05a]/10 font-mono">
                <span className="text-[9px] text-[#00d05a] font-bold uppercase block">
                  CHIEF ADVISOR
                </span>
                <span className="text-xs font-bold text-white block mt-0.5">
                  Dr. Roshan Fernandes
                </span>
                <span className="text-[10px] text-muted-foreground">
                  HOD, Cybersecurity & CSE
                </span>
              </div>

              <div className="p-3 rounded-lg border border-white/[0.08] bg-black/30 flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">Indexed Venues</span>
                <span className="font-bold text-[#00d05a]">IEEE & Scopus Q1</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground text-[11px]">Academic Mentorship</span>
            <Link
              href="/about"
              className="inline-flex items-center gap-1 text-[#00d05a] hover:underline font-bold"
            >
              <span>Learn More</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CyberSpotlightCard>

        {/* ========================================================= */}
        {/* CARD 5: Social Impact & Outreach (1 Column)               */}
        {/* ========================================================= */}
        <CyberSpotlightCard>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg border border-[#00d05a]/30 bg-[#00d05a]/10 text-[#00d05a]">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Outreach & Defense</h3>
                <span className="text-xs font-mono text-muted-foreground">
                  High school digital hygiene & scam awareness.
                </span>
              </div>
            </div>

            {/* Clean Shield Counter & Interactive Action */}
            <div className="p-4 rounded-xl border border-[#00d05a]/20 bg-black/30 text-center font-mono my-2 relative overflow-hidden">
              <AnimatePresence>
                {isShielding && (
                  <motion.div
                    initial={{ scale: 0.7, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 rounded-full border border-[#00d05a] pointer-events-none"
                  />
                )}
              </AnimatePresence>

              <div className="text-2xl font-bold text-foreground font-mono">
                {shieldCount.toLocaleString()}+
              </div>
              <div className="text-[10px] text-[#00d05a] font-bold uppercase tracking-wider mt-0.5">
                STUDENTS EMPOWERED
              </div>

              <button
                onClick={handleShieldClick}
                className="mt-3 px-3 py-1 rounded-full border border-[#00d05a]/30 bg-[#00d05a]/10 hover:bg-[#00d05a]/20 text-[#00d05a] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
              >
                {isShielding ? "DEFLECTING..." : "SIMULATE DEFENSE"}
              </button>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground text-[11px]">Regional Schools</span>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1 text-[#00d05a] hover:underline font-bold"
            >
              <span>View Gallery</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CyberSpotlightCard>
      </div>
    </section>
  )
}
