import React from 'react'
import { AdminLoadingSkeleton } from '@/components/admin/admin-loading-skeleton'

export default function DesignationsLoading() {
  return (
    <AdminLoadingSkeleton
      moduleName="DESIGNATION HIERARCHY"
      subtitle="Loading organizational hierarchy and display order..."
    />
  )
}
