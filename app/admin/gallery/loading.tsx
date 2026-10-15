import React from 'react'
import { AdminLoadingSkeleton } from '@/components/admin/admin-loading-skeleton'

export default function GalleryLoading() {
  return (
    <AdminLoadingSkeleton
      moduleName="GALLERY MANAGEMENT"
      subtitle="Fetching club media assets, albums, and storage records..."
    />
  )
}
