'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateTaskStatus } from '@/lib/actions/tasks'
import { addContextEntry } from '@/lib/actions/context'
import { useToast } from '@/hooks/use-toast'

interface CompleteCheckinDialogProps {
  taskId: string
  clientId: string
  cycleId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CompleteCheckinDialog({
  taskId,
  clientId,
  cycleId,
  open,
  onOpenChange,
}: CompleteCheckinDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [notes, setNotes] = useState('')
  const { toast, errorToast } = useToast()

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTranscript('')
      setNotes('')
    }
  }, [open])

  async function handleSubmit() {
    setIsLoading(true)

    // Add transcript if provided
    if (transcript.trim()) {
      const result = await addContextEntry(clientId, cycleId, 'transcript', transcript.trim())
      if (result.error) {
        errorToast({
          error: result.error,
          context: { action: 'addContextEntry', clientId, cycleId, type: 'transcript' },
        })
        setIsLoading(false)
        return
      }
    }

    // Add notes if provided
    if (notes.trim()) {
      const result = await addContextEntry(clientId, cycleId, 'note', notes.trim())
      if (result.error) {
        errorToast({
          error: result.error,
          context: { action: 'addContextEntry', clientId, cycleId, type: 'note' },
        })
        setIsLoading(false)
        return
      }
    }

    // Mark task as complete
    const result = await updateTaskStatus(taskId, 'done', clientId)

    if (result.error) {
      errorToast({
        error: result.error,
        context: { action: 'updateTaskStatus', taskId, newStatus: 'done' },
      })
    } else {
      toast({
        title: 'Check-in completed',
        description: transcript.trim() || notes.trim()
          ? 'Task marked complete and notes saved to Client Brain'
          : 'Task marked complete',
      })
      onOpenChange(false)
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Check-in Call</DialogTitle>
          <DialogDescription>
            Add any notes or transcript from the call. Both fields are optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="transcript">Call Transcript</Label>
            <Textarea
              id="transcript"
              placeholder="Paste call transcript here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={isLoading}
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes from the call..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Complete Check-in'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
