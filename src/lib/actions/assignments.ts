'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isAdmin } from './auth'
import type { ClientTaskAssignment } from '@/lib/database.types'

/**
 * Get all default assignments for a client
 */
export async function getClientAssignments(clientId: string): Promise<ClientTaskAssignment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_task_assignments')
    .select('*')
    .eq('client_id', clientId)

  if (error) throw error
  return data || []
}

/**
 * Get assignments with template and assignee details
 */
export async function getClientAssignmentsWithDetails(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_task_assignments')
    .select(`
      *,
      template:template_id (id, title, role, parent_type),
      assignee:assignee_id (id, email, avatar_url)
    `)
    .eq('client_id', clientId)

  if (error) throw error
  return data || []
}

/**
 * Set or update a default assignment for a client + template
 * Pass null for assigneeId to remove the assignment
 */
export async function setClientAssignment(
  clientId: string,
  templateId: string,
  assigneeId: string | null
) {
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Only admins can manage assignments' }
  }

  const supabase = await createClient()

  if (assigneeId === null) {
    // Remove assignment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('client_task_assignments') as any)
      .delete()
      .eq('client_id', clientId)
      .eq('template_id', templateId)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Upsert assignment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('client_task_assignments') as any)
      .upsert(
        {
          client_id: clientId,
          template_id: templateId,
          assignee_id: assigneeId,
        },
        {
          onConflict: 'client_id,template_id',
        }
      )

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: true }
}
