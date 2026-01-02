'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { isAdmin, getUser } from './auth'
import type { Profile, UserRole } from '@/lib/database.types'

// Type for user listing with status
export type UserWithStatus = {
  id: string
  email: string
  role: UserRole
  avatar_url: string | null
  status: 'active' | 'pending'
  created_at: string
}

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
 * Uses Supabase Admin API to send proper invitation with password setup
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

  // Get origin from headers for redirect URL
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

  // Use Admin API to send proper invitation
  // Use dedicated invite callback route (avoids URL encoding issues with query params)
  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback/invite`,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * SECURE: Get all users with their status (active/pending)
 * Merges profiles with auth data server-side to prevent leaking all auth users
 */
export async function getUsersWithStatus(): Promise<{ data: UserWithStatus[] | null; error: string | null }> {
  console.log('[getUsersWithStatus] Starting...')

  let supabaseAdmin
  try {
    supabaseAdmin = createAdminClient()
    console.log('[getUsersWithStatus] Admin client created successfully')
  } catch (error) {
    console.error('[getUsersWithStatus] Failed to create admin client:', error)
    return { data: null, error: `Admin client error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }

  const supabase = await createClient()

  // 1. Fetch profiles (our "safe list" - only users in this app)
  console.log('[getUsersWithStatus] Fetching profiles...')
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, avatar_url, created_at')
    .order('created_at', { ascending: false })

  if (profileError) {
    console.error('[getUsersWithStatus] Profile fetch error:', profileError)
    return { data: null, error: `Failed to fetch profiles: ${profileError.message}` }
  }

  if (!profiles) {
    console.log('[getUsersWithStatus] No profiles found')
    return { data: [], error: null }
  }

  console.log(`[getUsersWithStatus] Found ${profiles.length} profiles`)

  // 2. Fetch auth users (server-side only)
  console.log('[getUsersWithStatus] Fetching auth users...')
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  })

  if (authError) {
    console.error('[getUsersWithStatus] Auth API error:', {
      message: authError.message,
      status: authError.status,
      name: authError.name,
    })
    return { data: null, error: `Auth API error: ${authError.message}` }
  }

  console.log(`[getUsersWithStatus] Found ${authData?.users?.length || 0} auth users`)

  // 3. Secure merge - only return users who are in profiles
  const mergedUsers: UserWithStatus[] = profiles.map((profile) => {
    const authUser = authData.users.find((u) => u.id === profile.id)

    // Status: pending if email not confirmed
    const isConfirmed = !!authUser?.email_confirmed_at

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      avatar_url: profile.avatar_url,
      status: isConfirmed ? 'active' : 'pending',
      created_at: profile.created_at,
    }
  })

  return { data: mergedUsers, error: null }
}

/**
 * Delete a user (admin only)
 * Removes from auth (cascades to profiles via FK)
 */
export async function deleteUser(userId: string) {
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Only admins can delete users' }
  }

  // Prevent self-deletion
  const currentUser = await getUser()
  if (currentUser?.id === userId) {
    return { error: 'You cannot delete your own account' }
  }

  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  // Verify user exists in profiles (security - only delete our users)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { error: 'User not found' }
  }

  // Delete from auth (cascades to profile)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Resend invitation email (admin only)
 * CRITICAL: Must include redirectTo for password setup
 */
export async function resendInvitation(email: string) {
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Only admins can resend invitations' }
  }

  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

  const supabaseAdmin = createAdminClient()

  // Resend the invitation with the correct redirect
  // Use dedicated invite callback route (avoids URL encoding issues with query params)
  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback/invite`,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
