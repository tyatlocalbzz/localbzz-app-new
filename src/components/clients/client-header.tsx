'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ClientAssignmentsEditor } from '@/components/clients/client-assignments-editor'
import type { Client, TaskTemplate, Profile, ClientTaskAssignment } from '@/lib/database.types'

type AssignmentWithDetails = ClientTaskAssignment & {
  template: Pick<TaskTemplate, 'id' | 'title' | 'parent_type'> | null
  assignee: Pick<Profile, 'id' | 'email' | 'avatar_url'> | null
}

interface ClientHeaderProps {
  client: Client
  templates?: TaskTemplate[]
  profiles?: Profile[]
  assignments?: AssignmentWithDetails[]
}

export function ClientHeader({ client, templates, profiles, assignments }: ClientHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const assets = client.assets || {}

  return (
    <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold truncate">{client.name}</h1>
        <div className="flex items-center gap-2">
          {assets.drive_url && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={assets.drive_url} target="_blank" rel="noopener noreferrer">
                Drive
              </a>
            </Button>
          )}
          {assets.schedule_url && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={assets.schedule_url} target="_blank" rel="noopener noreferrer">
                Schedule
              </a>
            </Button>
          )}
          {assets.brand_url && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden md:inline-flex"
            >
              <a href={assets.brand_url} target="_blank" rel="noopener noreferrer">
                Brand
              </a>
            </Button>
          )}
          {templates && profiles && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Task Defaults</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Default Task Assignments</DialogTitle>
                </DialogHeader>
                <ClientAssignmentsEditor
                  clientId={client.id}
                  templates={templates}
                  users={profiles}
                  assignments={assignments || []}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  )
}
