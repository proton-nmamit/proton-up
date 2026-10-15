"use client"

import { useState } from "react"
import { WorkflowDiagram } from "@/components/workflow-diagram"
import { ArrowRight, ChevronDown, Shield, Users, Calendar, Sparkles, Terminal } from "lucide-react"
import { motion } from "framer-motion"
import { PROTON_META } from "@/lib/proton-data"
import { useRouter } from "next/navigation"
import { openGlobalTerminal } from "@/components/global-terminal"

const ease = [0.22, 1, 0.36, 1] as const

export function HeroSection() {
  const router = useRouter()
  const [isCtaHovered, setIsCtaHovered] = useState(false)

  const scrollToBento = () => {
    const el = document.getElementById("proton-initiatives")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="relative w-full px-6 pt-12 pb-16 lg:px-12 min-h-[calc(100vh-80px)] flex flex-col justify-center items-center overflow-hidden bg-transparent">
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-6xl mx-auto">
        {/* Top headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease }}
          className="font-pixel text-4xl sm:text-6xl lg:text-7xl xl:text-[8rem] tracking-tight text-foreground mb-2 select-none uppercase"
        >
          INNOVATE. HACK.
        </motion.h1>

        {/* Central Animated Workflow Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease }}
          className="w-full max-w-4xl my-4 lg:my-6"
        >
          <WorkflowDiagram onOpenTerminal={openGlobalTerminal} />
        </motion.div>

        {/* Bottom content with smooth layout glide */}
        <motion.div
          layout
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col items-center"
        >
          {/* Bottom headline: STAY SECURE. (Animated Cyber Gradient) */}
          <motion.h1
            layout="position"
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.25, ease }}
            className="font-pixel text-4xl sm:text-6xl lg:text-7xl xl:text-[8rem] tracking-tight mb-6 select-none uppercase animate-text-gradient drop-shadow-[0_0_24px_rgba(0, 208, 90,0.2)]"
          >
            STAY SECURE.
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            layout="position"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease }}
            className="text-xs sm:text-sm lg:text-base text-muted-foreground max-w-2xl mb-8 leading-relaxed font-mono"
          >
            Welcome to <strong className="text-foreground font-semibold">PROTON Association</strong> — the official Cybersecurity & Technical Society of NMAMIT. We bridge theoretical computer science with hands-on ethical hacking, national hackathons, and security engineering.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            layout="position"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto max-w-xs sm:max-w-none mb-8 px-4 sm:px-0"
          >
            <motion.button
              onClick={() => router.push('/events')}
              onMouseEnter={() => setIsCtaHovered(true)}
              onMouseLeave={() => setIsCtaHovered(false)}
              whileTap={{ scale: 0.96 }}
              className={`w-full sm:w-auto relative flex items-center ${
                isCtaHovered ? "flex-row-reverse" : "flex-row"
              } bg-[#00d05a] text-black text-xs sm:text-sm font-mono tracking-wider uppercase overflow-hidden shadow-lg shadow-[#00d05a]/20 hover:shadow-[#00d05a]/45 rounded-md font-bold h-10 sm:h-11 transition-all duration-300 select-none cursor-pointer`}
            >
              <motion.span
                layout
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center w-10 sm:w-11 h-full bg-black text-[#00d05a] shrink-0"
              >
                <motion.div
                  animate={{ x: isCtaHovered ? 2 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight size={18} />
                </motion.div>
              </motion.span>
              <motion.span
                layout
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="px-5 py-2.5 tracking-widest text-center whitespace-nowrap flex-1 sm:flex-initial"
              >
                EXPLORE EVENTS
              </motion.span>
            </motion.button>

            <button
              onClick={() => router.push('/teams')}
              className="w-full sm:w-auto px-5 py-2.5 sm:py-3 border border-border/80 bg-card/60 hover:bg-muted/80 active:scale-95 rounded-md text-xs font-mono tracking-widest uppercase font-bold text-foreground transition-colors hover:border-[#00d05a]/50 text-center"
            >
              MEET THE TEAM
            </button>
          </motion.div>

          {/* Scroll Cue */}
          <motion.div
            layout="position"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease }}
            onClick={scrollToBento}
            className="mt-6 flex flex-col items-center gap-2 cursor-pointer group select-none"
          >
            <div className="flex items-center gap-2 px-3.5 py-1 rounded-full border border-border/70 bg-card/60 backdrop-blur-md text-[10px] font-mono text-muted-foreground group-hover:text-foreground group-hover:border-[#00d05a]/60 transition-all">
              <span className="tracking-widest uppercase">EXPLORE DOMAINS & ACTIVITIES</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#00d05a] group-hover:translate-y-0.5 transition-transform" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
