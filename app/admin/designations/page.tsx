import React from 'react'
import { redirect } from 'next/navigation'
import { getAdminDesignationsWithCounts } from '@/app/actions/designations'
import { DesignationsManager } from '@/components/admin/designations-manager'
import { getCurrentUser } from '@/lib/auth/session'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'

export const metadata = {
  title: 'Designation Hierarchy — PROTON CMS',
}

export default async function AdminDesignationsPage() {
  const user = await getCurrentUser()
  if (user) {
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageDesignations) {
      redirect(perms.isEventsManager ? '/admin/events' : '/admin')
    }
  }

  const { designations } = await getAdminDesignationsWithCounts()

  return <DesignationsManager initialDesignations={designations} />
}
