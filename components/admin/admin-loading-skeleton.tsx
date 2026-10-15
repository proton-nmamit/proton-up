import React from 'react'
import { Loader2, ShieldCheck, Terminal } from 'lucide-react'

export function AdminLoadingSkeleton({
  moduleName = 'CMS MODULE',
  subtitle = 'Querying live Supabase database records...',
}: {
  moduleName?: string
  subtitle?: string
}) {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Module Header Skeleton */}
      <div className="border-b border-[#222] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#00d05a] mb-1">
            <ShieldCheck className="w-4 h-4 animate-pulse" />
            <span>SECURE CMS NODE // {moduleName.toUpperCase()}</span>
          </div>
          <div className="h-8 w-64 bg-[#181818] rounded-md" />
          <div className="h-4 w-96 bg-[#121212] rounded-md mt-2" />
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e0e0e] border border-[#222]">
          <Loader2 className="w-4 h-4 text-[#00d05a] animate-spin" />
          <span className="text-xs font-mono text-[#00d05a]">
            STREAMING DATA...
          </span>
        </div>
      </div>

      {/* Control / Filter Bar Skeleton */}
      <div className="p-4 rounded-xl border border-[#222] bg-[#0c0c0c] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="h-9 w-72 bg-[#181818] rounded-lg" />
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-[#181818] rounded-lg" />
          <div className="h-9 w-32 bg-[#181818] rounded-lg" />
        </div>
      </div>

      {/* Content Table / Grid Skeleton */}
      <div className="rounded-xl border border-[#222] bg-[#0c0c0c] overflow-hidden">
        <div className="p-4 border-b border-[#1f1f1f] bg-[#0f0f0f] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Terminal className="w-3.5 h-3.5 text-[#00d05a]" />
            <span>{subtitle}</span>
          </div>
          <div className="h-4 w-20 bg-[#1a1a1a] rounded" />
        </div>

        <div className="divide-y divide-[#181818] p-2 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-[#181818] shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/3 bg-[#181818] rounded" />
                  <div className="h-3 w-1/4 bg-[#121212] rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-[#181818] rounded-full shrink-0" />
              <div className="h-8 w-24 bg-[#181818] rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
