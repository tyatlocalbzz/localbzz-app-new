'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TaskTemplate } from '@/lib/database.types'

export async function getGlobalTemplates(): Promise<TaskTemplate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .is('client_id', null)
    .eq('is_active', true)
    .order('parent_type')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data as TaskTemplate[]) || []
}

export async function getTemplatesForClient(
  clientId: string,
  parentType: 'cycle' | 'shoot'
): Promise<TaskTemplate[]> {
  const supabase = await createClient()

  // First check for client-specific templates
  const { data: clientTemplates, error: clientError } = await supabase
    .from('task_templates')
    .select('*')
    .eq('client_id', clientId)
    .eq('parent_type', parentType)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (clientError) throw clientError

  // If client has custom templates, use those
  if (clientTemplates && clientTemplates.length > 0) {
    return clientTemplates as TaskTemplate[]
  }

  // Otherwise fall back to global templates
  const { data: globalTemplates, error: globalError } = await supabase
    .from('task_templates')
    .select('*')
    .is('client_id', null)
    .eq('parent_type', parentType)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (globalError) throw globalError
  return (globalTemplates as TaskTemplate[]) || []
}

export async function getTemplatesByType(
  parentType: 'cycle' | 'shoot'
): Promise<TaskTemplate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .is('client_id', null)
    .eq('parent_type', parentType)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data as TaskTemplate[]) || []
}

export async function createTemplate(
  parentType: 'cycle' | 'shoot',
  title: string,
  role: 'strategist' | 'scheduler' | 'shooter' | 'editor',
  sortOrder: number
) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('task_templates') as any).insert({
    client_id: null,
    parent_type: parentType,
    title,
    role,
    sort_order: sortOrder,
    is_active: true,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateTemplate(
  id: string,
  updates: {
    title?: string
    role?: 'strategist' | 'scheduler' | 'shooter' | 'editor'
    sort_order?: number
    is_active?: boolean
    days_offset?: number
  }
) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('task_templates') as any)
    .update(updates)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('task_templates') as any)
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function reorderTemplates(templateIds: string[]) {
  const supabase = await createClient()

  // Update sort_order for each template
  for (let i = 0; i < templateIds.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('task_templates') as any)
      .update({ sort_order: i + 1 })
      .eq('id', templateIds[i])

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
