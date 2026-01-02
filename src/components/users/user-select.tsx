'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile } from '@/lib/database.types'

interface UserSelectProps {
  users: Profile[]
  value: string | null
  onChange: (userId: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function UserSelect({
  users,
  value,
  onChange,
  placeholder = 'Unassigned',
  disabled = false,
  className,
}: UserSelectProps) {
  return (
    <Select
      value={value || 'unassigned'}
      onValueChange={(v) => onChange(v === 'unassigned' ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <span className="text-muted-foreground">Unassigned</span>
        </SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {user.email.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{user.email}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
