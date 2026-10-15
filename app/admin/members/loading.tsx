import React from 'react'
import { AdminLoadingSkeleton } from '@/components/admin/admin-loading-skeleton'

export default function MembersLoading() {
  return (
    <AdminLoadingSkeleton
      moduleName="MEMBER MANAGEMENT"
      subtitle="Fetching student registrations and profile approvals..."
    />
  )
}
