'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { ContextEntry } from './context-entry'
import { ContextInput } from './context-input'
import type { ClientContext } from '@/lib/database.types'

interface ContextFeedProps {
  clientId: string
  context: (ClientContext & { author: { email: string } | null })[]
  currentCycleId: string | null
}

export function ContextFeed({ clientId, context, currentCycleId }: ContextFeedProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Feed Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold">Client Brain</h2>
        <p className="text-sm text-muted-foreground">Notes, transcripts, and reports</p>
      </div>

      {/* Context Entries */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {context.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No context entries yet</p>
              <p className="text-sm mt-2">Add notes, transcripts, or reports below</p>
            </div>
          ) : (
            context.map((entry) => (
              <ContextEntry
                key={entry.id}
                entry={entry}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Form */}
      <div className="border-t p-4">
        <ContextInput clientId={clientId} cycleId={currentCycleId} />
      </div>
    </div>
  )
}
