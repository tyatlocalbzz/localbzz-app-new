// System constants for LocalBzz

// Shoot task titles that trigger status changes via database triggers
// These titles should match the task_templates in the database
export const HANDOFF_TASK_TITLES = [
  'Shoot Content',
  'Edit Content',
  'Schedule Content',
] as const

// Check if a task title is a system task that cannot be edited
export function isSystemTask(title: string): boolean {
  return HANDOFF_TASK_TITLES.includes(title as typeof HANDOFF_TASK_TITLES[number])
}

// Role display names
export const ROLE_LABELS: Record<string, string> = {
  strategist: 'Strategist',
  scheduler: 'Scheduler',
  shooter: 'Shooter',
  editor: 'Editor',
}

// Status display names and colors
export const SHOOT_STATUS_CONFIG = {
  planned: { label: 'Planned', color: 'bg-gray-100 text-gray-800' },
  shot: { label: 'Shot', color: 'bg-blue-100 text-blue-800' },
  edited: { label: 'Edited', color: 'bg-yellow-100 text-yellow-800' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
} as const

export const CYCLE_STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'bg-gray-100 text-gray-800' },
  active: { label: 'Active', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
} as const

export const CONTEXT_TYPE_CONFIG = {
  transcript: { label: 'Transcript', color: 'bg-purple-100 text-purple-800' },
  report: { label: 'Report', color: 'bg-green-100 text-green-800' },
  note: { label: 'Note', color: 'bg-gray-100 text-gray-800' },
} as const
