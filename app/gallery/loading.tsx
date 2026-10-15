import React from 'react'
import { PublicPageSkeleton } from '@/components/ui/public-page-skeleton'

export default function GalleryLoading() {
  return (
    <div className="min-h-screen dot-grid-bg flex flex-col justify-start">
      <PublicPageSkeleton
        badge="MEDIA VAULT // SYNCHRONIZING"
        title="PROTON GALLERY"
        subtitle="Visual chronicle of workshops, hackathons, outreach campaigns, and student milestones across NMAMIT."
        cardCount={8}
        type="gallery"
      />
    </div>
  )
}
