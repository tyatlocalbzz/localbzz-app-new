'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Task } from '@/lib/database.types'

export async function getTasks(parentId: string, parentType: 'cycle' | 'shoot') {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('parent_id', parentId)
    .eq('parent_type', parentType)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export async function getClientTasks(clientId: string): Promise<Task[]> {
  const supabase = await createClient()

  // Get all cycles for this client
  const { data: cycles } = await supabase
    .from('cycles')
    .select('id')
    .eq('client_id', clientId)

  // Get all shoots for this client
  const { data: shoots } = await supabase
    .from('shoots')
    .select('id')
    .eq('client_id', clientId)

  const typedCycles = cycles as { id: string }[] | null
  const typedShoots = shoots as { id: string }[] | null
  const cycleIds = typedCycles?.map((c) => c.id) || []
  const shootIds = typedShoots?.map((s) => s.id) || []
  const allParentIds = [...cycleIds, ...shootIds]

  if (allParentIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .in('parent_id', allParentIds)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data as Task[]) || []
}

export async function updateTaskStatus(
  taskId: string,
  status: 'todo' | 'done',
  clientId: string
) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tasks') as any)
    .update({ status })
    .eq('id', taskId)

  if (error) {
    return { error: error.message }
  }

  // Revalidate paths to update the UI
  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getPendingTasks() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'todo')
    .order('sort_order', { ascending: true })
    .limit(50)

  if (error) throw error
  return data
}

/**
 * Update task assignee
 */
export async function updateTaskAssignee(
  taskId: string,
  assigneeId: string | null,
  clientId: string
) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tasks') as any)
    .update({ assignee_id: assigneeId })
    .eq('id', taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath('/dashboard')
  return { success: true }
}
