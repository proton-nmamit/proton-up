"use client"

import { useState } from "react"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"
import { RandomLetterSwap } from "@/components/ui/random-letter-swap"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, Lock, User } from "lucide-react"

const NAV_ITEMS = [
  { label: "ABOUT", href: "/about" },
  { label: "EVENTS", href: "/events" },
  { label: "TEAMS", href: "/teams" },
  { label: "GALLERY", href: "/gallery" },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(false)

  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    if (latest > previous && latest > 100) {
      setHidden(true)
    } else {
      setHidden(false)
    }
  })

  return (
    <motion.header
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: "-120%", opacity: 0 },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 left-0 right-0 w-full px-4 pt-4 lg:px-6 lg:pt-6 z-50 pointer-events-auto"
    >
      <nav className="w-full border border-foreground/20 rounded-xl bg-background/80 backdrop-blur-md px-6 py-3 lg:px-8 shadow-lg shadow-black/5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-8 h-8 rounded overflow-hidden flex items-center justify-center">
                <Image
                  src="/images/Protton_logo.png"
                  alt="PROTON Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="text-xs font-mono tracking-[0.2em] uppercase font-bold group-hover:text-[#00d05a] transition-colors">
                PROTON
              </span>
            </Link>
          </motion.div>

          {/* Center nav links (Desktop) */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item, i) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="relative group py-1"
                >
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className={`text-xs font-mono tracking-widest uppercase transition-colors duration-200 ${
                      isActive ? "text-[#00d05a] font-bold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <RandomLetterSwap
                      label={item.label}
                      staggerDuration={0.025}
                      transition={{ duration: 0.6, type: "spring" }}
                    />
                  </motion.div>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#00d05a] rounded-full shadow-[0_0_8px_#00d05a]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right side: Portal / Login + CTF + Mobile Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex items-center gap-2 sm:gap-3"
          >

            <Link
              href="/member/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/70 hover:border-[#00d05a]/60 bg-card/60 hover:bg-muted text-xs font-mono tracking-wider uppercase text-foreground hover:text-[#00d05a] transition-all duration-200"
              title="Member & Admin Access Portal"
            >
              <Lock className="w-3.5 h-3.5 text-[#00d05a]" />
              <span className="hidden sm:inline">MEMBER</span>
              <span>LOGIN</span>
            </Link>

            <motion.button
              onClick={() => {
                // CTF platform redirect placeholder (under development)
                // window.open('https://ctf.protoncyber.org', '_blank')
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="hidden lg:block bg-foreground text-background px-4 py-2 rounded-md text-xs font-mono tracking-widest uppercase font-semibold hover:bg-[#00d05a] hover:text-black transition-colors shadow-sm cursor-pointer"
            >
              CTF
            </motion.button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-foreground/80 hover:text-foreground focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </motion.div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden pt-4 pb-2 border-t border-border mt-3 flex flex-col gap-3"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between py-2 text-xs font-mono tracking-widest uppercase rounded-lg px-3 transition-colors ${
                      isActive
                        ? "bg-[#00d05a]/10 text-[#00d05a] font-bold"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#00d05a]" />}
                  </Link>
                )
              })}
              <div className="pt-2 flex flex-col gap-2 border-t border-border/50">
                <Link
                  href="/member/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border border-[#00d05a]/40 bg-[#00d05a]/10 text-foreground font-mono text-xs uppercase tracking-wider"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#00d05a]" />
                    <span>MEMBER LOGIN / PORTAL</span>
                  </span>
                  <span className="text-[10px] text-[#00d05a] font-bold">ACCESS →</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    // CTF platform redirect placeholder (under development)
                  }}
                  className="w-full bg-[#00d05a] text-black py-2.5 rounded-md text-xs font-mono tracking-widest uppercase font-bold"
                >
                  CTF
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}
