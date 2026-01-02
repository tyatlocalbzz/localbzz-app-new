'use client'

import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'

interface HeaderProps {
  title?: string
}

export function Header({ title = 'LocalBzz' }: HeaderProps) {
  return (
    <header className="md:hidden flex items-center justify-between h-14 px-4 border-b bg-background">
      <h1 className="text-lg font-bold text-primary">{title}</h1>
      <form action={signOut}>
        <Button variant="ghost" size="sm" type="submit">
          Sign Out
        </Button>
      </form>
    </header>
  )
}
