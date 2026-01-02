'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  reorderTemplates,
} from '@/lib/actions/templates'
import { useToast } from '@/hooks/use-toast'
import { ROLE_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { TaskTemplate } from '@/lib/database.types'

interface TaskTemplatesEditorProps {
  templates: TaskTemplate[]
  parentType: 'cycle' | 'shoot'
}

type TaskRole = 'strategist' | 'scheduler' | 'shooter' | 'editor'

export function TaskTemplatesEditor({ templates, parentType }: TaskTemplatesEditorProps) {
  const [items, setItems] = useState(templates)
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newRole, setNewRole] = useState<TaskRole>('strategist')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editRole, setEditRole] = useState<TaskRole>('strategist')
  const [editDaysOffset, setEditDaysOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { toast, errorToast } = useToast()

  async function handleAdd() {
    if (!newTitle.trim()) return

    setIsLoading(true)
    const nextSortOrder = items.length + 1
    const result = await createTemplate(parentType, newTitle.trim(), newRole, nextSortOrder)

    if (result.error) {
      errorToast({ error: result.error, context: { action: 'createTemplate' } })
    } else {
      toast({ title: 'Template added' })
      setNewTitle('')
      setNewRole('strategist')
      setIsAdding(false)
      // Optimistically add to list (will be replaced on revalidation)
      setItems([...items, {
        id: crypto.randomUUID(),
        client_id: null,
        parent_type: parentType,
        title: newTitle.trim(),
        role: newRole,
        sort_order: nextSortOrder,
        days_offset: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
    }
    setIsLoading(false)
  }

  async function handleUpdate(id: string) {
    if (!editTitle.trim()) return

    setIsLoading(true)
    const result = await updateTemplate(id, {
      title: editTitle.trim(),
      role: editRole,
      days_offset: editDaysOffset,
    })

    if (result.error) {
      errorToast({ error: result.error, context: { action: 'updateTemplate' } })
    } else {
      toast({ title: 'Template updated' })
      setItems(items.map(item =>
        item.id === id ? { ...item, title: editTitle.trim(), role: editRole, days_offset: editDaysOffset } : item
      ))
      setEditingId(null)
    }
    setIsLoading(false)
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    setIsLoading(true)
    const result = await updateTemplate(id, { is_active: isActive })

    if (result.error) {
      errorToast({ error: result.error, context: { action: 'updateTemplate' } })
    } else {
      setItems(items.map(item =>
        item.id === id ? { ...item, is_active: isActive } : item
      ))
    }
    setIsLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return

    setIsLoading(true)
    const result = await deleteTemplate(id)

    if (result.error) {
      errorToast({ error: result.error, context: { action: 'deleteTemplate' } })
    } else {
      toast({ title: 'Template deleted' })
      setItems(items.filter(item => item.id !== id))
    }
    setIsLoading(false)
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return

    const newItems = [...items]
    ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
    setItems(newItems)

    const result = await reorderTemplates(newItems.map(i => i.id))
    if (result.error) {
      errorToast({ error: result.error, context: { action: 'reorderTemplates' } })
      setItems(items) // Revert on error
    }
  }

  async function handleMoveDown(index: number) {
    if (index === items.length - 1) return

    const newItems = [...items]
    ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
    setItems(newItems)

    const result = await reorderTemplates(newItems.map(i => i.id))
    if (result.error) {
      errorToast({ error: result.error, context: { action: 'reorderTemplates' } })
      setItems(items) // Revert on error
    }
  }

  function startEditing(template: TaskTemplate) {
    setEditingId(template.id)
    setEditTitle(template.title)
    setEditRole(template.role as TaskRole)
    setEditDaysOffset(template.days_offset)
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {items.length === 0 && !isAdding && (
          <p className="text-muted-foreground text-sm py-4 text-center">
            No templates configured. Add one to get started.
          </p>
        )}

        {items.map((template, index) => (
          <div
            key={template.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border',
              !template.is_active && 'opacity-50'
            )}
          >
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0 || isLoading}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                aria-label={`Move ${template.title} up`}
              >
                ▲
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === items.length - 1 || isLoading}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                aria-label={`Move ${template.title} down`}
              >
                ▼
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {editingId === template.id ? (
                <div className="flex gap-2 items-center flex-wrap">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8 flex-1 min-w-[150px]"
                    autoFocus
                  />
                  <Select value={editRole} onValueChange={(v) => setEditRole(v as TaskRole)}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strategist">Strategist</SelectItem>
                      <SelectItem value="scheduler">Scheduler</SelectItem>
                      <SelectItem value="shooter">Shooter</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Day</span>
                    <Input
                      type="number"
                      value={editDaysOffset}
                      onChange={(e) => setEditDaysOffset(parseInt(e.target.value) || 0)}
                      className="h-8 w-16"
                    />
                  </div>
                  <Button size="sm" onClick={() => handleUpdate(template.id)} disabled={isLoading}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{template.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {ROLE_LABELS[template.role]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Day {template.days_offset}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            {editingId !== template.id && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={template.is_active}
                  onCheckedChange={(checked) => handleToggleActive(template.id, checked)}
                  disabled={isLoading}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditing(template)}
                  disabled={isLoading}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(template.id)}
                  disabled={isLoading}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Add new template */}
        {isAdding ? (
          <div className="flex gap-2 items-center p-3 rounded-lg border border-dashed">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title"
              className="h-8"
              autoFocus
            />
            <Select value={newRole} onValueChange={(v) => setNewRole(v as TaskRole)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strategist">Strategist</SelectItem>
                <SelectItem value="scheduler">Scheduler</SelectItem>
                <SelectItem value="shooter">Shooter</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} disabled={isLoading || !newTitle.trim()}>
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAdding(true)}
          >
            + Add Template
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
