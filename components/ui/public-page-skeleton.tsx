import React from 'react'

interface PublicPageSkeletonProps {
  badge?: string
  title: string
  subtitle: string
  cardCount?: number
  type?: 'cards' | 'grid' | 'gallery'
}

export function PublicPageSkeleton({
  badge = 'PROTON CYBER NODE // V3.0',
  title,
  subtitle,
  cardCount = 6,
  type = 'cards'
}: PublicPageSkeletonProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 select-none animate-fadeIn">
      {/* Top Cyber Telemetry Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00d05a]/30 bg-[#00d05a]/10 text-[#00d05a] text-xs font-mono mb-4 shadow-[0_0_12px_rgba(0,208,90,0.15)]">
          <span className="w-2 h-2 rounded-full bg-[#00d05a] animate-ping" />
          <span className="tracking-wider uppercase font-semibold">{badge}</span>
        </div>

        <h1 className="font-pixel text-3xl sm:text-5xl lg:text-6xl text-foreground tracking-tight uppercase mb-4">
          {title}
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground font-mono max-w-xl mx-auto flex items-center justify-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00d05a] animate-pulse" />
          <span>{subtitle}</span>
        </p>

        {/* Laser Scanning Beam */}
        <div className="w-48 sm:w-64 h-[2px] mx-auto mt-6 bg-gradient-to-r from-transparent via-[#00d05a] to-transparent relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00d05a] animate-[shimmer_1.5s_infinite] shadow-[0_0_10px_#00d05a]" />
        </div>
      </div>

      {/* Cyber Category Filter Bar Placeholder */}
      <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto py-2">
        {[80, 100, 90, 110, 85].map((w, i) => (
          <div
            key={i}
            style={{ width: `${w}px` }}
            className="h-8 rounded-full border border-white/[0.08] bg-black/40 animate-pulse shrink-0"
          />
        ))}
      </div>

      {/* Dynamic Grid of Skeleton Cards */}
      <div className={`grid gap-6 ${type === 'gallery' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.08] bg-black/40 backdrop-blur-md p-5 relative overflow-hidden"
          >
            {/* Top scanning accent */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00d05a]/30 to-transparent" />

            <div className="flex items-start gap-4">
              {/* Avatar / Thumbnail Skeleton */}
              <div className="w-16 h-16 rounded-lg bg-white/[0.05] border border-white/[0.08] shrink-0 relative overflow-hidden animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-[shimmer_2s_infinite]" />
              </div>

              {/* Text lines */}
              <div className="flex-1 space-y-2.5">
                <div className="h-4 bg-white/[0.08] rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-[#00d05a]/20 rounded w-1/2 animate-pulse" />
                <div className="h-2.5 bg-white/[0.05] rounded w-5/6 animate-pulse" />
              </div>
            </div>

            {/* Card Body details */}
            <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-2">
              <div className="h-2.5 bg-white/[0.05] rounded w-full animate-pulse" />
              <div className="h-2.5 bg-white/[0.04] rounded w-2/3 animate-pulse" />
            </div>

            {/* Bottom Tag */}
            <div className="mt-4 flex items-center justify-between">
              <div className="h-4 w-16 bg-[#00d05a]/10 border border-[#00d05a]/20 rounded animate-pulse" />
              <div className="h-3 w-20 bg-white/[0.05] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Live Telemetry Stream Indicator */}
      <div className="mt-12 text-center text-[11px] font-mono text-muted-foreground flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00d05a] animate-pulse" />
        <span>UPLINK CONNECTED // STREAMING BACKEND RECORDS...</span>
      </div>
    </div>
  )
}
