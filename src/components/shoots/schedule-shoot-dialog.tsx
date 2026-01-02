'use client'

import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { scheduleShoot } from '@/lib/actions/shoots'
import { useToast } from '@/hooks/use-toast'

interface ScheduleShootDialogProps {
  clientId: string
  cycleId: string | null
  cycleTaskId?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ScheduleShootDialog({
  clientId,
  cycleId,
  cycleTaskId,
  open: controlledOpen,
  onOpenChange,
}: ScheduleShootDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [shootDate, setShootDate] = useState('')
  const [shootTime, setShootTime] = useState('12:00')
  const [shootType, setShootType] = useState<'monthly' | 'adhoc'>('monthly')
  const [location, setLocation] = useState('')
  const [calendarLink, setCalendarLink] = useState('')
  const { toast, errorToast } = useToast()

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    }
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setShootDate('')
      setShootTime('12:00')
      setShootType('monthly')
      setLocation('')
      setCalendarLink('')
    }
  }, [open])

  // Generate time options in 15-minute increments
  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hour = Math.floor(i / 4)
    const minute = (i % 4) * 15
    const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const ampm = hour < 12 ? 'AM' : 'PM'
    const label = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`
    return { value, label }
  })

  async function handleSubmit() {
    setIsLoading(true)

    const result = await scheduleShoot(
      clientId,
      cycleId,
      shootDate ? new Date(shootDate) : new Date(),
      shootType,
      shootTime || undefined,
      location || undefined,
      calendarLink || undefined,
      cycleTaskId
    )

    if (result.error) {
      errorToast({
        error: result.error,
        context: {
          action: 'scheduleShoot',
          clientId,
          cycleId,
          shootDate,
          shootTime,
          shootType,
          location,
        },
      })
    } else {
      toast({
        title: 'Success',
        description: cycleTaskId
          ? 'Shoot scheduled and task marked complete'
          : 'Shoot scheduled with tasks',
      })
      handleOpenChange(false)
    }

    setIsLoading(false)
  }

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0]

  const dialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Schedule Shoot</DialogTitle>
        <DialogDescription>
          Schedule a content shoot and generate production tasks.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shoot_date">Date</Label>
            <Input
              id="shoot_date"
              type="date"
              min={today}
              value={shootDate}
              onChange={(e) => setShootDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shoot_time">Time</Label>
            <Select value={shootTime} onValueChange={setShootTime} disabled={isLoading}>
              <SelectTrigger id="shoot_time">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            type="text"
            placeholder="e.g., Client's office, Studio A"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="calendar_link">Calendar Event Link</Label>
          <Input
            id="calendar_link"
            type="url"
            placeholder="https://calendar.google.com/..."
            value={calendarLink}
            onChange={(e) => setCalendarLink(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shoot_type">Shoot Type</Label>
          <Select
            value={shootType}
            onValueChange={(v) => setShootType(v as 'monthly' | 'adhoc')}
          >
            <SelectTrigger id="shoot_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly (Regular)</SelectItem>
              <SelectItem value="adhoc">Ad-hoc (Special)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">
          Tasks will be created based on your shoot templates.
          <a href="/dashboard/settings" className="text-primary hover:underline ml-1">
            Manage templates
          </a>
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOpenChange(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Scheduling...' : 'Schedule Shoot'}
        </Button>
      </div>
    </DialogContent>
  )

  // If controlled, don't render the trigger
  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {dialogContent}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Schedule Shoot</Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  )
}
