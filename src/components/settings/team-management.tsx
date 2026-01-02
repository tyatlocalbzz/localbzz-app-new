'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { inviteUser, deleteUser, type UserWithStatus } from '@/lib/actions/users'
import { useToast } from '@/hooks/use-toast'

interface TeamManagementProps {
  users: UserWithStatus[]
  currentUserId: string
}

export function TeamManagement({ users, currentUserId }: TeamManagementProps) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
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

  async function handleDelete(userId: string) {
    setIsDeleting(userId)
    const result = await deleteUser(userId)

    if (result.error) {
      errorToast({ error: result.error, context: { action: 'deleteUser' } })
    } else {
      toast({ title: 'User removed' })
    }
    setIsDeleting(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>Manage who has access to LocalBzz</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite form */}
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

        {/* All users in single list */}
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                user.status === 'pending' ? 'border-dashed' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className={user.status === 'pending' ? 'bg-muted' : ''}>
                    {user.email.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.email}</p>
                    {user.id === currentUserId && (
                      <Badge variant="secondary">You</Badge>
                    )}
                    {user.status === 'pending' && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user.status === 'pending' ? 'Invited' : 'Joined'}{' '}
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Remove button - can't remove self */}
              {user.id !== currentUserId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(user.id)}
                  disabled={isDeleting === user.id}
                >
                  {isDeleting === user.id ? 'Removing...' : 'Remove'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
