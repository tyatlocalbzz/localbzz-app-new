'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InviteCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleInviteCallback() {
      const supabase = createClient()

      // Supabase puts tokens in URL fragment for implicit flow (invites)
      // The fragment is only visible client-side
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        // Set the session from the fragment tokens
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          console.error('[Invite Callback] Failed to set session:', error.message)
          setError(error.message)
          return
        }

        // Success - redirect to set password
        router.replace('/auth/set-password')
        return
      }

      // Fallback: Check if there's already a session (might have been set automatically)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/auth/set-password')
        return
      }

      // No tokens found
      setError('No authentication tokens found')
    }

    handleInviteCallback()
  }, [router])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Authentication Failed</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <a href="/auth/login" className="text-primary underline">
            Go to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Setting up your account...</p>
      </div>
    </div>
  )
}
