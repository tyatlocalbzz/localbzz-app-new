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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { startNewCycle } from '@/lib/actions/cycles'
import { useToast } from '@/hooks/use-toast'

interface StartCycleDialogProps {
  clientId: string
}

export function StartCycleDialog({ clientId }: StartCycleDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const { toast, errorToast } = useToast()

  // Generate month options (current month + next 2 months)
  const monthOptions = Array.from({ length: 3 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() + i)
    date.setDate(1) // First of month
    // Use stable YYYY-MM format for value
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return {
      value,
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    }
  })

  async function handleSubmit() {
    if (!selectedMonth) return

    setIsLoading(true)

    // Parse YYYY-MM format to Date (first of month)
    const [year, month] = selectedMonth.split('-').map(Number)
    const result = await startNewCycle(clientId, new Date(year, month - 1, 1))

    if (result.error) {
      errorToast({
        error: result.error,
        context: { action: 'startNewCycle', clientId, selectedMonth },
      })
    } else {
      toast({
        title: 'Success',
        description: 'New cycle started with tasks',
      })
      setOpen(false)
      setSelectedMonth('')
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Start New Cycle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Cycle</DialogTitle>
          <DialogDescription>
            This will create a new monthly cycle and generate the standard admin tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            Tasks will be created based on your cycle templates.
            <a href="/dashboard/settings" className="text-primary hover:underline ml-1">
              Manage templates
            </a>
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !selectedMonth}>
            {isLoading ? 'Starting...' : 'Start Cycle'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
