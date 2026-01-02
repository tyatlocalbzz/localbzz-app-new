import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const supabase = await createClient()

  // 1. Standard PKCE Flow (Most Common for Magic Links now)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/set-password`)
    }
  }

  // 2. Token Hash Flow (Legacy or specific email templates)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/set-password`)
    }
  }

  // Fallback: If auth fails, send to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=Invite authentication failed`)
}
