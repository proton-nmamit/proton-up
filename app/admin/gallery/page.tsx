import React from 'react'
import { redirect } from 'next/navigation'
import { getAdminGalleryData } from '@/app/actions/gallery'
import { GalleryManager } from '@/components/admin/gallery-manager'
import { getCurrentUser } from '@/lib/auth/session'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'

export const metadata = {
  title: 'Gallery Management — PROTON CMS',
}

export default async function AdminGalleryPage() {
  const user = await getCurrentUser()
  if (user) {
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageGallery) {
      redirect('/admin')
    }
  }

  const { images, albums } = await getAdminGalleryData()

  return <GalleryManager initialImages={images} initialAlbums={albums} />
}
