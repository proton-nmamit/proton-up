import React, { Suspense } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { GalleryView } from '@/components/gallery/gallery-view'
import { getPublicGallery } from '@/lib/data-service'
import { PublicPageSkeleton } from '@/components/ui/public-page-skeleton'

export const metadata = {
  title: 'Media Vault & Gallery — PROTON',
  description: 'Visual chronicle of cybersecurity workshops, hackathons, outreach campaigns, and student milestones across NMAMIT.',
}

export const dynamic = 'force-dynamic'

async function GalleryData() {
  const items = await getPublicGallery()
  return <GalleryView initialItems={items} />
}

export default function GalleryPage() {
  return (
    <div className="min-h-screen dot-grid-bg flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col">
        <Suspense
          fallback={
            <PublicPageSkeleton
              badge="MEDIA VAULT // SYNCHRONIZING"
              title="PROTON GALLERY"
              subtitle="Visual chronicle of workshops, hackathons, outreach campaigns, and student milestones across NMAMIT."
              cardCount={8}
              type="gallery"
            />
          }
        >
          <GalleryData />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}
