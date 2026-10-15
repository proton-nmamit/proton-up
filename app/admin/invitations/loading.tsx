import React from 'react'
import { AdminLoadingSkeleton } from '@/components/admin/admin-loading-skeleton'

export default function InvitationsLoading() {
  return (
    <AdminLoadingSkeleton
      moduleName="MEMBER INVITATIONS"
      subtitle="Fetching cryptographically signed invitation tokens..."
    />
  )
}
