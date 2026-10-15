'use server'

import { sql, isDbConfigured } from '@/lib/db'
import { requireAdminSession } from '@/lib/auth/session'
import { DbDesignation } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { isLocalDevMode, readLocalStore, writeLocalStore } from '@/lib/local-store'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'

export interface DesignationWithCount extends DbDesignation {
  member_count: number
}

/**
 * Retrieves all designations with assigned member counts.
 */
export async function getAdminDesignationsWithCounts(): Promise<{
  designations: DesignationWithCount[]
  error?: string
}> {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageDesignations) {
      return { designations: [], error: 'Permission denied: Access restricted.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const countMap: Record<string, number> = {}
      for (const p of store.profiles) {
        if (p.designation_id) {
          countMap[p.designation_id] = (countMap[p.designation_id] || 0) + 1
        }
      }
      const designations = [...store.designations]
        .sort((a, b) => a.display_order - b.display_order)
        .map((d) => ({
          ...d,
          member_count: countMap[d.id] || 0,
        }))
      return { designations }
    }

    if (!isDbConfigured()) return { designations: [], error: 'Database service unconfigured' }

    const [designations, profileCounts] = await Promise.all([
      sql`SELECT * FROM public.designations ORDER BY display_order ASC`,
      sql`SELECT designation_id, count(*)::int as count FROM public.profiles WHERE designation_id IS NOT NULL GROUP BY designation_id`,
    ])

    const countMap: Record<string, number> = {}
    for (const pc of profileCounts as any[]) {
      countMap[pc.designation_id] = pc.count || 0
    }

    const result: DesignationWithCount[] = (designations as any[] || []).map((d: any) => ({
      ...d,
      member_count: countMap[d.id] || 0,
    }))

    return { designations: result }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unauthorized'
    return { designations: [], error: msg }
  }
}

/**
 * Creates a new designation.
 */
export async function createDesignationAction(formData: FormData) {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageDesignations) {
      return { error: 'Permission denied: Cannot create designations.' }
    }

    const name = (formData.get('name') as string)?.trim()
    const category = (formData.get('category') as string)?.trim().toLowerCase()
    const categoryLabel = (formData.get('category_label') as string)?.trim()
    const rawOrder = formData.get('display_order') as string
    let displayOrder = rawOrder ? parseInt(rawOrder, 10) : NaN
    const isCore = formData.get('is_core') === 'true'
    const isActive = formData.get('is_active') !== 'false'

    if (!name || !category || !categoryLabel) {
      return { error: 'Designation name, category key, and category label are required.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      if (isNaN(displayOrder)) {
        displayOrder = store.designations.length > 0
          ? Math.max(...store.designations.map((d) => d.display_order || 0)) + 1
          : 1
      }
      const newDes: DbDesignation = {
        id: `des-${Date.now()}`,
        name,
        category,
        category_label: categoryLabel,
        display_order: displayOrder,
        is_core: isCore,
        is_active: isActive,
      }
      store.designations.push(newDes)
      writeLocalStore(store)
      revalidatePath('/admin/designations')
      revalidatePath('/teams')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    if (isNaN(displayOrder)) {
      const maxRows = await sql`SELECT max(display_order)::int as max_order FROM public.designations`
      displayOrder = ((maxRows as any[])[0]?.max_order || 0) + 1
    }

    await sql`
      INSERT INTO public.designations (
        name, category, category_label, display_order, is_core, is_active
      ) VALUES (
        ${name}, ${category}, ${categoryLabel}, ${displayOrder}, ${isCore}, ${isActive}
      )
    `

    revalidatePath('/admin/designations')
    revalidatePath('/teams')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Creation failed'
    return { error: msg }
  }
}

/**
 * Updates an existing designation.
 */
export async function updateDesignationAction(formData: FormData) {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageDesignations) {
      return { error: 'Permission denied: Cannot edit designations.' }
    }

    const id = formData.get('id') as string
    const name = (formData.get('name') as string)?.trim()
    const category = (formData.get('category') as string)?.trim().toLowerCase()
    const categoryLabel = (formData.get('category_label') as string)?.trim()
    const rawOrder = formData.get('display_order') as string
    const displayOrder = rawOrder ? parseInt(rawOrder, 10) : undefined
    const isCore = formData.get('is_core') === 'true'
    const isActive = formData.get('is_active') === 'true'

    if (!id || !name || !category || !categoryLabel) {
      return { error: 'Required fields are missing.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const des = store.designations.find((d) => d.id === id)
      if (des) {
        des.name = name
        des.category = category
        des.category_label = categoryLabel
        if (displayOrder !== undefined && !isNaN(displayOrder)) {
          des.display_order = displayOrder
        }
        des.is_core = isCore
        des.is_active = isActive
        des.updated_at = new Date().toISOString()
        writeLocalStore(store)
      }
      revalidatePath('/admin/designations')
      revalidatePath('/teams')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    if (displayOrder !== undefined && !isNaN(displayOrder)) {
      await sql`
        UPDATE public.designations
        SET name = ${name},
            category = ${category},
            category_label = ${categoryLabel},
            display_order = ${displayOrder},
            is_core = ${isCore},
            is_active = ${isActive},
            updated_at = now()
        WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE public.designations
        SET name = ${name},
            category = ${category},
            category_label = ${categoryLabel},
            is_core = ${isCore},
            is_active = ${isActive},
            updated_at = now()
        WHERE id = ${id}
      `
    }

    revalidatePath('/admin/designations')
    revalidatePath('/teams')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Update failed'
    return { error: msg }
  }
}

/**
 * Updates the display_order of all designations in bulk (for Drag & Drop).
 */
export async function reorderAllDesignationsAction(items: { id: string; display_order: number }[]) {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageDesignations) {
      return { error: 'Permission denied: Cannot reorder designations.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      for (const item of items) {
        const des = store.designations.find((d) => d.id === item.id)
        if (des) {
          des.display_order = item.display_order
          des.updated_at = new Date().toISOString()
        }
      }
      store.designations.sort((a, b) => a.display_order - b.display_order)
      writeLocalStore(store)
      revalidatePath('/admin/designations')
      revalidatePath('/teams')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    // Execute updates in parallel against Neon
    await Promise.all(
      items.map((item) =>
        sql`
          UPDATE public.designations
          SET display_order = ${item.display_order}, updated_at = now()
          WHERE id = ${item.id}
        `
      )
    )

    revalidatePath('/admin/designations')
    revalidatePath('/teams')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Bulk reordering failed'
    return { error: msg }
  }
}

/**
 * Updates the display_order of a designation.
 */
export async function reorderDesignationAction(id: string, newOrder: number) {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageDesignations) {
      return { error: 'Permission denied: Cannot reorder designations.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const des = store.designations.find((d) => d.id === id)
      if (des) {
        des.display_order = newOrder
        des.updated_at = new Date().toISOString()
        writeLocalStore(store)
      }
      revalidatePath('/admin/designations')
      revalidatePath('/teams')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    await sql`
      UPDATE public.designations
      SET display_order = ${newOrder}, updated_at = now()
      WHERE id = ${id}
    `

    revalidatePath('/admin/designations')
    revalidatePath('/teams')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Reordering failed'
    return { error: msg }
  }
}

/**
 * Safely deletes a designation only if 0 members are assigned to it.
 */
export async function deleteDesignationAction(id: string) {
  try {
    const { user } = await requireAdminSession()
    const perms = getAdminPermissions(user.email)
    if (!perms.canManageDesignations) {
      return { error: 'Permission denied: Cannot delete designations.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const count = store.profiles.filter((p) => p.designation_id === id).length
      if (count > 0) {
        return {
          error: `Cannot delete: ${count} member(s) are currently assigned to this designation. Please reassign them or deactivate the designation instead.`,
        }
      }
      store.designations = store.designations.filter((d) => d.id !== id)
      writeLocalStore(store)
      revalidatePath('/admin/designations')
      revalidatePath('/teams')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database service unavailable' }

    // Check member assignments
    const countRows = await sql`
      SELECT count(*)::int as count FROM public.profiles WHERE designation_id = ${id}
    `
    const count = (countRows as any[])[0]?.count || 0

    if (count > 0) {
      return {
        error: `Cannot delete: ${count} member(s) are currently assigned to this designation. Please reassign them or deactivate the designation instead.`,
      }
    }

    await sql`DELETE FROM public.designations WHERE id = ${id}`

    revalidatePath('/admin/designations')
    revalidatePath('/teams')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Deletion failed'
    return { error: msg }
  }
}
