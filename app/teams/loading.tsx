import React from 'react'
import { PublicPageSkeleton } from '@/components/ui/public-page-skeleton'

export default function TeamsLoading() {
  return (
    <div className="min-h-screen dot-grid-bg flex flex-col justify-start">
      <PublicPageSkeleton
        badge="EXECUTIVE ROSTER // SYNCHRONIZING"
        title="CORE TEAM & LEADS"
        subtitle="Meet the student executives, security researchers, coordinators, and creatives directing PROTON Association at NMAMIT."
        cardCount={6}
      />
    </div>
  )
}
