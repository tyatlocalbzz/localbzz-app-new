'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TaskItem } from './task-item'
import { StartCycleDialog } from '@/components/cycles/start-cycle-dialog'
import { ScheduleShootDialog } from '@/components/shoots/schedule-shoot-dialog'
import { SHOOT_STATUS_CONFIG } from '@/lib/constants'
import { formatShortDate } from '@/lib/utils'
import type { Task, Shoot, Cycle, Profile } from '@/lib/database.types'

type TaskWithAssignee = Task & {
  assignee: { id: string; email: string; avatar_url: string | null } | null
}

function formatTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number)
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const ampm = hour < 12 ? 'AM' : 'PM'
  return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`
}

interface TaskListProps {
  clientId: string
  tasks: TaskWithAssignee[]
  shoots: Shoot[]
  cycles: Cycle[]
  currentCycleId: string | null
  users?: Profile[]
}

function formatMonthYear(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function TaskList({ clientId, tasks, shoots, cycles, currentCycleId, users }: TaskListProps) {
  // Group cycle tasks by cycle_id (keep original order within each group)
  const cycleTasksMap = new Map<string, TaskWithAssignee[]>()
  tasks
    .filter((t) => t.parent_type === 'cycle')
    .forEach((t) => {
      const existing = cycleTasksMap.get(t.parent_id) || []
      cycleTasksMap.set(t.parent_id, [...existing, t])
    })

  // Group shoot tasks by shoot (keep original order)
  const shootTasksMap = new Map<string, TaskWithAssignee[]>()
  tasks
    .filter((t) => t.parent_type === 'shoot')
    .forEach((t) => {
      const existing = shootTasksMap.get(t.parent_id) || []
      shootTasksMap.set(t.parent_id, [...existing, t])
    })

  // Group shoots by cycle_id
  const shootsByCycleMap = new Map<string, Shoot[]>()
  const orphanShoots: Shoot[] = []
  shoots.forEach((shoot) => {
    if (shoot.cycle_id) {
      const existing = shootsByCycleMap.get(shoot.cycle_id) || []
      shootsByCycleMap.set(shoot.cycle_id, [...existing, shoot])
    } else {
      orphanShoots.push(shoot)
    }
  })

  // Get cycles that have tasks OR shoots, maintaining the order from cycles prop (soonest first)
  const cyclesWithContent = cycles.filter(
    (cycle) =>
      (cycleTasksMap.has(cycle.id) && (cycleTasksMap.get(cycle.id)?.length ?? 0) > 0) ||
      (shootsByCycleMap.has(cycle.id) && (shootsByCycleMap.get(cycle.id)?.length ?? 0) > 0)
  )

  return (
    <div className="p-4 space-y-6">
      {/* Actions - Always show both buttons */}
      <div className="flex gap-2 flex-wrap">
        <StartCycleDialog clientId={clientId} />
        <ScheduleShootDialog clientId={clientId} cycleId={currentCycleId} />
      </div>

      {/* Cycle Cards - Each cycle shows its tasks and shoots */}
      {cyclesWithContent.length === 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No cycles started. Click &ldquo;Start Cycle&rdquo; to begin.
            </p>
          </CardContent>
        </Card>
      ) : (
        cyclesWithContent.map((cycle) => {
          const cycleTasks = cycleTasksMap.get(cycle.id) || []
          const cycleShots = shootsByCycleMap.get(cycle.id) || []
          const isCurrent = cycle.id === currentCycleId

          return (
            <Card key={cycle.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {formatMonthYear(cycle.month)}
                  {isCurrent && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      Current
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Split cycle tasks: before shoot (sort_order <= 4) and after (sort_order > 4) */}
                {(() => {
                  const preShootTasks = cycleTasks.filter((t) => (t.sort_order ?? 0) <= 4)
                  const postShootTasks = cycleTasks.filter((t) => (t.sort_order ?? 0) > 4)

                  return (
                    <>
                      {/* Pre-shoot tasks (Check-in, Schedule Shoot, etc.) */}
                      {preShootTasks.length > 0 && (
                        <div className="space-y-2">
                          {preShootTasks.map((task) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              clientId={clientId}
                              assignee={task.assignee}
                              users={users}
                            />
                          ))}
                        </div>
                      )}

                      {/* Shoots for this cycle */}
                      {cycleShots.map((shoot) => {
                        const shootTasks = shootTasksMap.get(shoot.id) || []
                        const statusConfig = SHOOT_STATUS_CONFIG[shoot.status]

                        return (
                          <div key={shoot.id} className="border-t pt-4">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="space-y-1">
                                <div className="font-medium text-sm flex items-center gap-2">
                                  <span className="text-muted-foreground">Shoot:</span>
                                  {formatShortDate(shoot.shoot_date)}
                                  {shoot.shoot_time && (
                                    <span className="font-normal text-muted-foreground">
                                      @ {formatTime(shoot.shoot_time)}
                                    </span>
                                  )}
                                </div>
                                {(shoot.location || shoot.calendar_link) && (
                                  <p className="text-sm text-muted-foreground">
                                    {shoot.location && <span>{shoot.location}</span>}
                                    {shoot.location && shoot.calendar_link && <span> · </span>}
                                    {shoot.calendar_link && (
                                      <a
                                        href={shoot.calendar_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                      >
                                        Calendar
                                      </a>
                                    )}
                                  </p>
                                )}
                              </div>
                              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                            </div>
                            {shootTasks.length > 0 && (
                              <div className="space-y-2 pl-4 border-l-2 border-muted">
                                {shootTasks.map((task) => (
                                  <TaskItem
                                    key={task.id}
                                    task={task}
                                    clientId={clientId}
                                    assignee={task.assignee}
                                    users={users}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Post-shoot tasks (Monthly Report, etc.) */}
                      {postShootTasks.length > 0 && (
                        <div className="space-y-2 border-t pt-4">
                          {postShootTasks.map((task) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              clientId={clientId}
                              assignee={task.assignee}
                              users={users}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )
                })()}
              </CardContent>
            </Card>
          )
        })
      )}

      {/* Orphan shoots (no cycle assigned) */}
      {orphanShoots.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-muted-foreground">Unassigned Shoots</h3>
          {orphanShoots.map((shoot) => {
            const shootTasks = shootTasksMap.get(shoot.id) || []
            const statusConfig = SHOOT_STATUS_CONFIG[shoot.status]

            return (
              <Card key={shoot.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {formatShortDate(shoot.shoot_date)}
                        {shoot.shoot_time && (
                          <span className="font-normal text-muted-foreground ml-2">
                            @ {formatTime(shoot.shoot_time)}
                          </span>
                        )}
                      </CardTitle>
                      {(shoot.location || shoot.calendar_link) && (
                        <CardDescription className="text-sm">
                          {shoot.location && <span>{shoot.location}</span>}
                          {shoot.location && shoot.calendar_link && <span> · </span>}
                          {shoot.calendar_link && (
                            <a
                              href={shoot.calendar_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Calendar Event
                            </a>
                          )}
                        </CardDescription>
                      )}
                    </div>
                    <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {shootTasks.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No tasks</p>
                  ) : (
                    <div className="space-y-2">
                      {shootTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          clientId={clientId}
                          assignee={task.assignee}
                          users={users}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
