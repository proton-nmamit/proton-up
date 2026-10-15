import React from 'react'
import { redirect } from 'next/navigation'
import { getAdminMembersList } from '@/app/actions/members'
import { MembersManager } from '@/components/admin/members-manager'

export const metadata = {
  title: 'Member Management — PROTON CMS',
}

export default async function AdminMembersPage() {
  const { members, designations, adminPermissions } = await getAdminMembersList()

  if (adminPermissions?.isEventsManager) {
    redirect('/admin/events')
  }

  return (
    <MembersManager
      initialMembers={members}
      designations={designations}
      adminPermissions={adminPermissions}
    />
  )
}
