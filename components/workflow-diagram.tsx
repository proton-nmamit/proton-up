"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import Image from "next/image"

interface DomainInfo {
  id: string
  label: string
  tag: string
  code: string
  summary: string
  points: string[]
}

const DOMAIN_DETAILS: Record<string, DomainInfo> = {
  "ethical-hacking": {
    id: "ethical-hacking",
    label: "ETHICAL HACKING",
    tag: "OFFENSIVE OPS",
    code: "SEC-01 // RED-TEAM",
    summary: "Proactive offensive security auditing and adversarial penetration testing.",
    points: [
      "Vulnerability Assessment & Web / API Exploitation Frameworks",
      "Network Penetration Testing & Active Directory Domain Escalation",
      "Bug Bounty Hunting, Exploit Chaining & Red Team Simulations",
    ],
  },
  "offensive-ctf": {
    id: "offensive-ctf",
    label: "OFFENSIVE CTF",
    tag: "WARGAMES",
    code: "SEC-02 // ARENA",
    summary: "Competitive cyber wargames across national and international leaderboards.",
    points: [
      "Jeopardy & Attack-Defense Global CTF Competitions",
      "Binary Exploitation (PWN), Heap Attacks & Reverse Engineering",
      "Advanced Cryptography, Steganography & Deep Memory Forensics",
    ],
  },
  "technical-wing": {
    id: "technical-wing",
    label: "TECHNICAL WING",
    tag: "CORE DEV",
    code: "SEC-03 // DEV-SEC",
    summary: "Engineering custom security tooling, secure architectures, and defense infrastructure.",
    points: [
      "Custom Exploit Tooling, Automation Scripts & C2 Frameworks",
      "Zero-Trust Architecture, OS Hardening & Cloud Security",
      "AI-Driven Threat Hunting & Automated Vulnerability Scanners",
    ],
  },
  "cyber-workshops": {
    id: "cyber-workshops",
    label: "CYBER WORKSHOPS",
    tag: "HANDS-ON",
    code: "SEC-04 // TRAINING",
    summary: "Intensive hands-on labs and practical security masterclasses.",
    points: [
      "Live Linux Terminal Mastery & Wireshark Deep Packet Labs",
      "SOC Triage, SIEM Analytics & Live Incident Response Drills",
      "Hardware Hacking, BadUSB, SDR & IoT Firmware Exploitation",
    ],
  },
  "hackathons": {
    id: "hackathons",
    label: "HACKATHONS",
    tag: "NATIONAL ARENA",
    code: "SEC-05 // COMBAT",
    summary: "High-intensity 24h/36h national level coding and cyber build sprints.",
    points: [
      "National 24h & 36h Hackathons & Hardware Build Showdowns",
      "Critical Infrastructure Defense & Real-World Cyber Challenges",
      "Mentorship from Industry Elites, Cash Prize Pools & VC Visibility",
    ],
  },
  "campus-outreach": {
    id: "campus-outreach",
    label: "CAMPUS OUTREACH",
    tag: "COMMUNITY",
    code: "SEC-06 // DEFENSE",
    summary: "Fostering institutional cyber hygiene and peer-to-peer security knowledge sharing.",
    points: [
      "Campus Cyber Hygiene Drills & Real-Time Phishing Awareness",
      "Student Security Research, CVE Discoveries & Whitepaper Publications",
      "Collaborative Peer Mentorship & Open-Source Security Community",
    ],
  },
}

const LEFT_LABELS = [
  { id: "ethical-hacking", label: "ETHICAL HACKING", tag: "OFFENSIVE" },
  { id: "offensive-ctf", label: "OFFENSIVE CTF", tag: "WARGAMES" },
  { id: "technical-wing", label: "TECHNICAL WING", tag: "CORE DEV" },
]

const RIGHT_LABELS = [
  { id: "cyber-workshops", label: "CYBER WORKSHOPS", tag: "HANDS-ON" },
  { id: "hackathons", label: "HACKATHONS", tag: "NATIONAL" },
  { id: "campus-outreach", label: "CAMPUS OUTREACH", tag: "COMMUNITY" },
]

export function WorkflowDiagram({ onOpenTerminal }: { onOpenTerminal?: () => void } = {}) {
  const [mounted, setMounted] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [isLaunching, setIsLaunching] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogoClick = () => {
    setIsLaunching(true)
    setTimeout(() => {
      onOpenTerminal?.()
      setIsLaunching(false)
    }, 150)
  }

  if (!mounted) {
    return <div className="h-[220px] w-full" />
  }

  const centerX = 400
  const centerY = 105

  return (
    <div className="relative w-full max-w-[880px] mx-auto select-none">
      {/* Mobile Animated Cyber Neural Circuit (< 640px) */}
      <div className="block sm:hidden w-full max-w-[390px] mx-auto px-1 py-2">
        <svg
          viewBox="0 0 380 270"
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label="PROTON Mobile Cyber Circuit"
        >
          <defs>
            <filter id="gentle-glow-mobile" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Left Circuit Tracks (Mobile) */}
          {LEFT_LABELS.map((item, i) => {
            const pillX = 8
            const pillY = 22 + i * 100
            const startX = 152
            const startY = 135
            const endX = pillX + 98
            const endY = pillY + 13
            const midX = 136
            const isHovered = hoveredNode === item.id

            const pathIn = `M ${endX} ${endY} L ${midX} ${endY} L ${midX} ${startY} L ${startX} ${startY}`
            const pathOut = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`
            const delay = 0.3 + i * 0.7

            return (
              <g key={`mob-left-${item.id}`}>
                {/* Standard Angular Circuit Group (Smoothly fades out on hover) */}
                <motion.g
                  animate={{ opacity: isHovered ? 0 : 1 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  {/* Base Line */}
                  <path
                    d={pathOut}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth={isHovered ? 1.8 : 1.2}
                    strokeOpacity={isHovered ? 0.85 : 0.46}
                    strokeLinejoin="round"
                  />
                  {/* Animated Pulse Dash */}
                  <path
                    d={pathIn}
                    fill="none"
                    stroke="#00d05a"
                    strokeWidth={isHovered ? 1.6 : 1.2}
                    strokeDasharray="16 120"
                    strokeOpacity={isHovered ? 0.8 : 0.4}
                    strokeLinejoin="round"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="300;0"
                      dur={isHovered ? "3s" : "4.2s"}
                      repeatCount="indefinite"
                    />
                  </path>
                  {/* Solder Nodes */}
                  <circle cx={midX} cy={endY} r={2} fill={isHovered ? "#00d05a" : "hsl(var(--border))"} opacity={0.65} />
                  <circle cx={midX} cy={startY} r={2} fill={isHovered ? "#00d05a" : "hsl(var(--border))"} opacity={0.65} />
                  {/* Moving Data Packet */}
                  <circle r={2.2} fill="#00d05a" opacity={0.85} filter="url(#gentle-glow-mobile)">
                    <animateMotion
                      path={pathIn}
                      dur="4.2s"
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                      keyPoints="0;0.38;0.62;1"
                      keyTimes="0;0.35;0.65;1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.9;0.9;0"
                      keyTimes="0;0.1;0.9;1"
                      dur="4.2s"
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </motion.g>

                {/* Silky Smooth Dynamic Curvy Laser Beam on Mobile */}
                <AnimatePresence>
                  {isHovered && (
                    <g key={`mob-left-hover-beam-${item.id}`}>
                      <motion.path
                        d={`M ${endX} ${endY} C ${(endX + midX) / 2} ${endY}, ${(startX + midX) / 2} ${startY}, ${startX} ${startY}`}
                        fill="none"
                        stroke="#00d05a"
                        strokeWidth={3.6}
                        strokeOpacity={0.3}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.25, ease: "easeInOut" } }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        filter="url(#gentle-glow-mobile)"
                      />
                      <motion.path
                        d={`M ${endX} ${endY} C ${(endX + midX) / 2} ${endY}, ${(startX + midX) / 2} ${startY}, ${startX} ${startY}`}
                        fill="none"
                        stroke="#00d05a"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.22, ease: "easeInOut" } }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </g>
                  )}
                </AnimatePresence>
              </g>
            )
          })}

          {/* Right Circuit Tracks (Mobile) */}
          {RIGHT_LABELS.map((item, i) => {
            const pillX = 274
            const pillY = 22 + i * 100
            const startX = 228
            const startY = 135
            const endX = pillX
            const endY = pillY + 13
            const midX = 244
            const isHovered = hoveredNode === item.id

            const pathOut = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`
            const delay = 0.4 + i * 0.7

            return (
              <g key={`mob-right-${item.id}`}>
                {/* Standard Angular Circuit Group (Smoothly fades out on hover) */}
                <motion.g
                  animate={{ opacity: isHovered ? 0 : 1 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  {/* Base Line */}
                  <path
                    d={pathOut}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth={isHovered ? 1.8 : 1.2}
                    strokeOpacity={isHovered ? 0.85 : 0.46}
                    strokeLinejoin="round"
                  />
                  {/* Animated Pulse Dash */}
                  <path
                    d={pathOut}
                    fill="none"
                    stroke="#00d05a"
                    strokeWidth={isHovered ? 1.6 : 1.2}
                    strokeDasharray="16 120"
                    strokeOpacity={isHovered ? 0.8 : 0.4}
                    strokeLinejoin="round"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="300;0"
                      dur={isHovered ? "3s" : "4.2s"}
                      repeatCount="indefinite"
                    />
                  </path>
                  {/* Solder Nodes */}
                  <circle cx={midX} cy={startY} r={2} fill={isHovered ? "#00d05a" : "hsl(var(--border))"} opacity={0.65} />
                  <circle cx={midX} cy={endY} r={2} fill={isHovered ? "#00d05a" : "hsl(var(--border))"} opacity={0.65} />
                  {/* Moving Data Packet */}
                  <circle r={2.2} fill="#00d05a" opacity={0.85} filter="url(#gentle-glow-mobile)">
                    <animateMotion
                      path={pathOut}
                      dur="4.2s"
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                      keyPoints="0;0.38;0.62;1"
                      keyTimes="0;0.35;0.65;1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.9;0.9;0"
                      keyTimes="0;0.1;0.9;1"
                      dur="4.2s"
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </motion.g>

                {/* Silky Smooth Dynamic Curvy Laser Beam on Mobile */}
                <AnimatePresence>
                  {isHovered && (
                    <g key={`mob-right-hover-beam-${item.id}`}>
                      <motion.path
                        d={`M ${startX} ${startY} C ${(startX + midX) / 2} ${startY}, ${(endX + midX) / 2} ${endY}, ${endX} ${endY}`}
                        fill="none"
                        stroke="#00d05a"
                        strokeWidth={3.6}
                        strokeOpacity={0.3}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.25, ease: "easeInOut" } }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        filter="url(#gentle-glow-mobile)"
                      />
                      <motion.path
                        d={`M ${startX} ${startY} C ${(startX + midX) / 2} ${startY}, ${(endX + midX) / 2} ${endY}, ${endX} ${endY}`}
                        fill="none"
                        stroke="#00d05a"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.22, ease: "easeInOut" } }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </g>
                  )}
                </AnimatePresence>
              </g>
            )
          })}

          {/* Left Domain Badges (Mobile) */}
          {LEFT_LABELS.map((item, i) => {
            const pillX = 8
            const pillY = 22 + i * 100
            const isHovered = hoveredNode === item.id

            return (
              <g
                key={`mob-pill-left-${item.id}`}
                onClick={() => setHoveredNode(isHovered ? null : item.id)}
                className="cursor-pointer"
              >
                <rect
                  x={pillX}
                  y={pillY}
                  width={98}
                  height={26}
                  rx={13}
                  fill="hsl(var(--card))"
                  stroke={isHovered ? "#00d05a" : "hsl(var(--border))"}
                  strokeWidth={isHovered ? 1.4 : 1}
                />
                <circle cx={pillX + 10} cy={pillY + 13} r={2} fill="#00d05a" opacity={0.85} />
                <text
                  x={pillX + 53}
                  y={pillY + 16.5}
                  textAnchor="middle"
                  fill={isHovered ? "#00d05a" : "hsl(var(--foreground))"}
                  fontSize={7}
                  fontFamily="var(--font-mono), monospace"
                  fontWeight={700}
                  letterSpacing="0.03em"
                >
                  {item.label}
                </text>
              </g>
            )
          })}

          {/* Right Domain Badges (Mobile) */}
          {RIGHT_LABELS.map((item, i) => {
            const pillX = 274
            const pillY = 22 + i * 100
            const isHovered = hoveredNode === item.id

            return (
              <g
                key={`mob-pill-right-${item.id}`}
                onClick={() => setHoveredNode(isHovered ? null : item.id)}
                className="cursor-pointer"
              >
                <rect
                  x={pillX}
                  y={pillY}
                  width={98}
                  height={26}
                  rx={13}
                  fill="hsl(var(--card))"
                  stroke={isHovered ? "#00d05a" : "hsl(var(--border))"}
                  strokeWidth={isHovered ? 1.4 : 1}
                />
                <text
                  x={pillX + 45}
                  y={pillY + 16.5}
                  textAnchor="middle"
                  fill={isHovered ? "#00d05a" : "hsl(var(--foreground))"}
                  fontSize={7}
                  fontFamily="var(--font-mono), monospace"
                  fontWeight={700}
                  letterSpacing="0.03em"
                >
                  {item.label}
                </text>
                <circle cx={pillX + 88} cy={pillY + 13} r={2} fill="#00d05a" opacity={0.85} />
              </g>
            )
          })}

          {/* Center PROTON Core & Radial Pulse (Mobile) */}
          <circle cx={190} cy={135} r={38} fill="none" stroke="#00d05a" strokeWidth={0.8} opacity={0.12}>
            <animate attributeName="r" values="34;56" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0" dur="4s" repeatCount="indefinite" />
          </circle>

          {/* Mobile Clickable Center Logo */}
          <motion.g
            role="button"
            tabIndex={0}
            onClick={handleLogoClick}
            className="cursor-pointer outline-none"
            whileTap={{ scale: 0.92 }}
          >
            {isLaunching && (
              <motion.circle
                cx={190}
                cy={135}
                initial={{ r: 25, opacity: 0.9 }}
                animate={{ r: 90, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                fill="none"
                stroke="#00d05a"
                strokeWidth={2.5}
              />
            )}
            <image
              href="/images/Protton_logo.png"
              x={152}
              y={97}
              width={76}
              height={76}
              preserveAspectRatio="xMidYMid meet"
              className="drop-shadow-[0_0_14px_rgba(0,208,90,0.45)] active:drop-shadow-[0_0_24px_rgba(0,208,90,0.8)] transition-all"
            />
          </motion.g>
        </svg>

        {/* Mobile Action Prompt */}
        <div className="flex justify-center mt-1">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 border border-[#00d05a]/40 text-[9.5px] font-mono font-bold text-[#00d05a] tracking-widest uppercase active:scale-95 transition-all shadow-[0_0_10px_rgba(0,208,90,0.15)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d05a] animate-pulse" />
            <span>TAP LOGO TO LAUNCH TERMINAL</span>
          </button>
        </div>
      </div>

      {/* Desktop / Tablet Full SVG Circuit Board (>= 640px) */}
      <svg
        viewBox="0 0 800 210"
        className="hidden sm:block w-full h-auto overflow-visible"
        role="img"
        aria-label="PROTON Association Cyber Neural Circuit"
      >
        <defs>
          {/* Gentle Soft Glow Filter */}
          <filter id="gentle-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- LEFT CIRCUIT PATHS --- */}
        {LEFT_LABELS.map((item, i) => {
          const pillX = 35
          const pillY = 25 + i * 65
          const startX = centerX - 62
          const startY = centerY
          const endX = pillX + 140
          const endY = pillY + 15
          const midX = (startX + endX) / 2
          const isHovered = hoveredNode === item.id

          // Path: from pill to center
          const pathIn = `M ${endX} ${endY} L ${midX} ${endY} L ${midX} ${startY} L ${startX} ${startY}`
          // Path: from center to pill
          const pathOut = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`

          const delay = 0.4 + i * 0.8

          return (
            <g key={`left-group-${item.id}`}>
              {/* Standard Angular Circuit Group (Smoothly fades out on hover) */}
              <motion.g
                animate={{ opacity: isHovered ? 0 : 1 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                {/* Layer 1: Clean Base Circuit Track (+8% calibrated) */}
                <path
                  d={pathOut}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth={isHovered ? 1.9 : 1.3}
                  strokeOpacity={isHovered ? 0.85 : 0.46}
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />

                {/* Layer 2: Subtle Digital Pulse Dash Track */}
                <path
                  d={pathIn}
                  fill="none"
                  stroke="#00d05a"
                  strokeWidth={isHovered ? 1.7 : 1.3}
                  strokeDasharray="20 180"
                  strokeOpacity={isHovered ? 0.65 : 0.32}
                  strokeLinejoin="round"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="400;0"
                    dur={isHovered ? "3.2s" : "4.8s"}
                    repeatCount="indefinite"
                  />
                </path>

                {/* Layer 3: Subtle Solder Node Junctions at Elbow Corner */}
                <circle
                  cx={midX}
                  cy={endY}
                  r={2.2}
                  fill={isHovered ? "#00d05a" : "hsl(var(--border))"}
                  opacity={0.65}
                  className="transition-colors duration-300"
                />
                <circle
                  cx={midX}
                  cy={startY}
                  r={2.2}
                  fill={isHovered ? "#00d05a" : "hsl(var(--border))"}
                  opacity={0.65}
                  className="transition-colors duration-300"
                />

                {/* Layer 4: Calm, Smooth Moving Data Dot */}
                <g>
                  <circle r={2.5} fill="#00d05a" opacity={isHovered ? 0.9 : 0.75} filter="url(#gentle-glow)">
                    <animateMotion
                      path={pathIn}
                      dur={isHovered ? "3.2s" : "4.8s"}
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                      keyPoints="0;0.38;0.62;1"
                      keyTimes="0;0.35;0.65;1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.85;0.85;0"
                      keyTimes="0;0.1;0.9;1"
                      dur={isHovered ? "3.2s" : "4.8s"}
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Soft Halo Aura */}
                  <circle r={5} fill="#00d05a" opacity={0.18}>
                    <animateMotion
                      path={pathIn}
                      dur={isHovered ? "3.2s" : "4.8s"}
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                      keyPoints="0;0.38;0.62;1"
                      keyTimes="0;0.35;0.65;1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.22;0.22;0"
                      keyTimes="0;0.1;0.9;1"
                      dur={isHovered ? "3.2s" : "4.8s"}
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              </motion.g>

              {/* Silky Smooth Dynamic Curvy Laser Beam on Desktop (Left to Center) */}
              <AnimatePresence>
                {isHovered && (
                  <g key={`left-hover-beam-${item.id}`}>
                    <motion.path
                      d={`M ${endX} ${endY} C ${(endX + midX) / 2} ${endY}, ${(startX + midX) / 2} ${startY}, ${startX} ${startY}`}
                      fill="none"
                      stroke="#00d05a"
                      strokeWidth={4.5}
                      strokeOpacity={0.3}
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.28, ease: "easeInOut" } }}
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                      filter="url(#gentle-glow)"
                    />
                    <motion.path
                      d={`M ${endX} ${endY} C ${(endX + midX) / 2} ${endY}, ${(startX + midX) / 2} ${startY}, ${startX} ${startY}`}
                      fill="none"
                      stroke="#00d05a"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.25, ease: "easeInOut" } }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </g>
                )}
              </AnimatePresence>
            </g>
          )
        })}

        {/* --- RIGHT CIRCUIT PATHS --- */}
        {RIGHT_LABELS.map((item, i) => {
          const pillX = 625
          const pillY = 25 + i * 65
          const startX = centerX + 62
          const startY = centerY
          const endX = pillX
          const endY = pillY + 15
          const midX = (startX + endX) / 2
          const isHovered = hoveredNode === item.id

          // Path: from center outward to pill
          const pathOut = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`

          const delay = 0.5 + i * 0.8

          return (
            <g key={`right-group-${item.id}`}>
              {/* Standard Angular Circuit Group (Smoothly fades out on hover) */}
              <motion.g
                animate={{ opacity: isHovered ? 0 : 1 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                {/* Layer 1: Clean Base Circuit Track (+8% calibrated) */}
                <path
                  d={pathOut}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth={isHovered ? 1.9 : 1.3}
                  strokeOpacity={isHovered ? 0.85 : 0.46}
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />

                {/* Layer 2: Subtle Digital Pulse Dash Track */}
                <path
                  d={pathOut}
                  fill="none"
                  stroke="#00d05a"
                  strokeWidth={isHovered ? 1.7 : 1.3}
                  strokeDasharray="20 180"
                  strokeOpacity={isHovered ? 0.65 : 0.32}
                  strokeLinejoin="round"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="400;0"
                    dur={isHovered ? "3.2s" : "4.8s"}
                    repeatCount="indefinite"
                  />
                </path>

                {/* Layer 3: Subtle Solder Node Junctions at Elbow Corner */}
                <circle
                  cx={midX}
                  cy={startY}
                  r={2.2}
                  fill={isHovered ? "#00d05a" : "hsl(var(--border))"}
                  opacity={0.65}
                  className="transition-colors duration-300"
                />
                <circle
                  cx={midX}
                  cy={endY}
                  r={2.2}
                  fill={isHovered ? "#00d05a" : "hsl(var(--border))"}
                  opacity={0.65}
                  className="transition-colors duration-300"
                />

                {/* Layer 4: Calm, Smooth Moving Data Dot */}
                <g>
                  <circle r={2.5} fill="#00d05a" opacity={isHovered ? 0.9 : 0.75} filter="url(#gentle-glow)">
                    <animateMotion
                      path={pathOut}
                      dur={isHovered ? "3.2s" : "4.8s"}
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                      keyPoints="0;0.38;0.62;1"
                      keyTimes="0;0.35;0.65;1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.85;0.85;0"
                      keyTimes="0;0.1;0.9;1"
                      dur={isHovered ? "3.2s" : "4.8s"}
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Soft Halo Aura */}
                  <circle r={5} fill="#00d05a" opacity={0.18}>
                    <animateMotion
                      path={pathOut}
                      dur={isHovered ? "3.2s" : "4.8s"}
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                      keyPoints="0;0.38;0.62;1"
                      keyTimes="0;0.35;0.65;1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.22;0.22;0"
                      keyTimes="0;0.1;0.9;1"
                      dur={isHovered ? "3.2s" : "4.8s"}
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              </motion.g>

              {/* Silky Smooth Dynamic Curvy Laser Beam on Desktop (Center to Right) */}
              <AnimatePresence>
                {isHovered && (
                  <g key={`right-hover-beam-${item.id}`}>
                    <motion.path
                      d={`M ${startX} ${startY} C ${(startX + midX) / 2} ${startY}, ${(endX + midX) / 2} ${endY}, ${endX} ${endY}`}
                      fill="none"
                      stroke="#00d05a"
                      strokeWidth={4.5}
                      strokeOpacity={0.3}
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.28, ease: "easeInOut" } }}
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                      filter="url(#gentle-glow)"
                    />
                    <motion.path
                      d={`M ${startX} ${startY} C ${(startX + midX) / 2} ${startY}, ${(endX + midX) / 2} ${endY}, ${endX} ${endY}`}
                      fill="none"
                      stroke="#00d05a"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.25, ease: "easeInOut" } }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </g>
                )}
              </AnimatePresence>
            </g>
          )
        })}

        {/* --- LEFT PILL LABELS --- */}
        {LEFT_LABELS.map((item, i) => {
          const pillX = 35
          const pillY = 25 + i * 65
          const isHovered = hoveredNode === item.id

          return (
            <motion.g
              key={`left-pill-${item.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              onMouseEnter={() => setHoveredNode(item.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => setHoveredNode(hoveredNode === item.id ? null : item.id)}
              className="cursor-pointer group select-none"
            >
              {/* Outer Card Background */}
              <rect
                x={pillX}
                y={pillY}
                width={140}
                height={30}
                rx={15}
                fill={isHovered ? "rgba(0, 208, 90, 0.08)" : "hsl(var(--card))"}
                stroke={isHovered ? "#00d05a" : "hsl(var(--border))"}
                strokeWidth={isHovered ? 1.6 : 1.2}
                className="transition-all duration-300 shadow-md"
              />

              {/* Status LED Indicator */}
              <circle
                cx={pillX + 14}
                cy={pillY + 15}
                r={2.5}
                fill="#00d05a"
                opacity={isHovered ? 1 : 0.75}
              />
              {isHovered && (
                <circle
                  cx={pillX + 14}
                  cy={pillY + 15}
                  r={5}
                  fill="none"
                  stroke="#00d05a"
                  strokeWidth={0.8}
                  opacity={0.6}
                >
                  <animate attributeName="r" values="3;7;3" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Label Text */}
              <text
                x={pillX + 74}
                y={pillY + 19}
                textAnchor="middle"
                fill={isHovered ? "#00d05a" : "hsl(var(--foreground))"}
                fontSize={8.5}
                fontFamily="var(--font-mono), monospace"
                fontWeight={600}
                letterSpacing="0.05em"
                className="transition-colors duration-200"
              >
                {item.label}
              </text>
            </motion.g>
          )
        })}

        {/* --- RIGHT PILL LABELS --- */}
        {RIGHT_LABELS.map((item, i) => {
          const pillX = 625
          const pillY = 25 + i * 65
          const isHovered = hoveredNode === item.id

          return (
            <motion.g
              key={`right-pill-${item.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              onMouseEnter={() => setHoveredNode(item.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => setHoveredNode(hoveredNode === item.id ? null : item.id)}
              className="cursor-pointer group select-none"
            >
              {/* Outer Card Background */}
              <rect
                x={pillX}
                y={pillY}
                width={140}
                height={30}
                rx={15}
                fill={isHovered ? "rgba(0, 208, 90, 0.08)" : "hsl(var(--card))"}
                stroke={isHovered ? "#00d05a" : "hsl(var(--border))"}
                strokeWidth={isHovered ? 1.6 : 1.2}
                className="transition-all duration-300 shadow-md"
              />

              {/* Label Text */}
              <text
                x={pillX + 66}
                y={pillY + 19}
                textAnchor="middle"
                fill={isHovered ? "#00d05a" : "hsl(var(--foreground))"}
                fontSize={8.5}
                fontFamily="var(--font-mono), monospace"
                fontWeight={600}
                letterSpacing="0.05em"
                className="transition-colors duration-200"
              >
                {item.label}
              </text>

              {/* Status LED Indicator */}
              <circle
                cx={pillX + 126}
                cy={pillY + 15}
                r={2.5}
                fill="#00d05a"
                opacity={isHovered ? 1 : 0.75}
              />
              {isHovered && (
                <circle
                  cx={pillX + 126}
                  cy={pillY + 15}
                  r={5}
                  fill="none"
                  stroke="#00d05a"
                  strokeWidth={0.8}
                  opacity={0.6}
                >
                  <animate attributeName="r" values="3;7;3" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
            </motion.g>
          )
        })}

        {/* --- CENTER PROTON CORE --- */}
        {/* Subtle Ambient Radial Pulse */}
        <circle
          cx={centerX}
          cy={centerY}
          r={62}
          fill="none"
          stroke="#00d05a"
          strokeWidth={0.8}
          opacity={0.12}
        >
          <animate
            attributeName="r"
            values="54;82"
            dur="4.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.2;0"
            dur="4.5s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Center Clickable Logo */}
        <motion.g
          role="button"
          tabIndex={0}
          onClick={handleLogoClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              handleLogoClick()
            }
          }}
          className="cursor-pointer group outline-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: isLaunching ? 1.25 : 1,
          }}
          transition={{ duration: 0.25 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
        >
          <title>Click to Launch PROTON Terminal (Shortcut: `)</title>

          {/* Launch Shockwave Pulse */}
          {isLaunching && (
            <motion.circle
              cx={centerX}
              cy={centerY}
              initial={{ r: 40, opacity: 0.9 }}
              animate={{ r: 140, opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              fill="none"
              stroke="#00d05a"
              strokeWidth={3}
            />
          )}

          {/* Enlarged Embedded Official Logo Image with Soft Cyber Drop Shadow */}
          <image
            href="/images/Protton_logo.png"
            x={centerX - 59}
            y={centerY - 59}
            width={118}
            height={118}
            preserveAspectRatio="xMidYMid meet"
            className="drop-shadow-[0_0_18px_rgba(0, 208, 90,0.35)] group-hover:drop-shadow-[0_0_28px_rgba(0, 208, 90,0.65)] transition-all duration-300"
          />
        </motion.g>
      </svg>

      {/* Desktop Terminal Launch Instruction Callout */}
      <div className="hidden sm:flex items-center justify-center gap-2 mt-3 mb-1 text-xs font-mono select-none">
        <button
          type="button"
          onClick={handleLogoClick}
          className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#00d05a]/30 hover:border-[#00d05a]/60 bg-black/70 hover:bg-black/90 backdrop-blur-md shadow-[0_0_15px_rgba(0,208,90,0.1)] transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[#00d05a] animate-pulse shadow-[0_0_8px_#00d05a]" />
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            Click the <strong className="text-[#00d05a] font-bold">PROTON logo</strong> to launch terminal
          </span>
          <span className="text-neutral-600">|</span>
          <span className="text-muted-foreground flex items-center gap-1.5">
            or press <kbd className="px-1.5 py-0.5 text-[11px] font-bold text-[#00d05a] bg-black border border-[#00d05a]/50 rounded shadow-[0_0_6px_rgba(0,208,90,0.3)]">`</kbd> anywhere
          </span>
        </button>
      </div>

      {/* --- SIDE-ANCHORED ANIMATIC CYBER HUD INSPECTOR (LEFT / RIGHT) --- */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {hoveredNode && DOMAIN_DETAILS[hoveredNode] && (() => {
            const isLeft = LEFT_LABELS.some((l) => l.id === hoveredNode)
            const details = DOMAIN_DETAILS[hoveredNode]

            return (
              <motion.div
                key={`hud-height-wrapper-${hoveredNode}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: "auto",
                  opacity: 1,
                  transitionEnd: { overflow: "visible" },
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                  overflow: "hidden",
                  transition: {
                    height: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.22, ease: "easeInOut" },
                  },
                }}
                transition={{
                  height: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.35, ease: "easeOut" },
                }}
                style={{ overflow: "hidden" }}
                className="w-full"
              >
                <div className={`w-full flex ${isLeft ? "justify-start" : "justify-end"} pt-7 pb-5 px-3 sm:px-4`}>
                  <motion.div
                  initial={{
                    opacity: 0,
                    x: isLeft ? -28 : 28,
                    y: 12,
                    scale: 0.92,
                    filter: "blur(6px)",
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    y: 0,
                    scale: 1,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    x: isLeft ? -18 : 18,
                    y: 8,
                    scale: 0.94,
                    filter: "blur(4px)",
                    transition: { duration: 0.24, ease: "easeInOut" },
                  }}
                  transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-full sm:max-w-[430px] relative"
                >
                  {/* Soft Multi-Stage Ambient Backlit Glow that fades away gradually into darkness */}
                  <div
                    aria-hidden="true"
                    className="absolute -inset-5 sm:-inset-8 rounded-[28px] pointer-events-none -z-10"
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 15%, rgba(0, 208, 90, 0.22) 0%, rgba(0, 208, 90, 0.08) 38%, rgba(0, 208, 90, 0.02) 65%, transparent 80%)",
                      filter: "blur(22px)",
                    }}
                  />
                  <div
                    aria-hidden="true"
                    className="absolute -top-7 inset-x-8 h-14 rounded-full pointer-events-none -z-10"
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 60%, rgba(0, 208, 90, 0.20) 0%, rgba(0, 208, 90, 0.05) 50%, transparent 80%)",
                      filter: "blur(16px)",
                    }}
                  />

                  {/* Card Surface */}
                  <div className="w-full relative p-4 sm:p-5 rounded-2xl border border-[#00d05a]/50 bg-black/95 backdrop-blur-xl shadow-[0_0_22px_rgba(0,208,90,0.16)] overflow-hidden">
                    {/* Laser Scanline Top Accent */}
                    <motion.div
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      exit={{ scaleX: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-[#00d05a] to-transparent origin-center z-10 pointer-events-none"
                    />

                  {/* Holographic Header Bar */}
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
                    className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#00d05a]/25"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00d05a] shadow-[0_0_10px_#00d05a] animate-pulse" />
                      <span className="font-mono text-xs sm:text-sm font-bold text-[#00d05a] tracking-wider">
                        {details.label}
                      </span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#00d05a]/15 text-[#00d05a] border border-[#00d05a]/35 font-semibold">
                        {details.tag}
                      </span>
                    </div>
                    <span className="text-[9.5px] font-mono text-neutral-400 tracking-wider">
                      {details.code}
                    </span>
                  </motion.div>

                  {/* Subsystem Summary */}
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.35, delay: 0.18, ease: "easeOut" }}
                    className="text-[12px] text-neutral-300 mb-3 font-mono leading-relaxed"
                  >
                    {details.summary}
                  </motion.p>

                  {/* Animated Curvy Line Branching Bullet Points */}
                  <div className="space-y-2.5">
                    {details.points.map((point, idx) => {
                      const lineDelay = 0.22 + idx * 0.12
                      const textDelay = lineDelay + 0.2

                      return (
                        <div key={`point-${idx}`} className="flex items-start gap-2.5 group">
                          {/* Curvy Animated Circuit Branch Line */}
                          <div className="relative shrink-0 w-6 h-5 flex items-center justify-center pt-0.5">
                            <svg
                              viewBox="0 0 24 20"
                              className="w-6 h-5 overflow-visible"
                              fill="none"
                            >
                              {/* Curvy Bezier Path (Drawing in, then retracting out) */}
                              <motion.path
                                d="M 2 3 C 8 3, 10 14, 18 14 L 22 14"
                                stroke="#00d05a"
                                strokeWidth={1.4}
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.95 }}
                                exit={{
                                  pathLength: 0,
                                  opacity: 0,
                                  transition: { duration: 0.18, ease: "easeInOut" },
                                }}
                                transition={{
                                  duration: 0.45,
                                  delay: lineDelay,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                              />
                              {/* Terminal Glow Node at Curvy Line Endpoint */}
                              <motion.circle
                                cx={22}
                                cy={14}
                                r={2}
                                fill="#00d05a"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{
                                  scale: 0,
                                  opacity: 0,
                                  transition: { duration: 0.12 },
                                }}
                                transition={{
                                  duration: 0.22,
                                  delay: textDelay - 0.05,
                                  ease: "backOut",
                                }}
                              />
                            </svg>
                          </div>

                          {/* Staggered Bullet Text */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{
                              opacity: 0,
                              x: -8,
                              transition: { duration: 0.14 },
                            }}
                            transition={{
                              duration: 0.35,
                              delay: textDelay,
                              ease: "easeOut",
                            }}
                            className="text-[11.5px] sm:text-[12px] font-mono text-neutral-200 tracking-wide leading-tight pt-0.5"
                          >
                            <span className="text-[#00d05a] font-bold mr-1.5">{`>`}</span>
                            {point}
                          </motion.div>
                        </div>
                      )
                    })}
                  </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            )
          })()}
        </AnimatePresence>
      </div>
    </div>
  )
}
