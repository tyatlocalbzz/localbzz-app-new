'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { normalizeToFirstOfMonth, formatDateForDB } from '@/lib/utils'
import type { Cycle } from '@/lib/database.types'

export async function getCycles(clientId: string): Promise<Cycle[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('client_id', clientId)
    .order('month', { ascending: false })

  if (error) throw error
  return (data as Cycle[]) || []
}

export async function getCurrentCycle(clientId: string): Promise<Cycle | null> {
  const supabase = await createClient()

  // Simply return the most recent cycle
  const { data, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('client_id', clientId)
    .order('month', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as Cycle | null
}

export async function startNewCycle(clientId: string, month: Date) {
  const supabase = await createClient()

  // Normalize to first of month
  const normalizedMonth = formatDateForDB(normalizeToFirstOfMonth(month))

  // Call the database function that creates cycle + tasks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('start_new_cycle', {
    p_client_id: clientId,
    p_month: normalizedMonth,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath('/dashboard')
  return { cycleId: data }
}

export async function updateCycleStatus(
  cycleId: string,
  status: 'planning' | 'active' | 'completed'
) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('cycles') as any)
    .update({ status })
    .eq('id', cycleId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}
