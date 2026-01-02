import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Also check for token_hash (used in invite/magic link flows)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  console.log('[Auth Callback] Received:', {
    hasCode: !!code,
    hasTokenHash: !!token_hash,
    type,
    next,
    allParams: Object.fromEntries(searchParams.entries()),
  })

  const supabase = await createClient()

  // Handle PKCE flow (code exchange)
  if (code) {
    console.log('[Auth Callback] Exchanging code for session...')
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[Auth Callback] Code exchange failed:', error.message)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
    }
    console.log('[Auth Callback] Code exchange successful, redirecting to:', next)
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Handle token hash flow (email links like invite, magic link, recovery)
  if (token_hash && type) {
    console.log('[Auth Callback] Verifying OTP with token_hash...')
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'invite' | 'magiclink' | 'recovery' | 'signup' | 'email_change',
    })
    if (error) {
      console.error('[Auth Callback] OTP verification failed:', error.message)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
    }
    console.log('[Auth Callback] OTP verified, redirecting to:', next)
    return NextResponse.redirect(`${origin}${next}`)
  }

  console.error('[Auth Callback] No code or token_hash provided')
  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate`)
}
