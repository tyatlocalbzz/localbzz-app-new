'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { formatDateForDB } from '@/lib/utils'
import { validateUrl, validateTimeFormat, validate } from '@/lib/validation'

export async function getShoots(clientId: string, cycleId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('shoots')
    .select('*')
    .eq('client_id', clientId)
    .order('shoot_date', { ascending: false })

  if (cycleId) {
    query = query.eq('cycle_id', cycleId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getUpcomingShoots() {
  const supabase = await createClient()

  const today = formatDateForDB(new Date())

  const { data, error } = await supabase
    .from('shoots')
    .select(`
      *,
      clients:client_id (name)
    `)
    .gte('shoot_date', today)
    .order('shoot_date', { ascending: true })
    .limit(10)

  if (error) throw error
  return data
}

export async function scheduleShoot(
  clientId: string,
  cycleId: string | null,
  shootDate: Date,
  type: 'monthly' | 'adhoc' = 'monthly',
  shootTime?: string,
  location?: string,
  calendarLink?: string,
  cycleTaskId?: string
) {
  // Validate inputs
  const validationError = validate(
    validateTimeFormat(shootTime),
    validateUrl(calendarLink)
  )
  if (validationError) {
    return { error: validationError }
  }

  const supabase = await createClient()

  const formattedDate = formatDateForDB(shootDate)

  // Call the database function that creates shoot + tasks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('schedule_shoot', {
    p_client_id: clientId,
    p_cycle_id: cycleId,
    p_shoot_date: formattedDate,
    p_type: type,
    p_shoot_time: shootTime || null,
    p_location: location || null,
    p_calendar_link: calendarLink || null,
  })

  if (error) {
    return { error: error.message }
  }

  // If a cycle task ID was provided, mark it as complete
  if (cycleTaskId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('tasks') as any)
      .update({ status: 'done' })
      .eq('id', cycleTaskId)
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/calendar')
  return { shootId: data }
}

export async function getAllShoots() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shoots')
    .select(`
      *,
      clients:client_id (id, name)
    `)
    .order('shoot_date', { ascending: true })

  if (error) throw error
  return data
}
