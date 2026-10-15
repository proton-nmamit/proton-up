import React, { Suspense } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { EventsView } from '@/components/events/events-view'
import { getPublicEvents } from '@/lib/data-service'
import { PublicPageSkeleton } from '@/components/ui/public-page-skeleton'

export const metadata = {
  title: 'Activities & Events — PROTON',
  description: 'Explore hands-on cybersecurity workshops, technical bootcamps, and national hackathons hosted by PROTON at NMAMIT.',
}

export const dynamic = 'force-dynamic'

async function EventsData() {
  const events = await getPublicEvents()
  return <EventsView initialEvents={events} />
}

export default function EventsPage() {
  return (
    <div className="min-h-screen dot-grid-bg flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col">
        <Suspense
          fallback={
            <PublicPageSkeleton
              badge="ACTIVITIES DIRECTORY // SYNCHRONIZING"
              title="PROTON EVENTS"
              subtitle="Explore our hands-on cybersecurity workshops, technical bootcamps, national hackathons, and guest lectures hosted at NMAMIT."
              cardCount={6}
            />
          }
        >
          <EventsData />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}
