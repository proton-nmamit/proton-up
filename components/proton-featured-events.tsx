"use client"

import { motion } from "framer-motion"
import { Calendar, MapPin, ArrowRight, ArrowUpRight, ShieldAlert } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ProtonEvent } from "@/lib/proton-data"

const ease = [0.22, 1, 0.36, 1] as const

interface ProtonFeaturedEventsProps {
  events?: ProtonEvent[]
}

export function ProtonFeaturedEvents({ events = [] }: ProtonFeaturedEventsProps) {
  // Strictly take data from backend: prioritize isFeatured, otherwise take latest published
  const featured = events.filter((e) => e.isFeatured)
  const displayEvents = featured.length > 0 ? featured.slice(0, 4) : events.slice(0, 4)

  return (
    <section className="relative w-full py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-border/40">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="font-pixel text-3xl sm:text-5xl tracking-tight text-foreground">
            FEATURED EVENTS
          </h2>
        </div>

        <Link
          href="/events"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/70 bg-card/60 hover:bg-[#00d05a] hover:text-black text-xs font-mono font-bold transition-colors w-fit shadow-sm"
        >
          <span>VIEW ALL {events.length > 0 ? `${events.length} ` : ""}EVENTS</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {displayEvents.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border/60 rounded-2xl bg-card/30 backdrop-blur-md">
          <Calendar className="w-8 h-8 text-[#00d05a]/60 mx-auto mb-3 animate-pulse" />
          <p className="font-mono text-sm text-foreground uppercase tracking-wider font-bold">
            NO UPCOMING EVENTS PUBLISHED
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Live workshops, hackathons, and technical bootcamps will be displayed here directly from the backend.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayEvents.map((ev, i) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease }}
              className="group rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md overflow-hidden flex flex-col justify-between hover:border-[#00d05a]/60 transition-all duration-300"
            >
              {/* Image banner - Instagram 4:5 Poster Ratio */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-background">
                <Image
                  src={ev.imageUrl || "/images/hero-1.png"}
                  alt={ev.title}
                  fill
                  unoptimized={ev.imageUrl?.startsWith("http")}
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-background/90 backdrop-blur-md border border-border/80 text-[#00d05a]">
                    {ev.categoryLabel || "Event"}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-2">
                    <Calendar className="w-3.5 h-3.5 text-[#00d05a]" />
                    <span>{ev.formattedDate || ev.date}</span>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-[#00d05a] transition-colors mb-2 line-clamp-1">
                    {ev.title}
                  </h3>

                  <p className="text-xs font-mono text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                    {ev.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-muted-foreground flex items-center gap-1 truncate max-w-[150px]">
                    <MapPin className="w-3 h-3 text-[#00d05a] shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </span>
                  <Link
                    href={`/events#${ev.id}`}
                    className="text-[#00d05a] font-bold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Details</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
