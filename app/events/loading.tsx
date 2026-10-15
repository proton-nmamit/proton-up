import React from 'react'
import { PublicPageSkeleton } from '@/components/ui/public-page-skeleton'

export default function EventsLoading() {
  return (
    <div className="min-h-screen dot-grid-bg flex flex-col justify-start">
      <PublicPageSkeleton
        badge="ACTIVITIES DIRECTORY // SYNCHRONIZING"
        title="PROTON EVENTS"
        subtitle="Explore our hands-on cybersecurity workshops, technical bootcamps, national hackathons, and guest lectures hosted at NMAMIT."
        cardCount={6}
      />
    </div>
  )
}
