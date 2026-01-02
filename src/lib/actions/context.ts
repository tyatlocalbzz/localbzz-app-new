'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { validateRequired, validateLength, validate } from '@/lib/validation'

// Content length limits
const MAX_CONTENT_LENGTH = 50000 // 50KB of text

export async function getClientContext(clientId: string, cycleId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('client_context')
    .select(`
      *,
      author:author_id (email, avatar_url)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (cycleId) {
    query = query.eq('cycle_id', cycleId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function addContextEntry(
  clientId: string,
  cycleId: string | null,
  type: 'transcript' | 'report' | 'note',
  content: string
) {
  // Validate inputs
  const validationError = validate(
    validateRequired(content, 'Content'),
    validateLength(content, 'Content', { max: MAX_CONTENT_LENGTH })
  )
  if (validationError) {
    return { error: validationError }
  }

  const user = await getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const supabase = await createClient()

  const insertData = {
    client_id: clientId,
    cycle_id: cycleId,
    author_id: user.id,
    type,
    content,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('client_context') as any)
    .insert(insertData)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  return { data }
}

export async function deleteContextEntry(entryId: string, clientId: string) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('client_context') as any)
    .delete()
    .eq('id', entryId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: true }
}
