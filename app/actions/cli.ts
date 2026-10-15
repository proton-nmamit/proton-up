'use server'

import { getPublicMembers, getPublicEvents, getPublicGallery } from '@/lib/data-service'
import { PublicMember } from '@/lib/types/database'
import { ProtonEvent, GalleryItem } from '@/lib/proton-data'

export interface CliData {
  members: PublicMember[]
  events: ProtonEvent[]
  gallery: GalleryItem[]
}

/**
 * Server action providing live sanitized backend data for PROTON Interactive CLI / Terminal.
 */
export async function getCliDataAction(): Promise<CliData> {
  try {
    const [members, events, gallery] = await Promise.all([
      getPublicMembers(),
      getPublicEvents(),
      getPublicGallery(),
    ])
    return {
      members: members || [],
      events: events || [],
      gallery: gallery || [],
    }
  } catch (error) {
    console.error('[CLI Data Error] Failed to fetch backend records for terminal:', error)
    return {
      members: [],
      events: [],
      gallery: [],
    }
  }
}
