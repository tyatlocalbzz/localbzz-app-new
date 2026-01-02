'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TaskList } from '@/components/tasks/task-list'
import { ContextFeed } from '@/components/context/context-feed'
import type { Task, Shoot, ClientContext, Cycle, Profile } from '@/lib/database.types'

type TaskWithAssignee = Task & {
  assignee: { id: string; email: string; avatar_url: string | null } | null
}

interface ClientTabsProps {
  clientId: string
  tasks: TaskWithAssignee[]
  shoots: Shoot[]
  cycles: Cycle[]
  context: (ClientContext & { author: { email: string } | null })[]
  currentCycleId: string | null
  users?: Profile[]
}

export function ClientTabs({
  clientId,
  tasks,
  shoots,
  cycles,
  context,
  currentCycleId,
  users,
}: ClientTabsProps) {
  return (
    <Tabs defaultValue="tasks" className="h-full flex flex-col">
      <TabsList className="w-full justify-start rounded-none border-b bg-background px-4">
        <TabsTrigger value="tasks" className="flex-1">
          Tasks
        </TabsTrigger>
        <TabsTrigger value="context" className="flex-1">
          Context
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tasks" className="flex-1 overflow-auto m-0">
        <TaskList
          clientId={clientId}
          tasks={tasks}
          shoots={shoots}
          cycles={cycles}
          currentCycleId={currentCycleId}
          users={users}
        />
      </TabsContent>

      <TabsContent value="context" className="flex-1 overflow-auto m-0">
        <ContextFeed
          clientId={clientId}
          context={context}
          currentCycleId={currentCycleId}
        />
      </TabsContent>
    </Tabs>
  )
}
