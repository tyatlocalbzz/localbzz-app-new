import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { formatDueDate, cn } from '@/lib/utils'
import type { Task, Cycle, Shoot } from '@/lib/database.types'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch all pending tasks with their parent info
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'todo')
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch clients for reference
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('status', 'active')

  // Fetch cycles to link tasks to clients
  const { data: cycles } = await supabase
    .from('cycles')
    .select('id, client_id')

  // Fetch shoots to link tasks to clients
  const { data: shoots } = await supabase
    .from('shoots')
    .select('id, client_id')

  // Type assertions
  const typedTasks = tasks as Task[] | null
  const typedClients = clients as { id: string; name: string }[] | null
  const typedCycles = cycles as Pick<Cycle, 'id' | 'client_id'>[] | null
  const typedShoots = shoots as Pick<Shoot, 'id' | 'client_id'>[] | null

  // Create lookup maps
  const clientMap = new Map(typedClients?.map((c) => [c.id, c.name]) || [])
  const cycleClientMap = new Map(typedCycles?.map((c) => [c.id, c.client_id]) || [])
  const shootClientMap = new Map(typedShoots?.map((s) => [s.id, s.client_id]) || [])

  // Get client name for a task
  function getClientName(task: { parent_id: string; parent_type: string }) {
    const clientId =
      task.parent_type === 'cycle'
        ? cycleClientMap.get(task.parent_id)
        : shootClientMap.get(task.parent_id)
    return clientId ? clientMap.get(clientId) : 'Unknown'
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">Your pending tasks across all clients</p>
      </div>

      {!typedTasks || typedTasks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <p>No pending tasks</p>
            <p className="text-sm mt-2">
              <Link href="/dashboard/clients" className="text-primary hover:underline">
                View clients
              </Link>{' '}
              to start a new cycle or schedule a shoot
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {typedTasks.map((task) => {
            const dueDateInfo = formatDueDate(task.due_date)
            return (
              <Card key={task.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="py-4 flex items-start gap-4">
                  <Checkbox className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{task.title}</span>
                      {dueDateInfo.text && (
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
                    <p className="text-sm text-muted-foreground mt-1">
                      {getClientName(task)} &middot;{' '}
                      {task.parent_type === 'cycle' ? 'Cycle Task' : 'Shoot Task'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
