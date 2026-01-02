'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { inviteUser, updateUserRole } from '@/lib/actions/users'
import { useToast } from '@/hooks/use-toast'
import type { Profile } from '@/lib/database.types'

interface TeamManagementProps {
  profiles: Profile[]
  currentUserId: string
  isAdmin: boolean
}

export function TeamManagement({ profiles, currentUserId, isAdmin }: TeamManagementProps) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const { toast, errorToast } = useToast()

  async function handleInvite() {
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    const result = await inviteUser(inviteEmail.trim())

    if (result.error) {
      errorToast({ error: result.error, context: { action: 'inviteUser' } })
    } else {
      toast({ title: 'Invitation sent', description: `Invite sent to ${inviteEmail}` })
      setInviteEmail('')
    }
    setIsInviting(false)
  }

  async function handleRoleChange(userId: string, role: 'admin' | 'contributor') {
    setIsUpdating(userId)
    const result = await updateUserRole(userId, role)

    if (result.error) {
      errorToast({ error: result.error, context: { action: 'updateUserRole' } })
    } else {
      toast({ title: 'Role updated' })
    }
    setIsUpdating(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>Manage who has access to LocalBzz</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite form - only show for admins */}
        {isAdmin && (
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email to invite"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleInvite()
                }
              }}
            />
            <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
              {isInviting ? 'Sending...' : 'Invite'}
            </Button>
          </div>
        )}

        {/* Team list */}
        <div className="space-y-2">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile.email.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Can't change own role, or non-admins can't change anyone's role */}
                {profile.id === currentUserId || !isAdmin ? (
                  <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                    {profile.role}
                  </Badge>
                ) : (
                  <Select
                    value={profile.role}
                    onValueChange={(v) => handleRoleChange(profile.id, v as 'admin' | 'contributor')}
                    disabled={isUpdating === profile.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="contributor">Contributor</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
