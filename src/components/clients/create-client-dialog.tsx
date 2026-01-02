'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addClient } from '@/lib/actions/clients'
import { useToast } from '@/hooks/use-toast'

export function CreateClientDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast, errorToast } = useToast()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)

    const name = formData.get('name') as string
    const result = await addClient(formData)

    if (result.error) {
      errorToast({
        error: result.error,
        context: { action: 'addClient', clientName: name },
      })
    } else {
      toast({
        title: 'Success',
        description: 'Client created successfully',
      })
      setOpen(false)
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Client</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Create a new client account with their asset links.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Acme Coffee Shop"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="drive_url">Google Drive URL</Label>
            <Input
              id="drive_url"
              name="drive_url"
              type="url"
              placeholder="https://drive.google.com/..."
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule_url">Schedule URL</Label>
            <Input
              id="schedule_url"
              name="schedule_url"
              type="url"
              placeholder="https://..."
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand_url">Brand Guide URL</Label>
            <Input
              id="brand_url"
              name="brand_url"
              type="url"
              placeholder="https://..."
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
