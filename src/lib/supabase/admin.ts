import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Admin client with service role - bypasses RLS
// Only use server-side for admin operations like inviting users
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Debug logging (safe - only shows presence and format, not actual keys)
  console.log('[Admin Client] Environment check:', {
    hasUrl: !!supabaseUrl,
    urlPrefix: supabaseUrl?.substring(0, 30) + '...',
    hasServiceKey: !!serviceRoleKey,
    serviceKeyLength: serviceRoleKey?.length,
    serviceKeyPrefix: serviceRoleKey?.substring(0, 20) + '...',
    // Check if key looks like a JWT (should start with 'eyJ')
    serviceKeyIsJWT: serviceRoleKey?.startsWith('eyJ'),
  })

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  // Validate service role key format (should be a JWT)
  if (!serviceRoleKey.startsWith('eyJ')) {
    console.error('[Admin Client] Service role key does not appear to be a valid JWT')
    throw new Error('SUPABASE_SERVICE_ROLE_KEY appears to be invalid (not a JWT format)')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
