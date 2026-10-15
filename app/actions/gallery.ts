'use server'

import { sql, isDbConfigured } from '@/lib/db'
import { requireAdminSession } from '@/lib/auth/session'
import { DbGalleryImage, DbGalleryAlbum, ContentStatus } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { isLocalDevMode, readLocalStore, writeLocalStore } from '@/lib/local-store'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'
import { uploadToCloudinary, deleteFromCloudinary, STORAGE_PRESETS } from '@/lib/storage/cloudinary'

const MAX_IMAGE_SIZE = STORAGE_PRESETS.GALLERY_IMAGES.maxSizeBytes // 10 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Retrieves all gallery images and albums for administrative management.
 */
export async function getAdminGalleryData(): Promise<{
  images: DbGalleryImage[]
  albums: DbGalleryAlbum[]
  error?: string
}> {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageGallery) {
      return { images: [], albums: [], error: 'Permission denied: Cannot access gallery data.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      return {
        images: store.gallery_images,
        albums: store.gallery_albums,
      }
    }

    if (!isDbConfigured()) return { images: [], albums: [], error: 'Database service unconfigured' }

    const [images, albums] = await Promise.all([
      sql`SELECT * FROM public.gallery_images ORDER BY display_order ASC`,
      sql`SELECT * FROM public.gallery_albums ORDER BY display_order ASC`,
    ])

    return {
      images: (images as any[] as DbGalleryImage[]) || [],
      albums: (albums as any[] as DbGalleryAlbum[]) || [],
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unauthorized'
    return { images: [], albums: [], error: msg }
  }
}

/**
 * Uploads a new gallery image to Cloudinary storage and creates database record.
 */
export async function uploadGalleryImageAction(formData: FormData) {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageGallery) {
      return { error: 'Permission denied: Your account cannot upload gallery photos.' }
    }

    const file = formData.get('image_file') as File | null
    const title = (formData.get('title') as string)?.trim()
    const eventName = (formData.get('event_name') as string)?.trim()
    const dateStr = (formData.get('date_str') as string)?.trim() || '2025'
    const category = (formData.get('category') as string)?.trim() || 'Workshops'
    const caption = (formData.get('caption') as string)?.trim() || null
    const altText = (formData.get('alt_text') as string)?.trim() || title || 'PROTON Club Moment'
    const albumId = (formData.get('album_id') as string)?.trim() || null
    const displayOrder = parseInt(formData.get('display_order') as string, 10) || 50
    const status = (formData.get('status') as ContentStatus) || 'draft'

    if (!file || file.size === 0) {
      return { error: 'Please select an image file to upload.' }
    }
    if (!title || !eventName) {
      return { error: 'Image title and event name are required.' }
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return { error: 'Image file size exceeds maximum allowed limit of 10 MB.' }
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return { error: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const buffer = Buffer.from(await file.arrayBuffer())
      const publicUrl = `data:${file.type};base64,${buffer.toString('base64')}`
      const newImage: DbGalleryImage = {
        id: `gal-${Date.now()}`,
        album_id: albumId,
        title,
        event_name: eventName,
        date_str: dateStr,
        category,
        image_url: publicUrl,
        caption,
        alt_text: altText,
        display_order: displayOrder,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      store.gallery_images.unshift(newImage)
      writeLocalStore(store)
      revalidatePath('/admin/gallery')
      revalidatePath('/gallery')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
    const buffer = Buffer.from(await file.arrayBuffer())

    const uploadRes = await uploadToCloudinary({
      buffer,
      folder: `${STORAGE_PRESETS.GALLERY_IMAGES.folder}/${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      filename: `${Date.now()}_${cleanTitle}`,
      maxSizeBytes: MAX_IMAGE_SIZE,
      allowedFormats: ['jpeg', 'png', 'webp'],
      tags: ['gallery', category],
    })

    if (!uploadRes.success || !uploadRes.url) {
      return { error: uploadRes.error || 'Failed to upload gallery photo to Cloudinary.' }
    }

    const publicUrl = uploadRes.url

    try {
      await sql`
        INSERT INTO public.gallery_images (
          album_id, title, event_name, date_str, category,
          image_url, caption, alt_text, display_order, status
        ) VALUES (
          ${albumId}, ${title}, ${eventName}, ${dateStr}, ${category},
          ${publicUrl}, ${caption}, ${altText}, ${displayOrder}, ${status}
        )
      `
    } catch (dbErr) {
      deleteFromCloudinary(publicUrl).catch((err) =>
        console.warn('[Gallery Insert Storage Rollback Failed]:', err)
      )
      throw dbErr
    }

    revalidatePath('/admin/gallery')
    revalidatePath('/gallery')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed'
    return { error: msg }
  }
}

/**
 * Updates metadata for an existing gallery image.
 */
export async function updateGalleryImageAction(formData: FormData) {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageGallery) {
      return { error: 'Permission denied: Your account cannot update gallery images.' }
    }

    const id = formData.get('id') as string
    const title = (formData.get('title') as string)?.trim()
    const eventName = (formData.get('event_name') as string)?.trim()
    const dateStr = (formData.get('date_str') as string)?.trim()
    const category = (formData.get('category') as string)?.trim()
    const caption = (formData.get('caption') as string)?.trim() || null
    const altText = (formData.get('alt_text') as string)?.trim() || null
    const albumId = (formData.get('album_id') as string)?.trim() || null
    const displayOrder = parseInt(formData.get('display_order') as string, 10) || 0
    const status = (formData.get('status') as ContentStatus) || 'published'

    if (!id || !title || !eventName) {
      return { error: 'Required fields missing.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const img = store.gallery_images.find((i) => i.id === id)
      if (img) {
        img.title = title
        img.event_name = eventName
        img.date_str = dateStr
        img.category = category
        img.caption = caption
        img.alt_text = altText
        img.album_id = albumId
        img.display_order = displayOrder
        img.status = status
        img.updated_at = new Date().toISOString()
        writeLocalStore(store)
      }
      revalidatePath('/admin/gallery')
      revalidatePath('/gallery')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    await sql`
      UPDATE public.gallery_images
      SET title = ${title},
          event_name = ${eventName},
          date_str = ${dateStr},
          category = ${category},
          caption = ${caption},
          alt_text = ${altText},
          album_id = ${albumId},
          display_order = ${displayOrder},
          status = ${status},
          updated_at = now()
      WHERE id = ${id}
    `

    revalidatePath('/admin/gallery')
    revalidatePath('/gallery')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Update failed'
    return { error: msg }
  }
}

/**
 * Deletes a gallery image.
 */
export async function deleteGalleryImageAction(id: string) {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageGallery) {
      return { error: 'Permission denied: Your account cannot delete gallery images.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      store.gallery_images = store.gallery_images.filter((i) => i.id !== id)
      writeLocalStore(store)
      revalidatePath('/admin/gallery')
      revalidatePath('/gallery')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    // Fetch image_url to clean up from Cloudinary
    const imgRows = await sql`
      SELECT image_url FROM public.gallery_images WHERE id = ${id} LIMIT 1
    `
    const imageUrl = imgRows?.[0]?.image_url
    if (imageUrl && imageUrl.includes('cloudinary.com')) {
      deleteFromCloudinary(imageUrl).catch((err) =>
        console.warn('[Gallery Delete Storage Cleanup Warning]:', err)
      )
    }

    await sql`DELETE FROM public.gallery_images WHERE id = ${id}`

    revalidatePath('/admin/gallery')
    revalidatePath('/gallery')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Deletion failed'
    return { error: msg }
  }
}

/**
 * Creates a new album in gallery_albums.
 */
export async function createGalleryAlbumAction(formData: FormData): Promise<{ success?: boolean; album?: DbGalleryAlbum; error?: string }> {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageGallery) {
      return { error: 'Permission denied: Your account cannot create albums.' }
    }

    const title = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string)?.trim() || null

    if (!title) return { error: 'Album title is required.' }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const newAlb: DbGalleryAlbum = {
        id: `alb-${Date.now()}`,
        title,
        description,
        display_order: 10,
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      store.gallery_albums.push(newAlb)
      writeLocalStore(store)
      revalidatePath('/admin/gallery')
      return { success: true, album: newAlb }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    const rows = await sql`
      INSERT INTO public.gallery_albums (
        title, description, display_order, status
      ) VALUES (
        ${title}, ${description}, 10, 'published'
      )
      RETURNING *
    `

    revalidatePath('/admin/gallery')
    return { success: true, album: (rows as any[])[0] as DbGalleryAlbum }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Album creation failed'
    return { error: msg }
  }
}

/**
 * Deletes an album from gallery_albums.
 */
export async function deleteGalleryAlbumAction(albumId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageGallery) {
      return { error: 'Permission denied: Your account cannot delete albums.' }
    }

    if (!albumId) return { error: 'Album ID is required' }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      store.gallery_albums = store.gallery_albums.filter((a) => a.id !== albumId)
      store.gallery_images = store.gallery_images.map((img) => 
        img.album_id === albumId ? { ...img, album_id: null } : img
      )
      writeLocalStore(store)
      revalidatePath('/admin/gallery')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    await sql`UPDATE public.gallery_images SET album_id = NULL WHERE album_id = ${albumId}`
    await sql`DELETE FROM public.gallery_albums WHERE id = ${albumId}`

    revalidatePath('/admin/gallery')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Album deletion failed'
    return { error: msg }
  }
}

/**
 * Toggles or updates gallery image publication state.
 */
export async function toggleGalleryImageStatusAction(id: string, newStatus: ContentStatus): Promise<{
  success?: boolean
  error?: string
}> {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageGallery) {
      return { error: 'Permission denied: Your account cannot toggle gallery photo status.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const img = store.gallery_images.find((i) => i.id === id)
      if (img) {
        img.status = newStatus
        img.updated_at = new Date().toISOString()
        writeLocalStore(store)
      }
      revalidatePath('/admin/gallery')
      revalidatePath('/gallery')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    await sql`
      UPDATE public.gallery_images
      SET status = ${newStatus}, updated_at = now()
      WHERE id = ${id}
    `

    revalidatePath('/admin/gallery')
    revalidatePath('/gallery')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Status update failed'
    return { error: msg }
  }
}
