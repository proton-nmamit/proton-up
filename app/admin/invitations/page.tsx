import React from 'react'
import { redirect } from 'next/navigation'
import { getInvitationsList } from '@/app/actions/invitations'
import { getDesignationsList } from '@/lib/data-service'
import { InvitationsManager } from '@/components/admin/invitations-manager'
import { getCurrentUser } from '@/lib/auth/session'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'

export const metadata = {
  title: 'Member Invitations — PROTON CMS',
}

export default async function AdminInvitationsPage() {
  const user = await getCurrentUser()
  if (user) {
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageInvitations) {
      redirect(perms.isEventsManager ? '/admin/events' : '/admin')
    }
  }

  const [{ invitations }, designations] = await Promise.all([
    getInvitationsList(),
    getDesignationsList(),
  ])

  return (
    <InvitationsManager
      initialInvitations={invitations}
      designations={designations}
    />
  )
}
