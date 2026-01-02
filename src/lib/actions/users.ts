'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isAdmin } from './auth'
import type { Profile } from '@/lib/database.types'

/**
 * Get all team members (profiles)
 */
export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('email')

  if (error) throw error
  return data || []
}

/**
 * Update a user's role (admin only)
 */
export async function updateUserRole(userId: string, role: 'admin' | 'contributor') {
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Only admins can update roles' }
  }

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any)
    .update({ role })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Invite a new user via email (admin only)
 * Note: This uses Supabase's magic link invite
 */
export async function inviteUser(email: string) {
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Only admins can invite users' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email format' }
  }

  const supabase = await createClient()

  // Check if user already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingProfile) {
    return { error: 'A user with this email already exists' }
  }

  // Use Supabase Auth to send an invite
  // Note: For production, you may need to use the admin API via Edge Function
  // or configure Supabase to allow magic link invites
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
