'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { isSystemTask } from '@/lib/constants'
import { updateTaskStatus, updateTaskAssignee } from '@/lib/actions/tasks'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDueDate } from '@/lib/utils'
import { ScheduleShootDialog } from '@/components/shoots/schedule-shoot-dialog'
import { CompleteCheckinDialog } from '@/components/tasks/complete-checkin-dialog'
import { UserSelect } from '@/components/users/user-select'
import type { Task, Profile } from '@/lib/database.types'

type TaskAssignee = { id: string; email: string; avatar_url: string | null } | null

interface TaskItemProps {
  task: Task
  clientId: string
  assignee?: TaskAssignee
  users?: Profile[]
}

export function TaskItem({ task, clientId, assignee, users }: TaskItemProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showCheckinDialog, setShowCheckinDialog] = useState(false)
  const { toast, errorToast } = useToast()

  const isScheduleShootTask =
    task.title === 'Schedule Shoot' && task.parent_type === 'cycle'
  const isCheckinCallTask =
    task.title === 'Conduct Check-in Call' && task.parent_type === 'cycle'

  async function handleAssigneeChange(userId: string | null) {
    setIsAssigning(true)
    const result = await updateTaskAssignee(task.id, userId, clientId)

    if (result.error) {
      errorToast({ error: result.error, context: { action: 'updateTaskAssignee' } })
    } else {
      toast({ title: 'Assignee updated' })
    }
    setIsAssigning(false)
  }

  async function handleToggle() {
    // If this is the "Schedule Shoot" cycle task, open dialog instead
    if (isScheduleShootTask && task.status === 'todo') {
      setShowScheduleDialog(true)
      return
    }

    // If this is the "Conduct Check-in Call" cycle task, open dialog instead
    if (isCheckinCallTask && task.status === 'todo') {
      setShowCheckinDialog(true)
      return
    }

    setIsUpdating(true)

    const newStatus = task.status === 'todo' ? 'done' : 'todo'
    const result = await updateTaskStatus(task.id, newStatus, clientId)

    if (result.error) {
      errorToast({
        error: result.error,
        context: { action: 'updateTaskStatus', taskId: task.id, taskTitle: task.title, newStatus },
      })
    } else {
      toast({
        title: 'Task updated',
        description: newStatus === 'done' ? 'Task marked as complete' : 'Task marked as pending',
      })
    }

    setIsUpdating(false)
  }

  const isSystem = isSystemTask(task.title)

  const isCompleted = task.status === 'done'

  const dueDateInfo = formatDueDate(task.due_date)

  return (
    <>
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg transition-all duration-300',
          isCompleted
            ? 'opacity-60 bg-muted/30'
            : 'hover:bg-secondary/50'
        )}
      >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'transition-all duration-300',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </span>
            {isSystem && (
              <Badge
                variant="outline"
                className={cn('text-xs text-muted-foreground', isCompleted && 'opacity-60')}
              >
                System
              </Badge>
            )}
            {dueDateInfo.text && !isCompleted && (
              <span
                className={cn(
                  'text-xs',
                  dueDateInfo.isOverdue && 'text-destructive font-medium',
                  dueDateInfo.isDueToday && 'text-amber-600 dark:text-amber-500 font-medium',
                  !dueDateInfo.isOverdue && !dueDateInfo.isDueToday && 'text-muted-foreground'
                )}
              >
                {dueDateInfo.isOverdue ? 'Overdue' : dueDateInfo.isDueToday ? 'Due today' : `Due ${dueDateInfo.text}`}
              </span>
            )}
          </div>
        </div>

        {/* Assignee section */}
        <div className="flex items-center gap-2 ml-auto">
          {users && users.length > 0 ? (
            <UserSelect
              users={users}
              value={assignee?.id || null}
              onChange={handleAssigneeChange}
              disabled={isAssigning || isCompleted}
              className="w-[160px] h-8"
            />
          ) : assignee ? (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={assignee.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {assignee.email.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                {assignee.email.split('@')[0]}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {isScheduleShootTask && (
        <ScheduleShootDialog
          clientId={clientId}
          cycleId={task.parent_id}
          cycleTaskId={task.id}
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
        />
      )}

      {isCheckinCallTask && (
        <CompleteCheckinDialog
          taskId={task.id}
          clientId={clientId}
          cycleId={task.parent_id}
          open={showCheckinDialog}
          onOpenChange={setShowCheckinDialog}
        />
      )}
    </>
  )
}
