'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserSelect } from '@/components/users/user-select'
import { setClientAssignment } from '@/lib/actions/assignments'
import { useToast } from '@/hooks/use-toast'
import { ROLE_LABELS } from '@/lib/constants'
import type { Profile, TaskTemplate, ClientTaskAssignment } from '@/lib/database.types'

interface ClientAssignmentsEditorProps {
  clientId: string
  templates: TaskTemplate[]
  assignments: ClientTaskAssignment[]
  users: Profile[]
}

export function ClientAssignmentsEditor({
  clientId,
  templates,
  assignments,
  users,
}: ClientAssignmentsEditorProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const { toast, errorToast } = useToast()

  // Create a map for quick lookup: template_id -> assignee_id
  const assignmentMap = new Map(assignments.map((a) => [a.template_id, a.assignee_id]))

  async function handleChange(templateId: string, assigneeId: string | null) {
    setIsUpdating(templateId)
    const result = await setClientAssignment(clientId, templateId, assigneeId)

    if (result.error) {
      errorToast({ error: result.error, context: { action: 'setClientAssignment' } })
    } else {
      toast({ title: 'Default assignment updated' })
    }
    setIsUpdating(null)
  }

  const cycleTemplates = templates.filter((t) => t.parent_type === 'cycle')
  const shootTemplates = templates.filter((t) => t.parent_type === 'shoot')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Task Assignments</CardTitle>
        <CardDescription>
          Set default assignees for tasks when cycles or shoots are created
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cycle Tasks */}
        {cycleTemplates.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Cycle Tasks</h4>
            <div className="space-y-2">
              {cycleTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div className="flex items-center gap-2">
                    <span>{template.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {ROLE_LABELS[template.role]}
                    </Badge>
                  </div>
                  <UserSelect
                    users={users}
                    value={assignmentMap.get(template.id) || null}
                    onChange={(id) => handleChange(template.id, id)}
                    disabled={isUpdating === template.id}
                    className="w-[180px]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shoot Tasks */}
        {shootTemplates.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Shoot Tasks</h4>
            <div className="space-y-2">
              {shootTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div className="flex items-center gap-2">
                    <span>{template.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {ROLE_LABELS[template.role]}
                    </Badge>
                  </div>
                  <UserSelect
                    users={users}
                    value={assignmentMap.get(template.id) || null}
                    onChange={(id) => handleChange(template.id, id)}
                    disabled={isUpdating === template.id}
                    className="w-[180px]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {cycleTemplates.length === 0 && shootTemplates.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No task templates configured. Add templates in Settings to set up default assignments.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
