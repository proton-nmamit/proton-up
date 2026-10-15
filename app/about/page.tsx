"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { 
  Shield, 
  Terminal, 
  Users, 
  Award, 
  Cpu, 
  Network, 
  ArrowRight,
  Mail,
  MapPin,
  Globe,
  Sparkles,
  CheckCircle2,
  Lock,
  Code
} from "lucide-react"
import { PROTON_META, CORE_VALUES, WHAT_WE_DO } from "@/lib/proton-data"

const ease = [0.22, 1, 0.36, 1] as const

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen dot-grid-bg flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-6 py-12 lg:px-12 max-w-6xl mx-auto w-full space-y-16">
        {/* Header Hero */}
        <div className="text-center space-y-6 max-w-4xl pt-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/70 bg-card/60 text-[11px] font-mono text-[#00d05a] uppercase tracking-widest shadow-[0_0_10px_rgba(0, 208, 90,0.15)]"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>ABOUT PROTON ASSOCIATION // ESTD. 2024</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="font-pixel text-4xl sm:text-6xl lg:text-7xl text-foreground tracking-tight select-none uppercase"
          >
            SECURING THE FUTURE.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="text-base sm:text-lg text-muted-foreground font-mono leading-relaxed tracking-wide"
          >
            <span className="text-[#00d05a] font-bold drop-shadow-[0_0_8px_rgba(0,208,90,0.5)]">PR</span>OACTIVE{" "}
            <span className="text-[#00d05a] font-bold drop-shadow-[0_0_8px_rgba(0,208,90,0.5)]">O</span>RGANISATION FOR{" "}
            <span className="text-[#00d05a] font-bold drop-shadow-[0_0_8px_rgba(0,208,90,0.5)]">T</span>HREATS AND{" "}
            <span className="text-[#00d05a] font-bold drop-shadow-[0_0_8px_rgba(0,208,90,0.5)]">O</span>NLINE{" "}
            <span className="text-[#00d05a] font-bold drop-shadow-[0_0_8px_rgba(0,208,90,0.5)]">N</span>ETWORKS
          </motion.p>
        </div>

        {/* Mission Statement Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="w-full p-8 sm:p-10 rounded-2xl border border-[#00d05a]/40 bg-gradient-to-r from-background/90 via-[#00d05a]/5 to-background/90 backdrop-blur-md text-center space-y-4 shadow-xl"
        >
          <div className="flex justify-center mb-2">
            <div className="relative w-12 h-12 rounded overflow-hidden">
              <Image
                src="/images/Protton_logo.png"
                alt="PROTON Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#00d05a] font-bold block">
            OUR MISSION & PHILOSOPHY
          </span>
          <h2 className="font-pixel text-2xl sm:text-4xl text-foreground leading-snug">
            &ldquo;{PROTON_META.slogan}&rdquo;
          </h2>
          <p className="text-xs sm:text-sm font-mono text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {PROTON_META.description}
          </p>
          <div className="pt-2 text-[11px] font-mono text-[#00d05a] font-bold uppercase tracking-wider">
            &mdash; {PROTON_META.tagline}
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {[
            { label: "FOUNDED YEAR", val: PROTON_META.foundedYear },
            { label: "CORE MEMBERS", val: PROTON_META.stats.coreMembers },
            { label: "EVENTS CONDUCTED", val: PROTON_META.stats.eventsConducted },
            { label: "STUDENT PROJECTS", val: PROTON_META.stats.projectsCompleted },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5, ease }}
              className="p-5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-md text-center"
            >
              <div className="font-pixel text-2xl sm:text-3xl text-[#00d05a] mb-1 font-bold">
                {stat.val}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Four Core Values */}
        <div className="space-y-6 w-full">
          <div className="border-b border-border pb-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-[#00d05a] font-bold">
              CORE PILLARS
            </h2>
            <p className="text-xl font-semibold text-foreground mt-1">
              Guiding Principles of PROTON
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CORE_VALUES.map((val, i) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease }}
                className="p-6 rounded-xl border border-border bg-card/60 backdrop-blur-sm flex flex-col justify-start gap-3 hover:border-[#00d05a]/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#00d05a]">{val.code}</span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Pillar {i + 1}</span>
                </div>
                <h3 className="font-bold text-lg text-foreground group-hover:text-[#00d05a] transition-colors">
                  {val.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-mono leading-relaxed">
                  {val.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* What We Do Section */}
        <div className="space-y-6 w-full">
          <div className="border-b border-border pb-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-[#00d05a] font-bold">
              OPERATIONAL DOMAINS
            </h2>
            <p className="text-xl font-semibold text-foreground mt-1">
              What We Do at NMAMIT
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {WHAT_WE_DO.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.5, ease }}
                className="p-6 rounded-xl border border-border bg-card/60 backdrop-blur-sm space-y-3 hover:border-[#00d05a]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00d05a]/10 text-[#00d05a] border border-[#00d05a]/20">
                    {item.tag}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-foreground">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-mono leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Campus & Department Details */}
        <div className="w-full p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-sm space-y-6">
          <div className="border-b border-border/70 pb-4">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#00d05a] font-bold">
              CAMPUS NODE INFORMATION
            </h3>
            <p className="text-lg font-bold text-foreground mt-1">
              Department of Computer Science & Engineering (Cybersecurity)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs text-muted-foreground">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#00d05a] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground block">Campus Location</span>
                  <span>{PROTON_META.location}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#00d05a] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground block">Primary Inquiries</span>
                  <a href={`mailto:${PROTON_META.contactEmail}`} className="text-[#00d05a] hover:underline">
                    {PROTON_META.contactEmail}
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Award className="w-4 h-4 text-[#00d05a] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground block">Institution</span>
                  <span>{PROTON_META.institution}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-[#00d05a] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground block">Community Channels</span>
                  <span>GitHub &bull; LinkedIn &bull; Instagram &bull; Discord</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="w-full p-8 sm:p-12 rounded-2xl border border-[#00d05a]/30 bg-gradient-to-b from-card to-[#00d05a]/5 text-center space-y-6"
        >
          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="font-pixel text-2xl sm:text-3xl text-foreground">
              BECOME PART OF PROTON
            </h3>
            <p className="text-xs sm:text-sm font-mono text-muted-foreground">
              Participate in our upcoming cybersecurity bootcamps, capture-the-flags, and campus events.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => router.push('/events')}
              className="inline-flex items-center gap-3 bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-mono text-xs uppercase tracking-widest font-bold px-7 py-3 rounded-lg transition-all shadow-lg shadow-[#00d05a]/20"
            >
              <span>Explore Events</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => router.push('/teams')}
              className="inline-flex items-center gap-3 border border-border hover:bg-muted text-foreground font-mono text-xs uppercase tracking-widest font-bold px-7 py-3 rounded-lg transition-all hover:border-[#00d05a]/50"
            >
              <span>View Core Team</span>
            </button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
