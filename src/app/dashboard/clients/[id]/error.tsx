'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ClientDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Client detail error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <h2 className="text-xl font-semibold mb-2">Failed to load client</h2>
      <p className="text-muted-foreground mb-4 text-center max-w-md">
        Unable to load client details. The client may not exist or there was a connection issue.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/dashboard/clients">Back to clients</Link>
        </Button>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
