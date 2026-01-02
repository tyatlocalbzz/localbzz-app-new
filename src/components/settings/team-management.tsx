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
import { inviteUser, updateUserRole, deleteUser, resendInvitation, type UserWithStatus } from '@/lib/actions/users'
import { useToast } from '@/hooks/use-toast'

interface TeamManagementProps {
  users: UserWithStatus[]
  currentUserId: string
  isAdmin: boolean
}

export function TeamManagement({ users, currentUserId, isAdmin }: TeamManagementProps) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isResending, setIsResending] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
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

  async function handleDelete(userId: string) {
    setIsDeleting(userId)
    const result = await deleteUser(userId)

    if (result.error) {
      errorToast({ error: result.error, context: { action: 'deleteUser' } })
    } else {
      toast({ title: 'User removed', description: 'Team member has been removed' })
    }
    setIsDeleting(null)
    setConfirmDelete(null)
  }

  async function handleResendInvite(email: string, userId: string) {
    setIsResending(userId)
    const result = await resendInvitation(email)

    if (result.error) {
      errorToast({ error: result.error, context: { action: 'resendInvitation' } })
    } else {
      toast({ title: 'Invitation resent', description: `New invite sent to ${email}` })
    }
    setIsResending(null)
  }

  // Separate active and pending users
  const activeUsers = users.filter((u) => u.status === 'active')
  const pendingUsers = users.filter((u) => u.status === 'pending')

  return (
    <div className="space-y-6">
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

          {/* Active users */}
          <div className="space-y-2">
            {activeUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.email}</p>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role selector or badge */}
                  {user.id === currentUserId || !isAdmin ? (
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  ) : (
                    <Select
                      value={user.role}
                      onValueChange={(v) => handleRoleChange(user.id, v as 'admin' | 'contributor')}
                      disabled={isUpdating === user.id}
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

                  {/* Delete button - only for admins, can't delete self */}
                  {isAdmin && user.id !== currentUserId && (
                    <>
                      {confirmDelete === user.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(user.id)}
                            disabled={isDeleting === user.id}
                          >
                            {isDeleting === user.id ? 'Removing...' : 'Confirm'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmDelete(user.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {pendingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Users who haven&apos;t accepted their invite yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-dashed"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-muted">
                        {user.email.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.email}</p>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Pending
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Invited {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResendInvite(user.email, user.id)}
                        disabled={isResending === user.id}
                      >
                        {isResending === user.id ? 'Sending...' : 'Resend'}
                      </Button>

                      {confirmDelete === user.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(user.id)}
                            disabled={isDeleting === user.id}
                          >
                            {isDeleting === user.id ? 'Removing...' : 'Confirm'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmDelete(user.id)}
                        >
                          Cancel Invite
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
