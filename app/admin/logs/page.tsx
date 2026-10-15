import React from 'react'
import { redirect } from 'next/navigation'
import { getAuditLogs } from '@/lib/audit-service'
import { AuditLogsViewer } from '@/components/admin/audit-logs-viewer'
import { requireAdminSession } from '@/lib/auth/session'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'

export const metadata = {
  title: 'Audit Logs & Security Activity — PROTON CMS',
}

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
  const { user } = await requireAdminSession()
  const perms = getAdminPermissions(user.email)
  if (!perms.canViewAuditLogs) {
    redirect(perms.isEventsManager ? '/admin/events' : '/admin')
  }

  const { logs, source } = await getAuditLogs({ limit: 500 })

  return (
    <AuditLogsViewer
      initialLogs={logs}
      source={source}
    />
  )
}
