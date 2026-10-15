import { sql, isDbConfigured } from '@/lib/db'
import { TeamMember, ProtonEvent, GalleryItem } from '@/lib/proton-data'
import { PublicMember, DbEvent, DbGalleryImage } from '@/lib/types/database'
import { isLocalDevMode, readLocalStore } from '@/lib/local-store'

function isSystemAdminAccount(p: any): boolean {
  if (p.role === 'admin' || p.role === 'super_admin') return true
  const name = (p.full_name || '').toLowerCase().trim()
  return (
    name.startsWith('proton ') ||
    name === 'proton' ||
    name === 'proton administrator' ||
    name === 'proton president' ||
    name === 'proton vice president' ||
    name === 'proton branch captain' ||
    name === 'proton technical head' ||
    name === 'proton tech team'
  )
}

/**
 * Retrieves public approved members for Teams page.
 * Explicitly projects ONLY non-sensitive, public fields and excludes administrative privilege accounts.
 */
export async function getPublicMembers(): Promise<PublicMember[]> {
  try {
    if (isLocalDevMode()) {
      const store = readLocalStore()
      const approved = store.profiles.filter((p) => p.status === 'approved' && !isSystemAdminAccount(p))
      const sanitized: PublicMember[] = approved.map((p) => {
        const des = store.designations.find((d) => d.id === p.designation_id) || p.designations
        return {
          id: p.id,
          full_name: p.full_name,
          role: des?.name || p.custom_role_text || 'Member',
          category: des?.category || 'technical',
          category_label: des?.category_label || 'Technical Wing',
          display_order: des?.display_order ?? 999,
          department: p.department || null,
          avatar_url: p.avatar_url || null,
          bio: p.bio || null,
          branch: p.branch || null,
          year: p.year || null,
          joining_year: p.joining_year || null,
          github_url: p.github_url || null,
          linkedin_url: p.linkedin_url || null,
          instagram_url: p.instagram_url || null,
          portfolio_url: p.portfolio_url || null,
          is_core: des?.is_core ?? false,
        }
      })
      return sanitized.sort((a, b) => {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order
        }
        return a.full_name.localeCompare(b.full_name)
      })
    }

    if (!isDbConfigured()) {
      return []
    }

    // Query approved profiles with their designation hierarchy from Neon
    const data = await sql`
      SELECT 
        p.id,
        p.role,
        p.full_name,
        p.branch,
        p.year,
        p.joining_year,
        p.department,
        p.avatar_url,
        p.bio,
        p.github_url,
        p.linkedin_url,
        p.instagram_url,
        p.portfolio_url,
        p.custom_role_text,
        d.id AS designation_id,
        d.name AS designation_name,
        d.category AS designation_category,
        d.category_label AS designation_category_label,
        d.display_order AS designation_display_order,
        d.is_core AS designation_is_core
      FROM public.profiles p
      LEFT JOIN public.designations d ON p.designation_id = d.id
      WHERE p.status = 'approved'
    `

    if (!data || data.length === 0) {
      return []
    }

    // Exclude system admin privilege accounts (admin is an access privilege, not a public roster card)
    const clubMembers = (data as any[]).filter((p: any) => !isSystemAdminAccount(p))

    // Format & sort by designation display_order
    const sanitized: PublicMember[] = clubMembers.map((p: any) => {
      return {
        id: p.id,
        full_name: p.full_name,
        role: p.designation_name || p.custom_role_text || 'Member',
        category: p.designation_category || 'technical',
        category_label: p.designation_category_label || 'Technical Wing',
        display_order: p.designation_display_order ?? 999,
        department: p.department || null,
        avatar_url: p.avatar_url || null,
        bio: p.bio || null,
        branch: p.branch || null,
        year: p.year || null,
        joining_year: p.joining_year || null,
        github_url: p.github_url || null,
        linkedin_url: p.linkedin_url || null,
        instagram_url: p.instagram_url || null,
        portfolio_url: p.portfolio_url || null,
        is_core: p.designation_is_core ?? false,
      }
    })

    // Sort by display_order ascending, then full_name ascending
    return sanitized.sort((a, b) => {
      if (a.display_order !== b.display_order) {
        return a.display_order - b.display_order
      }
      return a.full_name.localeCompare(b.full_name)
    })
  } catch (err) {
    console.error('[PROTON CMS Exception] getPublicMembers crashed:', err)
    return []
  }
}

/**
 * Retrieves public published events.
 */
export async function getPublicEvents(): Promise<ProtonEvent[]> {
  try {
    if (isLocalDevMode()) {
      const store = readLocalStore()
      const published = store.events.filter((e) => e.status === 'published')
      return published.map((ev: any) => ({
        id: ev.slug || ev.id,
        title: ev.title,
        description: ev.description,
        category: ev.category as any,
        categoryLabel: ev.category_label,
        status: ev.timeline_status || 'upcoming',
        date: ev.event_date,
        formattedDate: ev.formatted_date,
        time: ev.event_time,
        location: ev.location,
        imageUrl: ev.poster_url,
        registrationOpen: ev.registration_open,
        registrationLink: ev.registration_link || '#',
        highlights: ev.highlights || [],
      }))
    }

    if (!isDbConfigured()) {
      return []
    }

    const data = await sql`
      SELECT * FROM public.events
      WHERE status = 'published'
      ORDER BY event_date DESC
    `

    if (!data || data.length === 0) {
      return []
    }

    return (data as any[]).map((ev: any) => ({
      id: ev.slug || ev.id,
      title: ev.title,
      description: ev.description,
      category: ev.category as any,
      categoryLabel: ev.category_label,
      status: ev.timeline_status || 'completed',
      date: ev.event_date,
      formattedDate: ev.formatted_date,
      time: ev.event_time,
      location: ev.location,
      imageUrl: ev.poster_url,
      registrationOpen: ev.registration_open,
      registrationLink: ev.registration_link || '#',
      highlights: ev.highlights || [],
      isFeatured: ev.is_featured ?? false,
    }))
  } catch (err) {
    console.error('[PROTON CMS Exception] getPublicEvents crashed:', err)
    return []
  }
}

/**
 * Retrieves public published gallery items.
 */
export async function getPublicGallery(): Promise<GalleryItem[]> {
  try {
    if (isLocalDevMode()) {
      const store = readLocalStore()
      const published = store.gallery_images
        .filter((g) => g.status === 'published')
        .sort((a, b) => a.display_order - b.display_order)
      return published.map((item: any) => ({
        id: item.id,
        title: item.title,
        eventName: item.event_name,
        date: item.date_str,
        category: item.category,
        imageUrl: item.image_url,
        description: item.caption || item.alt_text || '',
      }))
    }

    if (!isDbConfigured()) {
      return []
    }

    const data = await sql`
      SELECT * FROM public.gallery_images
      WHERE status = 'published'
      ORDER BY display_order ASC
    `

    if (!data || data.length === 0) {
      return []
    }

    return (data as any[]).map((item: any) => ({
      id: item.id,
      title: item.title,
      eventName: item.event_name,
      date: item.date_str,
      category: item.category,
      imageUrl: item.image_url,
      description: item.caption || item.alt_text || '',
    }))
  } catch (err) {
    console.error('[PROTON CMS Exception] getPublicGallery crashed:', err)
    return []
  }
}

/**
 * Retrieves active designations ordered by hierarchy.
 */
export async function getDesignationsList(): Promise<import('@/lib/types/database').DbDesignation[]> {
  try {
    if (isLocalDevMode()) {
      const store = readLocalStore()
      return store.designations
        .filter((d) => d.is_active)
        .sort((a, b) => a.display_order - b.display_order)
    }

    if (!isDbConfigured()) {
      return []
    }

    const data = await sql`
      SELECT * FROM public.designations
      WHERE is_active = true
      ORDER BY display_order ASC
    `

    return (data as any) || []
  } catch (err) {
    console.error('[PROTON CMS Exception] getDesignationsList crashed:', err)
    return []
  }
}
