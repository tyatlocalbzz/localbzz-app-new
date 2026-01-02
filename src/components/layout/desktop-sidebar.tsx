'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'

const navItems = [
  { href: '/dashboard', label: 'Tasks', icon: '☐' },
  { href: '/dashboard/clients', label: 'Clients', icon: '◆' },
  { href: '/dashboard/calendar', label: 'Calendar', icon: '▦' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙' },
]

export function DesktopSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-background border-r">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">LocalBzz</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t">
        <form action={signOut}>
          <Button variant="ghost" className="w-full justify-start" type="submit">
            Sign Out
          </Button>
        </form>
      </div>
    </aside>
  )
}
