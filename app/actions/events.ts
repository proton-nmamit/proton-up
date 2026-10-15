'use server'

import { sql, isDbConfigured } from '@/lib/db'
import { requireAdminSession } from '@/lib/auth/session'
import { DbEvent, ContentStatus } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { isLocalDevMode, readLocalStore, writeLocalStore } from '@/lib/local-store'
import { logActivity } from '@/lib/audit-service'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'
import { uploadToCloudinary, deleteFromCloudinary, STORAGE_PRESETS } from '@/lib/storage/cloudinary'

const MAX_POSTER_SIZE = STORAGE_PRESETS.EVENT_POSTERS.maxSizeBytes // 5 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Retrieves all events for administrative management.
 */
export async function getAdminEventsList(): Promise<{
  events: DbEvent[]
  error?: string
}> {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageEvents) {
      return { events: [], error: 'Permission denied: Cannot access events.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      return { events: store.events }
    }

    if (!isDbConfigured()) return { events: [], error: 'Database service unconfigured' }

    const data = await sql`
      SELECT * FROM public.events
      ORDER BY event_date DESC
    `

    return { events: (data as any[] as DbEvent[]) || [] }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unauthorized'
    return { events: [], error: msg }
  }
}

/**
 * Creates a new event record with poster upload.
 */
export async function createEventAction(formData: FormData) {
  try {
    const { user, profile } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageEvents) {
      return { error: 'Permission denied: Your account cannot create events.' }
    }

    const title = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const category = (formData.get('category') as string)?.trim().toLowerCase() || 'technical'
    const categoryLabel = (formData.get('category_label') as string)?.trim() || 'Technical Event'
    // MANDATORY SECURITY RULE: All newly submitted/uploaded events MUST be saved as 'draft'
    // and require explicit administrator approval before being published to the public portal.
    const status: ContentStatus = 'draft'
    const timelineStatus = ((formData.get('timeline_status') as string) || 'upcoming') as 'completed' | 'upcoming' | 'ongoing' | 'postponed'
    const eventDate = formData.get('event_date') as string
    const formattedDate = (formData.get('formatted_date') as string)?.trim() || eventDate
    const eventTime = (formData.get('event_time') as string)?.trim() || '10:00 AM IST'
    const location = (formData.get('location') as string)?.trim() || 'Campus Hub'
    const registrationOpen = formData.get('registration_open') === 'true'
    const registrationLink = (formData.get('registration_link') as string)?.trim() || '#'
    const isFeatured = formData.get('is_featured') === 'true'
    const highlightsStr = (formData.get('highlights') as string)?.trim() || ''

    if (!title || !description || !eventDate) {
      return { error: 'Title, description, and event date are required.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      let slug = slugify(title)
      if (store.events.some((e) => e.slug === slug)) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`
      }
      let posterUrl = (formData.get('poster_url_fallback') as string)?.trim() || '/images/hero-1.png'
      const posterFile = formData.get('poster_file') as File | null
      if (posterFile && posterFile.size > 0) {
        const buffer = Buffer.from(await posterFile.arrayBuffer())
        posterUrl = `data:${posterFile.type};base64,${buffer.toString('base64')}`
      }
      const highlights = highlightsStr
        ? highlightsStr.split('\n').map((h) => h.trim()).filter(Boolean)
        : []
      const newEvent: DbEvent = {
        id: `ev-${Date.now()}`,
        slug,
        title,
        description,
        category,
        category_label: categoryLabel,
        status,
        timeline_status: timelineStatus,
        event_date: eventDate,
        formatted_date: formattedDate,
        event_time: eventTime,
        location,
        poster_url: posterUrl,
        registration_open: registrationOpen,
        registration_link: registrationLink,
        highlights,
        is_featured: isFeatured,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      store.events.unshift(newEvent)
      writeLocalStore(store)
      revalidatePath('/admin/events')
      revalidatePath('/events')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    // Poster upload validation
    let posterUrl = (formData.get('poster_url_fallback') as string)?.trim() || '/images/hero-1.png'
    const posterFile = formData.get('poster_file') as File | null

    let slug = slugify(title)
    // Check slug collision
    const existingSlug = await sql`
      SELECT id FROM public.events WHERE slug = ${slug} LIMIT 1
    `

    if (existingSlug && existingSlug.length > 0) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    if (posterFile && posterFile.size > 0) {
      if (posterFile.size > MAX_POSTER_SIZE) {
        return { error: 'Poster image file exceeds maximum allowed size of 5 MB.' }
      }
      if (!ALLOWED_MIME.includes(posterFile.type)) {
        return { error: 'Invalid poster image format. Only JPEG, PNG, and WebP are allowed.' }
      }

      const buffer = Buffer.from(await posterFile.arrayBuffer())
      const uploadRes = await uploadToCloudinary({
        buffer,
        folder: `${STORAGE_PRESETS.EVENT_POSTERS.folder}/${slug}`,
        filename: `poster_${Date.now()}`,
        maxSizeBytes: MAX_POSTER_SIZE,
        maxWidth: STORAGE_PRESETS.EVENT_POSTERS.maxWidth,
        maxHeight: STORAGE_PRESETS.EVENT_POSTERS.maxHeight,
        maxPixels: STORAGE_PRESETS.EVENT_POSTERS.maxPixels,
        quality: STORAGE_PRESETS.EVENT_POSTERS.quality,
        allowedFormats: ['jpeg', 'png', 'webp'],
        tags: ['event-poster', slug],
      })

      if (!uploadRes.success || !uploadRes.url) {
        return { error: uploadRes.error || 'Failed to upload event poster to Cloudinary.' }
      }

      posterUrl = uploadRes.url
    }

    const highlights = highlightsStr
      ? highlightsStr.split('\n').map((h) => h.trim()).filter(Boolean)
      : []

    try {
      await sql`
        INSERT INTO public.events (
          slug, title, description, category, category_label, status,
          timeline_status, event_date, formatted_date, event_time, location,
          poster_url, registration_open, registration_link, highlights,
          is_featured
        ) VALUES (
          ${slug}, ${title}, ${description}, ${category}, ${categoryLabel}, ${status},
          ${timelineStatus}, ${eventDate}, ${formattedDate}, ${eventTime}, ${location},
          ${posterUrl}, ${registrationOpen}, ${registrationLink}, ${highlights},
          ${isFeatured}
        )
      `
    } catch (dbErr: any) {
      if (posterUrl && posterUrl.includes('cloudinary.com')) {
        await deleteFromCloudinary(posterUrl).catch(() => {})
      }
      throw dbErr
    }

    await logActivity({
      action: 'EVENT_CREATED',
      actorId: user.id,
      actorEmail: user.email || 'admin@proton.cyber',
      actorName: profile?.full_name || 'Administrator',
      actorRole: profile?.role || 'admin',
      targetName: title,
      targetType: 'event',
      details: { eventDate, category, location, isFeatured },
    })

    revalidatePath('/admin/events')
    revalidatePath('/admin/logs')
    revalidatePath('/events')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Event creation failed'
    return { error: msg }
  }
}

/**
 * Updates an existing event.
 */
export async function updateEventAction(formData: FormData) {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageEvents) {
      return { error: 'Permission denied: Your account cannot edit events.' }
    }

    const id = formData.get('id') as string
    const title = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const category = (formData.get('category') as string)?.trim().toLowerCase()
    const categoryLabel = (formData.get('category_label') as string)?.trim()
    let status = (formData.get('status') as ContentStatus) || 'draft'
    if (status === 'published' && !perms.canPublishEvents) {
      status = 'draft'
    }
    const timelineStatus = ((formData.get('timeline_status') as string) || 'upcoming') as 'completed' | 'upcoming' | 'ongoing' | 'postponed'
    const eventDate = formData.get('event_date') as string
    const formattedDate = (formData.get('formatted_date') as string)?.trim()
    const eventTime = (formData.get('event_time') as string)?.trim()
    const location = (formData.get('location') as string)?.trim()
    const registrationOpen = formData.get('registration_open') === 'true'
    const registrationLink = (formData.get('registration_link') as string)?.trim()
    const isFeatured = formData.get('is_featured') === 'true'
    const highlightsStr = (formData.get('highlights') as string)?.trim() || ''

    if (!id || !title || !description || !eventDate) {
      return { error: 'Required fields missing.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const ev = store.events.find((e) => e.id === id)
      if (ev) {
        ev.title = title
        ev.description = description
        ev.category = category
        ev.category_label = categoryLabel
        ev.status = status
        ev.timeline_status = timelineStatus
        ev.event_date = eventDate
        ev.formatted_date = formattedDate
        ev.event_time = eventTime
        ev.location = location
        ev.registration_open = registrationOpen
        ev.registration_link = registrationLink
        ev.is_featured = isFeatured
        ev.highlights = highlightsStr ? highlightsStr.split('\n').map((h) => h.trim()).filter(Boolean) : []
        ev.updated_at = new Date().toISOString()
        const posterFile = formData.get('poster_file') as File | null
        if (posterFile && posterFile.size > 0) {
          const buffer = Buffer.from(await posterFile.arrayBuffer())
          ev.poster_url = `data:${posterFile.type};base64,${buffer.toString('base64')}`
        }
        writeLocalStore(store)
      }
      revalidatePath('/admin/events')
      revalidatePath('/events')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    // Fetch existing event for slug and old poster URL
    const existingEvRows = await sql`
      SELECT slug, poster_url FROM public.events WHERE id = ${id} LIMIT 1
    `
    const existingEv = existingEvRows?.[0]
    const eventSlug = existingEv?.slug || slugify(title)
    const oldPosterUrl = existingEv?.poster_url

    let newPosterUrl: string | null = null
    // Optional new poster upload
    const posterFile = formData.get('poster_file') as File | null
    if (posterFile && posterFile.size > 0) {
      if (posterFile.size > MAX_POSTER_SIZE) {
        return { error: 'Poster image file exceeds maximum allowed size of 5 MB.' }
      }
      if (!ALLOWED_MIME.includes(posterFile.type)) {
        return { error: 'Invalid poster image format. Only JPEG, PNG, and WebP are allowed.' }
      }

      const buffer = Buffer.from(await posterFile.arrayBuffer())
      const uploadRes = await uploadToCloudinary({
        buffer,
        folder: `${STORAGE_PRESETS.EVENT_POSTERS.folder}/${eventSlug}`,
        filename: `poster_${Date.now()}`,
        maxSizeBytes: MAX_POSTER_SIZE,
        maxWidth: STORAGE_PRESETS.EVENT_POSTERS.maxWidth,
        maxHeight: STORAGE_PRESETS.EVENT_POSTERS.maxHeight,
        maxPixels: STORAGE_PRESETS.EVENT_POSTERS.maxPixels,
        quality: STORAGE_PRESETS.EVENT_POSTERS.quality,
        allowedFormats: ['jpeg', 'png', 'webp'],
        tags: ['event-poster', eventSlug],
      })

      if (!uploadRes.success || !uploadRes.url) {
        return { error: uploadRes.error || 'Failed to upload event poster to Cloudinary.' }
      }

      newPosterUrl = uploadRes.url
    }

    const highlights = highlightsStr ? highlightsStr.split('\n').map((h) => h.trim()).filter(Boolean) : []

    try {
      if (newPosterUrl) {
        await sql`
          UPDATE public.events
          SET title = ${title},
              description = ${description},
              category = ${category},
              category_label = ${categoryLabel},
              status = ${status},
              timeline_status = ${timelineStatus},
              event_date = ${eventDate},
              formatted_date = ${formattedDate},
              event_time = ${eventTime},
              location = ${location},
              registration_open = ${registrationOpen},
              registration_link = ${registrationLink},
              is_featured = ${isFeatured},
              highlights = ${highlights},
              poster_url = ${newPosterUrl},
              updated_at = now()
          WHERE id = ${id}
        `
      } else {
        await sql`
          UPDATE public.events
          SET title = ${title},
              description = ${description},
              category = ${category},
              category_label = ${categoryLabel},
              status = ${status},
              timeline_status = ${timelineStatus},
              event_date = ${eventDate},
              formatted_date = ${formattedDate},
              event_time = ${eventTime},
              location = ${location},
              registration_open = ${registrationOpen},
              registration_link = ${registrationLink},
              is_featured = ${isFeatured},
              highlights = ${highlights},
              updated_at = now()
          WHERE id = ${id}
        `
      }
    } catch (dbErr: any) {
      // If DB update fails, roll back newly uploaded asset
      if (newPosterUrl) {
        await deleteFromCloudinary(newPosterUrl).catch(() => {})
      }
      throw dbErr
    }

    // Clean up old poster from Cloudinary only after DB update is confirmed
    if (newPosterUrl && oldPosterUrl && oldPosterUrl.includes('cloudinary.com') && oldPosterUrl !== newPosterUrl) {
      deleteFromCloudinary(oldPosterUrl).catch((err) =>
        console.warn('[Event Poster Cleanup Warning]:', err)
      )
    }

    revalidatePath('/admin/events')
    revalidatePath('/events')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Event update failed'
    return { error: msg }
  }
}

/**
 * Toggles event publication state.
 */
export async function toggleEventStatusAction(id: string, newStatus: ContentStatus) {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageEvents) {
      return { error: 'Permission denied: Your account cannot toggle event status.' }
    }

    if (newStatus === 'published' && !perms.canPublishEvents) {
      return { error: 'Permission denied: Event publication requires administrator approval (President, Branch Captain, Tech Team, or Super Admin).' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const ev = store.events.find((e) => e.id === id)
      if (ev) {
        ev.status = newStatus
        ev.updated_at = new Date().toISOString()
        writeLocalStore(store)
      }
      revalidatePath('/admin/events')
      revalidatePath('/events')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    await sql`
      UPDATE public.events
      SET status = ${newStatus}, updated_at = now()
      WHERE id = ${id}
    `

    revalidatePath('/admin/events')
    revalidatePath('/events')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Status toggle failed'
    return { error: msg }
  }
}

/**
 * Deletes an event.
 */
export async function deleteEventAction(id: string) {
  try {
    const { user, profile } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageEvents) {
      return { error: 'Permission denied: Your account cannot delete events.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      store.events = store.events.filter((e) => e.id !== id)
      writeLocalStore(store)

      await logActivity({
        action: 'EVENT_DELETED',
        actorId: user.id,
        actorEmail: user.email || 'admin@proton.cyber',
        actorName: profile?.full_name || 'Administrator',
        actorRole: profile?.role || 'admin',
        targetId: id,
        targetType: 'event',
      })

      revalidatePath('/admin/events')
      revalidatePath('/admin/logs')
      revalidatePath('/events')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    // Fetch poster_url to clean up from Cloudinary
    const evRows = await sql`
      SELECT poster_url FROM public.events WHERE id = ${id} LIMIT 1
    `
    const posterUrl = evRows?.[0]?.poster_url
    if (posterUrl && posterUrl.includes('cloudinary.com')) {
      deleteFromCloudinary(posterUrl).catch((err) =>
        console.warn('[Event Delete Storage Cleanup Warning]:', err)
      )
    }

    await sql`DELETE FROM public.events WHERE id = ${id}`

    await logActivity({
      action: 'EVENT_DELETED',
      actorId: user.id,
      actorEmail: user.email || 'admin@proton.cyber',
      actorName: profile?.full_name || 'Administrator',
      actorRole: profile?.role || 'admin',
      targetId: id,
      targetType: 'event',
    })

    revalidatePath('/admin/events')
    revalidatePath('/admin/logs')
    revalidatePath('/events')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Deletion failed'
    return { error: msg }
  }
}
