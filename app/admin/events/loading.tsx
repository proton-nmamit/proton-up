import React from 'react'
import { AdminLoadingSkeleton } from '@/components/admin/admin-loading-skeleton'

export default function EventsLoading() {
  return (
    <AdminLoadingSkeleton
      moduleName="EVENT MANAGEMENT"
      subtitle="Fetching workshops, CTF records, and registrations..."
    />
  )
}
