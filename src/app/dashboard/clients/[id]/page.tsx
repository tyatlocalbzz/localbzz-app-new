import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClientHeader } from '@/components/clients/client-header'
import { ClientTabs } from '@/components/clients/client-tabs'
import { TaskList } from '@/components/tasks/task-list'
import { ContextFeed } from '@/components/context/context-feed'
import { getCurrentCycle } from '@/lib/actions/cycles'
import { getProfiles } from '@/lib/actions/users'
import { getGlobalTemplates } from '@/lib/actions/templates'
import { getClientAssignmentsWithDetails } from '@/lib/actions/assignments'
import type { Client, Task, Shoot, Cycle, ClientContext } from '@/lib/database.types'

// Task with assignee data included
type TaskWithAssignee = Task & {
  assignee: { id: string; email: string; avatar_url: string | null } | null
}

interface ClientPageProps {
  params: { id: string }
}

type ContextWithAuthor = ClientContext & { author: { email: string } | null }

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch client
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !client) {
    notFound()
  }

  // Fetch current cycle, profiles, templates, and assignments in parallel
  const [currentCycle, profiles, templates, assignments] = await Promise.all([
    getCurrentCycle(id),
    getProfiles(),
    getGlobalTemplates(),
    getClientAssignmentsWithDetails(id),
  ])

  // Fetch tasks with assignee data
  const { data: allTasks } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:assignee_id (id, email, avatar_url)
    `)
    .order('sort_order', { ascending: true })

  // Fetch all cycles for this client (ordered by month ascending - soonest first)
  const { data: cycles } = await supabase
    .from('cycles')
    .select('*')
    .eq('client_id', id)
    .order('month', { ascending: true })

  const { data: shoots } = await supabase
    .from('shoots')
    .select('*')
    .eq('client_id', id)
    .order('shoot_date', { ascending: false })

  const typedCycles = (cycles as Cycle[] | null) || []
  const typedShoots = (shoots as Shoot[] | null) || []
  const cycleIds = typedCycles.map((c) => c.id)
  const shootIds = typedShoots.map((s) => s.id)

  // Filter tasks for this client
  const clientTasks =
    (allTasks as TaskWithAssignee[] | null)?.filter(
      (t) =>
        (t.parent_type === 'cycle' && cycleIds.includes(t.parent_id)) ||
        (t.parent_type === 'shoot' && shootIds.includes(t.parent_id))
    ) || []

  // Fetch context
  const { data: context } = await supabase
    .from('client_context')
    .select(`
      *,
      author:author_id (email)
    `)
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex flex-col">
      <ClientHeader
        client={client as Client}
        templates={templates}
        profiles={profiles}
        assignments={assignments}
      />

      {/* Desktop: Split Pane */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left: Tasks (60%) */}
        <div className="w-3/5 border-r overflow-auto">
          <TaskList
            clientId={id}
            tasks={clientTasks}
            shoots={typedShoots}
            cycles={typedCycles}
            currentCycleId={currentCycle?.id || null}
            users={profiles}
          />
        </div>

        {/* Right: Context (40%) */}
        <div className="w-2/5 overflow-auto">
          <ContextFeed
            clientId={id}
            context={(context as ContextWithAuthor[]) || []}
            currentCycleId={currentCycle?.id || null}
          />
        </div>
      </div>

      {/* Mobile: Tabs */}
      <div className="md:hidden flex-1 overflow-hidden">
        <ClientTabs
          clientId={id}
          tasks={clientTasks}
          shoots={typedShoots}
          cycles={typedCycles}
          context={(context as ContextWithAuthor[]) || []}
          currentCycleId={currentCycle?.id || null}
          users={profiles}
        />
      </div>
    </div>
  )
}
