import React from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function MemberDashboardLoading() {
  return (
    <div className="min-h-screen bg-[#050505] text-foreground p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="border-b border-[#222] pb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#00d05a]">
            <ShieldCheck className="w-4 h-4 animate-pulse" />
            <span>PROTON OPERATIVE NODE</span>
          </div>
          <div className="h-8 w-60 bg-[#181818] rounded-md" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e0e0e] border border-[#222]">
          <Loader2 className="w-4 h-4 text-[#00d05a] animate-spin" />
          <span className="text-xs font-mono text-[#00d05a]">LOADING PROFILE...</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-[#222] bg-[#0c0c0c] space-y-4">
          <div className="w-24 h-24 rounded-full bg-[#181818] mx-auto" />
          <div className="h-5 w-3/4 bg-[#181818] mx-auto rounded" />
          <div className="h-4 w-1/2 bg-[#141414] mx-auto rounded" />
        </div>
        <div className="md:col-span-2 p-6 rounded-xl border border-[#222] bg-[#0c0c0c] space-y-4">
          <div className="h-6 w-1/3 bg-[#181818] rounded" />
          <div className="h-10 w-full bg-[#181818] rounded-lg" />
          <div className="h-10 w-full bg-[#181818] rounded-lg" />
          <div className="h-24 w-full bg-[#181818] rounded-lg" />
        </div>
      </div>
    </div>
  )
}
