import React from 'react'
import { Terminal } from 'lucide-react'

export default function AdminLogsLoading() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#222] pb-6">
        <div className="h-4 w-48 bg-neutral-900 rounded animate-pulse mb-2" />
        <div className="h-7 w-64 bg-neutral-900 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-[#222] bg-[#0c0c0c] h-20 animate-pulse" />
        ))}
      </div>

      <div className="rounded-xl border border-[#222] bg-[#0c0c0c] p-8 flex flex-col items-center justify-center space-y-3">
        <Terminal className="w-8 h-8 text-[#00d05a] animate-spin" />
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          SYNCHRONIZING AUDIT LOGS...
        </p>
      </div>
    </div>
  )
}
