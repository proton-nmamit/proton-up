import React from 'react'
import { AdminLoadingSkeleton } from '@/components/admin/admin-loading-skeleton'

export default function AdminRootLoading() {
  return (
    <AdminLoadingSkeleton
      moduleName="ADMINISTRATOR ROOT CONSOLE"
      subtitle="Connecting to secure node // Synchronizing dashboard metrics..."
    />
  )
}
