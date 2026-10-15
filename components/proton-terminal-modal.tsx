"use client"

import { useState, useEffect, useRef, ReactNode } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Terminal as TerminalIcon,
  Shield,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Cpu,
  Wifi,
  Activity,
  Layers,
  Calendar,
  Users,
  Info,
  Image as ImageIcon,
  Lock,
  Radio
} from "lucide-react"
import { useRouter } from "next/navigation"
import { PROTON_META, type ProtonEvent, type GalleryItem } from "@/lib/proton-data"
import { getCliDataAction, type CliData } from "@/app/actions/cli"
import { PublicMember } from "@/lib/types/database"

interface HistoryEntry {
  command: string
  timestamp: string
  output: ReactNode
  isError?: boolean
}

const PROTON_ASCII = `
  _____  _____   ____ _______ ____  _   _ 
 |  __ \\|  __ \\ / __ \\__   __/ __ \\| \\ | |
 | |__) | |__) | |  | | | | | |  | |  \\| |
 |  ___/|  _  /| |  | | | | | |  | | . \` |
 | |    | | \\ \\| |__| | | | | |__| | |\\  |
 |_|    |_|  \\_\\\\____/  |_|  \\____/|_| \\_|`

const BOOT_LOGS = [
  { text: "INIT: Booting PROTON-OS Kernel v3.0 (x86_64-cyb)...", status: "OK" },
  { text: "CRYPTO: Initializing AES-256-GCM hardware cipher engine...", status: "OK" },
  { text: "NETWORK: Uplink established to NMAMIT Node (13.1830°N, 74.9339°E)...", status: "12ms" },
  { text: "SECURITY: Loading offensive CTF wargame heuristics & SOC filters...", status: "ARMED" },
  { text: "SHELL: Spawning zsh interactive terminal for operative session...", status: "READY" }
]

function MatrixRainBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    const chars = "01PROTONCYBERNMAMIT010101<>[]{}/*+=~"
    const fontSize = 14
    let columns = Math.floor(window.innerWidth / fontSize)
    let drops = Array(columns).fill(1)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      columns = Math.floor(window.innerWidth / fontSize)
      drops = Array(columns).fill(1)
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    let lastDraw = 0
    const fps = 24
    const interval = 1000 / fps

    const render = (now: number) => {
      animationId = requestAnimationFrame(render)
      if (now - lastDraw < interval) return
      lastDraw = now

      ctx.fillStyle = "rgba(0, 0, 0, 0.12)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#00d05a"
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        const x = i * fontSize
        const y = drops[i] * fontSize

        ctx.fillStyle = drops[i] * fontSize > canvas.height * 0.7 ? "rgba(0, 208, 90, 0.4)" : "rgba(0, 208, 90, 0.75)"
        ctx.fillText(text, x, y)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    animationId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-25" />
}

// Module-level singleton cache & pre-fetch promise for instant, synchronized backend data
let globalCliCache: CliData | null = null
let inFlightCliPromise: Promise<CliData> | null = null

export async function fetchLiveCliData(force = false): Promise<CliData> {
  if (globalCliCache && !force) {
    return globalCliCache
  }
  if (inFlightCliPromise && !force) {
    return inFlightCliPromise
  }
  inFlightCliPromise = getCliDataAction()
    .then((data) => {
      globalCliCache = data
      inFlightCliPromise = null
      return data
    })
    .catch((err) => {
      inFlightCliPromise = null
      console.error("[CLI Data Error] Failed to load data from backend:", err)
      return { members: [], events: [], gallery: [] }
    })
  return inFlightCliPromise
}

export function ProtonTerminalModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Eager pre-fetch immediately on client load so data is instantly available
    fetchLiveCliData()
  }, [])

  const [inputVal, setInputVal] = useState("")
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"zsh" | "logs" | "sys">("zsh")
  const [isBooting, setIsBooting] = useState(true)
  const [bootStep, setBootStep] = useState(0)
  const [isMaximized, setIsMaximized] = useState(false)
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Re-fetch in background whenever the terminal modal opens to guarantee fresh data
  useEffect(() => {
    if (!isOpen) return
    fetchLiveCliData(true)
  }, [isOpen])

  // Cyber boot animation on open
  useEffect(() => {
    if (isOpen) {
      setIsBooting(true)
      setBootStep(0)
      const t1 = setTimeout(() => setBootStep(1), 100)
      const t2 = setTimeout(() => setBootStep(2), 220)
      const t3 = setTimeout(() => setBootStep(3), 340)
      const t4 = setTimeout(() => setBootStep(4), 460)
      const t5 = setTimeout(() => {
        setIsBooting(false)
        setTimeout(() => inputRef.current?.focus(), 60)
      }, 620)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        clearTimeout(t4)
        clearTimeout(t5)
      }
    }
  }, [isOpen])

  const skipBoot = () => {
    setIsBooting(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Scroll lock when terminal modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Initial welcome message
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    if (isOpen && history.length === 0) {
      const now = new Date().toLocaleTimeString("en-US", { hour12: false })
      setHistory([
        {
          command: "fastfetch --proton-node",
          timestamp: now,
          output: (
            <div className="space-y-4">
              <pre
                className="text-[#00d05a] text-[11px] sm:text-xs leading-[1.15] select-none overflow-x-auto terminal-scroll py-1 font-bold"
                style={{ fontFamily: "var(--font-mono), monospace", fontVariantLigatures: "none" }}
              >
                {PROTON_ASCII}
              </pre>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-black/40 border border-[#00d05a]/20 rounded-lg text-xs font-mono">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[#00d05a] font-bold">OS:</span>
                    <span className="text-foreground">PROTON-OS v3.0 (x86_64)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#00d05a] font-bold">Host:</span>
                    <span className="text-foreground">NMAMIT Cybersecurity Node</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#00d05a] font-bold">Kernel:</span>
                    <span className="text-foreground">6.8.0-nmamit-cyb-sec</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#00d05a] font-bold">Uptime:</span>
                    <span className="text-foreground">2024 - Present (Active)</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[#00d05a] font-bold">Shell:</span>
                    <span className="text-foreground">zsh 5.9 (cyber-theme)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#00d05a] font-bold">Security:</span>
                    <span className="text-[#00d05a] font-semibold">ENCRYPTED [AES-256-GCM]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#00d05a] font-bold">Pillars:</span>
                    <span className="text-foreground">Offensive CTF &bull; SOC &bull; AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#00d05a] font-bold">Status:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      SYSTEM ONLINE
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-muted-foreground text-xs font-mono flex items-center gap-2">
                <span className="text-[#00d05a]">&gt;</span>
                <span>Type <span className="text-[#00d05a] font-bold underline">help</span> to list commands or click any quick command below.</span>
              </div>
            </div>
          ),
        },
      ])
    }
  }, [isOpen])

  // Auto-scroll to bottom on update
  useEffect(() => {
    if (isOpen && !isBooting) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [history, isOpen, isBooting])

  // Close on Escape key & focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const executeCommand = async (cmdStr: string) => {
    const trimmed = cmdStr.trim()
    if (!trimmed) return

    const now = new Date().toLocaleTimeString("en-US", { hour12: false })
    const lower = trimmed.toLowerCase()
    let response: ReactNode = null
    let isError = false

    setCommandHistory((prev) => [...prev, trimmed])
    setHistoryIndex(-1)

    if (lower === "help" || lower === "man") {
      response = (
        <div className="space-y-3 font-mono text-xs">
          <div className="text-[#00d05a] font-bold border-b border-[#00d05a]/20 pb-1">
            PROTON CLI COMMAND MANUAL [v3.0]
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
            <div className="p-2 bg-black/30 rounded border border-border/60">
              <span className="text-[#00d05a] font-bold">events</span>
              <p className="text-[11px] text-foreground/80 mt-0.5">List conducted & upcoming hackathons & CTFs</p>
            </div>
            <div className="p-2 bg-black/30 rounded border border-border/60">
              <span className="text-[#00d05a] font-bold">teams</span>
              <p className="text-[11px] text-foreground/80 mt-0.5">View executive leads, faculty & tech wings</p>
            </div>
            <div className="p-2 bg-black/30 rounded border border-border/60">
              <span className="text-[#00d05a] font-bold">about</span>
              <p className="text-[11px] text-foreground/80 mt-0.5">Mission, core pillars & NMAMIT node info</p>
            </div>
            <div className="p-2 bg-black/30 rounded border border-border/60">
              <span className="text-[#00d05a] font-bold">gallery</span>
              <p className="text-[11px] text-foreground/80 mt-0.5">Browse event moments & workshop archives</p>
            </div>
            <div className="p-2 bg-black/30 rounded border border-border/60">
              <span className="text-[#00d05a] font-bold">cd &lt;page&gt;</span>
              <p className="text-[11px] text-foreground/80 mt-0.5">Navigate to page (e.g. cd events, cd teams)</p>
            </div>
            <div className="p-2 bg-black/30 rounded border border-border/60">
              <span className="text-[#00d05a] font-bold">stats</span>
              <p className="text-[11px] text-foreground/80 mt-0.5">Live member & project telemetry</p>
            </div>
            <div className="p-2 bg-black/30 rounded border border-border/60">
              <span className="text-[#00d05a] font-bold">neofetch / sys</span>
              <p className="text-[11px] text-foreground/80 mt-0.5">Display system specs & system banner</p>
            </div>
            <div className="p-2 bg-black/30 rounded border border-border/60">
              <span className="text-[#00d05a] font-bold">clear / exit</span>
              <p className="text-[11px] text-foreground/80 mt-0.5">Reset terminal buffer or close window</p>
            </div>
          </div>
        </div>
      )
    } else if (lower === "clear" || lower === "cls") {
      setHistory([])
      setInputVal("")
      return
    } else if (lower === "exit" || lower === "quit" || lower === "close") {
      onClose()
      return
    } else if (lower === "events" || lower === "ls events" || lower === "cat events") {
      const activeData = await fetchLiveCliData()
      const effectiveEvents = activeData.events || []
      response = (
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#00d05a]/20 pb-1">
            <span className="text-[#00d05a] font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              PROTON EVENTS & HACKATHONS ({effectiveEvents.length})
            </span>
            <button
              onClick={() => {
                onClose()
                router.push("/events")
              }}
              className="text-[10px] text-[#00d05a] hover:underline hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Open Full Page</span>
              <span>&rarr;</span>
            </button>
          </div>
          {effectiveEvents.length === 0 ? (
            <div className="p-3 bg-black/40 rounded border border-border/60 text-neutral-400">
              No published events registered in the backend database yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto terminal-scroll pr-1">
              {effectiveEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 bg-black/40 rounded border border-border/60 flex items-start justify-between gap-3 hover:border-[#00d05a]/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground font-semibold flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{ev.title}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00d05a]/10 text-[#00d05a] border border-[#00d05a]/20 uppercase">
                        {ev.categoryLabel || ev.category}
                      </span>
                      {ev.registrationOpen && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase animate-pulse">
                          LIVE REGISTRATION
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{ev.description}</p>
                    {ev.location && (
                      <div className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                        <span className="text-[#00d05a]">LOCATION:</span>
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-[#00d05a] font-mono font-bold">{ev.formattedDate || ev.date}</div>
                    {ev.time && <div className="text-[9px] text-muted-foreground">{ev.time}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
            <span>Live event registry synchronized from backend.</span>
            <span className="text-zinc-500">Type &apos;cd events&apos; to navigate</span>
          </div>
        </div>
      )
    } else if (lower === "teams" || lower === "ls teams" || lower === "cat teams") {
      const activeData = await fetchLiveCliData()
      const effectiveMembers = (activeData.members || []).map((m) => ({
        id: m.id,
        name: m.full_name,
        role: m.role,
        department: m.department || m.branch || "Computer Science (Cybersecurity)",
        category: m.category_label || m.category || "Executive",
        isCore: m.is_core,
      }))

      response = (
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#00d05a]/20 pb-1">
            <span className="text-[#00d05a] font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              EXECUTIVE BOARD & WINGS ({effectiveMembers.length} Members)
            </span>
            <button
              onClick={() => {
                onClose()
                router.push("/teams")
              }}
              className="text-[10px] text-[#00d05a] hover:underline hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Open Teams</span>
              <span>&rarr;</span>
            </button>
          </div>
          {effectiveMembers.length === 0 ? (
            <div className="p-3 bg-black/40 rounded border border-border/60 text-neutral-400">
              No approved team members registered in the backend registry yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto terminal-scroll pr-1">
              {effectiveMembers.map((m) => (
                <div key={m.id} className="p-2.5 bg-black/40 rounded border border-border/60 hover:border-[#00d05a]/40 transition-colors">
                  <div className="flex items-start justify-between gap-1">
                    <div className="text-foreground font-bold text-[12px]">{m.name}</div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00d05a]/10 text-[#00d05a] border border-[#00d05a]/20 uppercase shrink-0">
                      {m.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#00d05a] font-semibold">{m.role}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">{m.department}</div>
                </div>
              ))}
            </div>
          )}
          <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
            <span>Live membership registry synchronized from backend.</span>
            <span className="text-zinc-500">Type &apos;cd teams&apos; to navigate</span>
          </div>
        </div>
      )
    } else if (lower === "about" || lower === "cat about") {
      response = (
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#00d05a]/20 pb-1">
            <span className="text-[#00d05a] font-bold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              ABOUT PROTON ASSOCIATION // NMAMIT
            </span>
            <button
              onClick={() => {
                onClose()
                router.push("/about")
              }}
              className="text-[10px] text-[#00d05a] hover:underline hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Open About Page</span>
              <span>&rarr;</span>
            </button>
          </div>
          <div className="p-3 bg-black/40 rounded border border-border/60 space-y-2 text-foreground/90">
            <p className="leading-relaxed">
              <strong>PROTON</strong> is the premier Cybersecurity & Technical Association of <strong>NMAM Institute of Technology, Nitte</strong>.
            </p>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Founded in 2024, we host regional and national CTFs, defensive digital forensics labs, threat intelligence workshops, and hackathons.
            </p>
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
            <span>NMAMIT Node Status: Active & Operational.</span>
            <span className="text-zinc-500">Type &apos;cd about&apos; to navigate</span>
          </div>
        </div>
      )
    } else if (lower === "gallery" || lower === "ls gallery" || lower === "cat gallery") {
      const activeData = await fetchLiveCliData()
      const effectiveGallery = activeData.gallery || []

      response = (
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#00d05a]/20 pb-1">
            <span className="text-[#00d05a] font-bold flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              GALLERY VAULT ({effectiveGallery.length} Media Artifacts)
            </span>
            <button
              onClick={() => {
                onClose()
                router.push("/gallery")
              }}
              className="text-[10px] text-[#00d05a] hover:underline hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Open Full Vault</span>
              <span>&rarr;</span>
            </button>
          </div>
          {effectiveGallery.length === 0 ? (
            <div className="p-3 bg-black/40 rounded border border-border/60 text-neutral-400">
              No media published in the backend gallery archive yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto terminal-scroll pr-1">
              {effectiveGallery.map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-black/40 rounded border border-border/60 hover:border-[#00d05a]/40 transition-colors flex gap-2.5 items-center"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-12 h-12 rounded object-cover border border-[#00d05a]/20 shrink-0 bg-black/60"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-black/60 border border-border/60 flex items-center justify-center shrink-0 text-muted-foreground">
                      <ImageIcon className="w-5 h-5 text-[#00d05a]/60" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground font-bold truncate text-[11px]">{item.title}</div>
                    <div className="text-[10px] text-[#00d05a] truncate font-mono">{item.eventName || item.category}</div>
                    <div className="text-[9px] text-muted-foreground">{item.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
            <span>Visual media artifacts synchronized from backend.</span>
            <span className="text-zinc-500">Type &apos;cd gallery&apos; to navigate</span>
          </div>
        </div>
      )
    } else if (lower.startsWith("cd ")) {
      const dest = lower.replace("cd ", "").trim()
      if (dest === "events" || dest === "teams" || dest === "about" || dest === "gallery") {
        response = (
          <div className="text-[#00d05a] font-mono text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d05a] animate-ping" />
            <span>DISPATCHING NODE: Routing to /{dest}...</span>
          </div>
        )
        onClose()
        router.push(`/${dest}`)
      } else if (dest === ".." || dest === "/" || dest === "~" || dest === "home") {
        response = (
          <div className="text-[#00d05a] font-mono text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d05a] animate-ping" />
            <span>DISPATCHING NODE: Returning to root /...</span>
          </div>
        )
        onClose()
        router.push("/")
      } else {
        isError = true
        response = (
          <div className="text-rose-400 font-mono text-xs">
            cd: no such directory: {dest} (available: events, teams, about, gallery, ..)
          </div>
        )
      }
    } else if (lower === "stats" || lower === "telemetry") {
      response = (
        <div className="space-y-3 font-mono text-xs">
          <div className="text-[#00d05a] font-bold border-b border-[#00d05a]/20 pb-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            ASSOCIATION TELEMETRY
          </div>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-muted-foreground text-[11px] mb-1">
                <span>Active Operatives / Members</span>
                <span className="text-[#00d05a] font-bold">{PROTON_META.stats.members} (100%)</span>
              </div>
              <div className="w-full bg-black/60 h-2 rounded overflow-hidden border border-border/60">
                <div className="bg-[#00d05a] h-full w-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-muted-foreground text-[11px] mb-1">
                <span>Total National Events & CTFs</span>
                <span className="text-[#00d05a] font-bold">{PROTON_META.stats.eventsConducted} Events</span>
              </div>
              <div className="w-full bg-black/60 h-2 rounded overflow-hidden border border-border/60">
                <div className="bg-[#00d05a] h-full w-[85%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-muted-foreground text-[11px] mb-1">
                <span>Technical Projects & CTF Writeups</span>
                <span className="text-[#00d05a] font-bold">{PROTON_META.stats.projectsCompleted} Repos</span>
              </div>
              <div className="w-full bg-black/60 h-2 rounded overflow-hidden border border-border/60">
                <div className="bg-[#00d05a] h-full w-[95%]" />
              </div>
            </div>
          </div>
        </div>
      )
    } else if (lower === "whoami") {
      response = (
        <div className="font-mono text-xs p-2.5 bg-black/40 rounded border border-border/60 space-y-1">
          <div className="text-[#00d05a] font-bold">OPERATIVE ID: proton_guest_0x89F</div>
          <div className="text-muted-foreground text-[11px]">ROLE: Cybersecurity Researcher [READ/INTERACT]</div>
          <div className="text-muted-foreground text-[11px]">LOCATION: NMAMIT Nitte Campus (13.1830° N, 74.9339° E)</div>
        </div>
      )
    } else if (lower === "neofetch" || lower === "sys" || lower === "system") {
      response = (
        <div className="p-3 bg-black/40 rounded border border-[#00d05a]/30 font-mono text-xs space-y-1.5">
          <div className="text-[#00d05a] font-bold">--- PROTON SYSTEM MATRIX ---</div>
          <div className="text-muted-foreground">NODE: proton-core.nmamit.edu</div>
          <div className="text-muted-foreground">UPTIME: 1460 days, 8 hours</div>
          <div className="text-muted-foreground">LOAD: 0.12, 0.08, 0.05</div>
          <div className="text-muted-foreground">MEMORY: 16384MB / 32768MB (48% utilized)</div>
        </div>
      )
    } else {
      isError = true
      response = (
        <div className="font-mono text-xs text-red-400 flex items-center gap-2">
          <span>[ERROR]</span>
          <span>Command not recognized: &quot;{trimmed}&quot;. Type <span className="text-[#00d05a] underline cursor-pointer" onClick={() => executeCommand("help")}>help</span> for valid commands.</span>
        </div>
      )
    }

    setHistory((prev) => [
      ...prev,
      {
        command: trimmed,
        timestamp: now,
        output: response,
        isError,
      },
    ])
    setInputVal("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length === 0) return
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(nextIdx)
      setInputVal(commandHistory[nextIdx])
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex === -1) return
      const nextIdx = historyIndex + 1
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1)
        setInputVal("")
      } else {
        setHistoryIndex(nextIdx)
        setInputVal(commandHistory[nextIdx])
      }
    }
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] w-screen h-screen flex flex-col items-center justify-start pt-24 sm:pt-28 pb-6 px-3 sm:px-6 bg-black/85 backdrop-blur-xl select-none overflow-hidden"
          onClick={onClose}
        >
          {/* Subtle Ambient Matrix Digital Rain Backdrop */}
          <MatrixRainBackdrop />

          {/* CRT Quantum Glitch Collapse & Power-Off Container */}
          <motion.div
            initial={{
              scaleX: 0.05,
              scaleY: 0.005,
              opacity: 0,
              filter: "brightness(3) blur(6px)",
            }}
            animate={{
              scaleX: [0.05, 1, 1],
              scaleY: [0.005, 0.015, 1],
              opacity: [0, 1, 1],
              filter: ["brightness(3) blur(6px)", "brightness(2) blur(2px)", "brightness(1) blur(0px)"],
            }}
            exit={{
              scaleX: [1, 1.04, 0.98, 1.02, 1, 0.002, 0],
              scaleY: [1, 0.98, 1.02, 0.004, 0.004, 0.002, 0],
              x: [0, -6, 6, -3, 0, 0, 0],
              opacity: [1, 0.95, 1, 0.9, 1, 0.8, 0],
              filter: [
                "brightness(1) contrast(1) blur(0px)",
                "brightness(1.8) contrast(1.5) hue-rotate(90deg) blur(1px)",
                "brightness(2.5) contrast(2) hue-rotate(180deg) blur(2px)",
                "brightness(4) blur(4px)",
                "brightness(5) blur(6px)",
                "brightness(0) blur(10px)"
              ],
            }}
            transition={{
              duration: 0.48,
              times: [0, 0.12, 0.24, 0.45, 0.65, 0.85, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (isBooting) skipBoot()
              else inputRef.current?.focus()
            }}
            className={`relative w-full ${
              isMaximized
                ? "max-w-[95vw] lg:max-w-[92vw] h-[calc(100vh-8rem)]"
                : "max-w-4xl sm:max-w-3xl lg:max-w-4xl h-[calc(100vh-8.5rem)] max-h-[680px]"
            } bg-[#090b0e] border-2 border-border/80 rounded-xl overflow-hidden shadow-[0_0_80px_rgba(0, 208, 90,0.22)] flex flex-col font-mono z-10 transition-[max-width,height] duration-300 ease-out`}
            style={{
              boxShadow: "0 0 0 1px rgba(0, 208, 90,0.25), 0 25px 60px rgba(0,0,0,0.95), 0 0 50px rgba(0, 208, 90,0.15)",
            }}
          >
            {/* CRT Horizontal Scanline & Beam Sweep */}
            <motion.div
              initial={{ y: -30, opacity: 1 }}
              animate={{ y: 640, opacity: [1, 0.8, 0] }}
              transition={{ duration: 0.75, ease: "easeOut" }}
              className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#00d05a] to-transparent pointer-events-none z-30 shadow-[0_0_16px_#00d05a]"
            />

            {/* Top Window Header */}
            <div className="relative z-20 flex items-center justify-between px-4 py-2.5 h-11 bg-[#0f1318] border-b border-border/80 shrink-0 select-none">
              {/* Left Window Control Buttons - Strictly 2 options: Exit & Resize */}
              <div className="flex items-center space-x-2.5">
                {/* 1. Exit Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                  className="w-4 h-4 rounded-full bg-[#ff5f56] hover:brightness-125 active:scale-90 transition-all cursor-pointer flex items-center justify-center group shadow-[0_0_8px_rgba(255,95,86,0.5)] z-30 pointer-events-auto"
                  title="Exit Terminal (Close)"
                  aria-label="Exit Terminal"
                >
                  <X className="w-2.5 h-2.5 text-black opacity-0 group-hover:opacity-100 transition-opacity font-bold stroke-[3]" />
                </button>

                {/* 2. Resize Button (Increase / Decrease Window Size) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMaximized((prev) => !prev)
                  }}
                  className="w-4 h-4 rounded-full bg-[#27c93f] hover:brightness-125 active:scale-90 transition-all cursor-pointer flex items-center justify-center group shadow-[0_0_8px_rgba(39,201,63,0.5)] z-30 pointer-events-auto"
                  title={isMaximized ? "Restore Default Size" : "Expand Window Size"}
                  aria-label={isMaximized ? "Restore Default Size" : "Expand Window Size"}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-2.5 h-2.5 text-black opacity-0 group-hover:opacity-100 transition-opacity font-bold stroke-[3]" />
                  ) : (
                    <Maximize2 className="w-2.5 h-2.5 text-black opacity-0 group-hover:opacity-100 transition-opacity font-bold stroke-[3]" />
                  )}
                </button>

                {/* Tab title bar */}
                <div className="flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded bg-black/60 border border-border/50 text-[11px] text-muted-foreground">
                  <TerminalIcon className="w-3.5 h-3.5 text-[#00d05a]" />
                  <span className="text-foreground font-semibold">proton@nmamit-node</span>
                  <span className="text-[#00d05a] font-bold">~ (zsh)</span>
                </div>
              </div>

              {/* Right System Badges - No duplicate exit button */}
              <div className="flex items-center space-x-3 text-[10px]">
                <div className="hidden sm:flex items-center gap-1 text-muted-foreground px-2 py-0.5 rounded bg-black/40 border border-border/40">
                  <Wifi className="w-3 h-3 text-[#00d05a]" />
                  <span>12ms</span>
                </div>
                <div className="flex items-center gap-1 text-[#00d05a] font-bold px-2 py-0.5 rounded bg-[#00d05a]/10 border border-[#00d05a]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d05a] animate-pulse" />
                  <span>{isBooting ? "BOOTING..." : isMaximized ? "MAXIMIZED" : "ONLINE"}</span>
                </div>
              </div>
            </div>

            {/* Booting Diagnostics Screen */}
            {isBooting ? (
              <div
                className="p-6 font-mono text-xs text-[#00d05a] space-y-3 bg-[#090b0e] flex-1 min-h-0 flex flex-col justify-center items-center cursor-pointer overflow-y-auto"
                onClick={skipBoot}
              >
                <div className="w-full max-w-md space-y-3 p-5 bg-black/60 border border-[#00d05a]/30 rounded-xl shadow-[0_0_30px_rgba(0, 208, 90,0.1)]">
                  <div className="flex items-center justify-between text-foreground font-bold border-b border-border/70 pb-2">
                    <span className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#00d05a] animate-pulse" />
                      SECURE PROTON KERNEL BOOT
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">Click to skip</span>
                  </div>

                  <div className="space-y-1.5 min-h-[110px]">
                    {BOOT_LOGS.slice(0, bootStep + 1).map((log, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between text-muted-foreground text-[11px]"
                      >
                        <span className="truncate pr-2">&gt; {log.text}</span>
                        <span className="text-[#00d05a] font-bold shrink-0">[{log.status}]</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="space-y-1 pt-2 border-t border-border/60">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>INITIALIZING PROTOCOLS...</span>
                      <span className="text-[#00d05a] font-bold">{Math.min(100, Math.round((bootStep / 4) * 100))}%</span>
                    </div>
                    <div className="w-full bg-black/80 h-1.5 rounded-full overflow-hidden border border-border/60">
                      <motion.div
                        className="bg-[#00d05a] h-full shadow-[0_0_10px_#00d05a]"
                        initial={{ width: "10%" }}
                        animate={{ width: `${Math.min(100, ((bootStep + 1) / 5) * 100)}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Main Active Terminal Body */
              <div
                className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto overflow-x-hidden terminal-scroll select-text space-y-4 text-xs sm:text-sm bg-gradient-to-b from-[#090b0e] via-[#0b0e12] to-[#080a0c]"
                onClick={() => inputRef.current?.focus()}
              >
                {history.map((h, i) => (
                  <div key={i} className="space-y-1.5">
                    {/* Command prompt line */}
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="text-[#00d05a] font-bold">proton@nmamit</span>
                      <span className="text-muted-foreground">in</span>
                      <span className="text-sky-400 font-semibold">~</span>
                      <span className="text-muted-foreground">[{h.timestamp}]</span>
                      <span className="text-[#00d05a] font-bold">&gt;</span>
                      <span className="text-foreground font-bold tracking-wide">{h.command}</span>
                    </div>

                    {/* Output content */}
                    <div className="pl-2 sm:pl-3 border-l-2 border-border/60 py-1">
                      {h.output}
                    </div>
                  </div>
                ))}

                {/* Current Active Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    executeCommand(inputVal)
                  }}
                  className="flex items-center gap-2 pt-2"
                >
                  <div className="flex items-center gap-1.5 text-xs text-[#00d05a] font-bold shrink-0">
                    <span>proton@nmamit</span>
                    <span className="text-muted-foreground">in</span>
                    <span className="text-sky-400">~</span>
                    <span>&gt;</span>
                  </div>
                  <div className="flex-1 flex items-center relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type 'help', 'events', 'teams'..."
                      className="w-full bg-transparent border-none outline-none text-foreground font-mono text-xs sm:text-sm focus:ring-0 p-0 selection:bg-[#00d05a]/30"
                      autoFocus
                      spellCheck={false}
                    />
                  </div>
                  <button
                    type="submit"
                    className="p-1 text-muted-foreground hover:text-[#00d05a] transition-colors shrink-0"
                    title="Execute command"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Scroll anchor */}
                <div ref={terminalEndRef} />
              </div>
            )}

            {/* Bottom Quick Chips Bar */}
            <div className="px-3.5 py-2.5 bg-[#0f1318] border-t border-border/80 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider mr-1">Quick:</span>
                {["help", "events", "teams", "about", "gallery", "stats", "clear"].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => {
                      if (isBooting) setIsBooting(false)
                      executeCommand(cmd)
                    }}
                    className="px-2 py-0.5 rounded bg-black/60 hover:bg-[#00d05a]/20 hover:text-[#00d05a] border border-border/60 text-muted-foreground text-[11px] font-mono transition-colors active:scale-95"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground/80 hidden sm:flex items-center gap-2">
                <span>&uarr;&darr; History</span>
                <span>&bull;</span>
                <span>ESC to Close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
