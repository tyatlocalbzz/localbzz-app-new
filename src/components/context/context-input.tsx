'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addContextEntry } from '@/lib/actions/context'
import { useToast } from '@/hooks/use-toast'

interface ContextInputProps {
  clientId: string
  cycleId: string | null
}

export function ContextInput({ clientId, cycleId }: ContextInputProps) {
  const [type, setType] = useState<'transcript' | 'report' | 'note'>('note')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast, errorToast } = useToast()

  async function handleSubmit() {
    if (!content.trim()) return

    setIsLoading(true)

    const result = await addContextEntry(clientId, cycleId, type, content.trim())

    if (result.error) {
      errorToast({
        error: result.error,
        context: { action: 'addContextEntry', clientId, cycleId, type },
      })
    } else {
      toast({
        title: 'Added',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} added to Client Brain`,
      })
      setContent('')
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="note">Note</SelectItem>
            <SelectItem value="transcript">Transcript</SelectItem>
            <SelectItem value="report">Report</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !content.trim()}
          className="flex-shrink-0"
        >
          {isLoading ? 'Adding...' : 'Add'}
        </Button>
      </div>
      <Textarea
        placeholder={
          type === 'transcript'
            ? 'Paste call transcript here...'
            : type === 'report'
            ? 'Write report content...'
            : 'Add a note about this client...'
        }
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isLoading}
        className="min-h-[100px] resize-none"
      />
    </div>
  )
}
