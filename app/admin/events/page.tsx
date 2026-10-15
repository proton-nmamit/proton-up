import React from 'react'
import { redirect } from 'next/navigation'
import { getAdminEventsList } from '@/app/actions/events'
import { EventsManager } from '@/components/admin/events-manager'
import { getCurrentUser } from '@/lib/auth/session'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'

export const metadata = {
  title: 'Event Management — PROTON CMS',
}

export default async function AdminEventsPage() {
  const user = await getCurrentUser()
  if (user) {
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageEvents) {
      redirect('/admin')
    }
  }

  const { events } = await getAdminEventsList()

  return <EventsManager initialEvents={events} userEmail={user?.email} />
}
