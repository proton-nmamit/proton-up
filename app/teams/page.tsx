import React, { Suspense } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { TeamsView } from '@/components/teams/teams-view'
import { getPublicMembers } from '@/lib/data-service'
import { PublicPageSkeleton } from '@/components/ui/public-page-skeleton'

export const metadata = {
  title: 'Core Team & Leads — PROTON',
  description: 'Meet the student executives, security researchers, coordinators, and creatives directing PROTON Association at NMAMIT.',
}

export const dynamic = 'force-dynamic'

async function TeamsData() {
  const members = await getPublicMembers()
  return <TeamsView members={members} />
}

export default function TeamsPage() {
  return (
    <div className="min-h-screen dot-grid-bg flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col">
        <Suspense
          fallback={
            <PublicPageSkeleton
              badge="EXECUTIVE ROSTER // SYNCHRONIZING"
              title="CORE TEAM & LEADS"
              subtitle="Meet the student executives, security researchers, coordinators, and creatives directing PROTON Association at NMAMIT."
              cardCount={6}
            />
          }
        >
          <TeamsData />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}
