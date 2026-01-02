'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CONTEXT_TYPE_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ClientContext } from '@/lib/database.types'

interface ContextEntryProps {
  entry: ClientContext & { author: { email: string } | null }
}

export function ContextEntry({ entry }: ContextEntryProps) {
  const typeConfig = CONTEXT_TYPE_CONFIG[entry.type]
  const date = new Date(entry.created_at)

  // Format time
  const timeStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  // Truncate content for preview
  const preview =
    entry.content.length > 200
      ? entry.content.substring(0, 200) + '...'
      : entry.content

  return (
    <Card
      className={cn(entry.type === 'report' && 'border-l-4 border-l-green-500')}
    >
      <CardContent className="py-3">
        <div className="flex items-center justify-between mb-2">
          <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
          <span className="text-xs text-muted-foreground">{timeStr}</span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{preview}</p>
        {entry.author && (
          <p className="text-xs text-muted-foreground mt-2">
            by {entry.author.email}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
