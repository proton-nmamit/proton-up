"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  Activity,
  ArrowUpRight,
  ChevronUp,
  Shield,
  Calendar,
  Users,
  Image as ImageIcon,
} from "lucide-react"
import { PROTON_META } from "@/lib/proton-data"

const ease = [0.22, 1, 0.36, 1] as const

const TICKER_ITEMS = [
  "STATUS: CYBERSECURITY NETWORK ACTIVE",
  "NODE: NMAMIT NITTE CAMPUS",
  "DEPT: CSE CYBERSECURITY",
  "ASSOCIATION: PROTON 2024 - PRESENT",
  "PILLARS: INNOVATE // COLLABORATE // EXCEL",
  "ACTIVE MEMBERS: 30+ REGISTERED",
  "EVENTS COMPLETED: 13+ VERIFIED",
  "SECURITY PROTOCOL: ZERO TRUST",
]

export function Footer() {
  const [timeString, setTimeString] = useState<string>("")

  // Live real-time UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const utc = now.toUTCString().split(" ")[4]
      const ms = String(now.getUTCMilliseconds()).padStart(3, "0")
      setTimeString(`${utc}.${ms} UTC`)
    }
    updateTime()
    const interval = setInterval(updateTime, 50)
    return () => clearInterval(interval)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="relative w-full bg-transparent border-t border-border/40 overflow-hidden select-none">
      {/* Top Ambient Glow & Continuous Scanning Laser */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d05a]/50 to-transparent z-20" />
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-0 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-[#00d05a] to-transparent blur-[1px] z-20"
      />

      {/* Glowing Ambient Radial Backdrop */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-t from-[#00d05a]/10 via-[#00d05a]/3 to-transparent blur-3xl pointer-events-none z-0" />

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-8 lg:px-12 flex flex-col gap-12">
        {/* Top Ticker: Continuous Live Telemetry */}
        <div className="relative overflow-hidden py-2.5 px-4 rounded-lg border border-border/60 bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 shrink-0 border-r border-border/60 pr-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d05a] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d05a]" />
              </span>
              <span className="text-[10px] font-mono font-bold text-foreground tracking-widest uppercase">
                CAMPUS NODE
              </span>
            </div>

            {/* Infinite Marquee Ticker */}
            <div className="flex-1 overflow-hidden whitespace-nowrap">
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="inline-flex gap-8 text-[11px] font-mono text-muted-foreground"
              >
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2">
                    <span className="text-[#00d05a] font-bold">&bull;</span>
                    <span>{item}</span>
                  </span>
                ))}
              </motion.div>
            </div>

            <div className="hidden sm:flex items-center gap-2 shrink-0 border-l border-border/60 pl-4 text-[10px] font-mono text-muted-foreground">
              <Activity className="h-3 w-3 text-[#00d05a] animate-pulse" />
              <span className="tabular-nums font-mono">{timeString || "00:00:00.000 UTC"}</span>
            </div>
          </div>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pt-4">
          {/* Column 1: Identity & Quick Action */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded overflow-hidden flex items-center justify-center">
                <Image
                  src="/images/Protton_logo.png"
                  alt="PROTON Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-pixel text-xl font-bold tracking-tight text-foreground block">
                  PROTON
                </span>
                <span className="text-[9px] font-mono text-muted-foreground tracking-widest uppercase">
                  ASSOCIATION NMAMIT
                </span>
              </div>
            </div>
            <p className="text-xs font-mono text-muted-foreground leading-relaxed">
              Official Cybersecurity Association of NMAMIT, fostering ethical hacking, defense research, CTFs, and tech innovation.
            </p>
            <div className="pt-2">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold bg-[#00d05a] hover:bg-[#00d05a]/90 text-black rounded transition-colors duration-200 group shadow-lg shadow-[#00d05a]/20"
              >
                <span>EXPLORE EVENTS</span>
                <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </Link>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-foreground tracking-widest uppercase flex items-center gap-2">
              <span className="text-[#00d05a]">//</span> EXPLORE
            </h4>
            <ul className="space-y-2 text-xs font-mono text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-[#00d05a] transition-colors flex items-center justify-between group">
                  <span className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-[#00d05a]" />
                    <span>About PROTON</span>
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-[#00d05a] transition-colors flex items-center justify-between group">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-blue-400" />
                    <span>Events & Workshops</span>
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/teams" className="hover:text-[#00d05a] transition-colors flex items-center justify-between group">
                  <span className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Core Team & Leads</span>
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-[#00d05a] transition-colors flex items-center justify-between group">
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
                    <span>Photo Gallery</span>
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Campus */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-foreground tracking-widest uppercase flex items-center gap-2">
              <span className="text-[#00d05a]">//</span> CAMPUS NODE
            </h4>
            <div className="space-y-2 text-xs font-mono text-muted-foreground">
              <p className="text-foreground font-semibold">
                Dept. of Computer Science & Engineering (Cybersecurity)
              </p>
              <p>NMAM Institute of Technology</p>
              <p>Nitte, Karkala, Karnataka - 574110</p>
              <div className="pt-2">
                <a
                  href={`mailto:${PROTON_META.contactEmail}`}
                  className="text-[#00d05a] hover:underline block truncate"
                >
                  {PROTON_META.contactEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Column 4: System Telemetry Stamp */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-foreground tracking-widest uppercase flex items-center gap-2">
              <span className="text-[#00d05a]">//</span> ASSOCIATION STATS
            </h4>
            <div className="p-3.5 rounded-lg border border-border/70 bg-card/50 backdrop-blur-sm space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>ESTABLISHED</span>
                <span className="text-[#00d05a] font-bold">{PROTON_META.foundedYear}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>MEMBERS</span>
                <span className="text-foreground font-bold">{PROTON_META.stats.members}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>EVENTS HELD</span>
                <span className="text-[#00d05a] font-bold">{PROTON_META.stats.eventsConducted}</span>
              </div>
              <div className="pt-1 border-t border-border/50 text-[9px] text-muted-foreground/80 truncate">
                TAG: #ThinkDeeper #HackSmarter
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BIG FOOTER NAME: "PROTON" WITH ANIMATED SCANLINE & GRADIENT SHIMMER */}
        {/* ========================================================================= */}
        <div className="relative w-full py-8 sm:py-12 my-2 flex flex-col items-center justify-center overflow-hidden">
          {/* Animated Horizontal Laser Beam */}
          <motion.div
            animate={{
              y: ["-100%", "200%"],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[#00d05a]/15 to-transparent pointer-events-none z-10"
          />

          {/* Giant Pixel Typography */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
            className="font-pixel text-[4.5rem] sm:text-[8.5rem] md:text-[12rem] lg:text-[16rem] xl:text-[20rem] font-bold tracking-tighter text-center leading-none select-none relative z-0 bg-gradient-to-b from-foreground via-foreground/60 to-foreground/5 bg-clip-text text-transparent hover:from-[#00d05a] hover:via-[#00d05a]/70 hover:to-foreground/20 transition-all duration-700 cursor-default"
          >
            PROTON
          </motion.h1>

          {/* Holographic subtitle bar */}
          <div className="relative z-10 -mt-2 sm:-mt-6 flex items-center justify-center gap-4 text-[10px] sm:text-xs font-mono tracking-[0.25em] sm:tracking-[0.4em] text-muted-foreground uppercase">
            <span>[ CYBERSECURITY ]</span>
            <span className="text-[#00d05a]">&bull;</span>
            <span>[ NMAMIT NITTE ]</span>
            <span className="text-[#00d05a]">&bull;</span>
            <span>[ 2024 - PRESENT ]</span>
          </div>
        </div>

        {/* Bottom Bar with Back to Top Button */}
        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>(C) 2026 PROTON ASSOCIATION. NMAMIT NITTE.</span>
            <span className="hidden sm:inline text-border">|</span>
            <span>ALL RIGHTS RESERVED</span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/70 bg-card/60 hover:bg-card hover:border-[#00d05a]/60 text-muted-foreground hover:text-foreground transition-all duration-300 group cursor-pointer shadow-sm"
          >
            <span className="text-[10px] tracking-widest uppercase">BACK TO TOP</span>
            <ChevronUp className="h-3.5 w-3.5 text-[#00d05a] group-hover:-translate-y-0.5 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </footer>
  )
}
