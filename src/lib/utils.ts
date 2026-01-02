import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize a date to the first of the month
// IMPORTANT: Cycles must always be stored with day=1
export function normalizeToFirstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Format a date as "Month YYYY" (e.g., "January 2025")
export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// Format a date as "MMM D" (e.g., "Jan 15")
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Format a date as "YYYY-MM-DD" for database storage
export function formatDateForDB(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Get the current month's first day
export function getCurrentMonthStart(): Date {
  return normalizeToFirstOfMonth(new Date())
}

// Format due date with relative indicator (e.g., "Jan 15" or "Overdue")
export function formatDueDate(date: Date | string | null): { text: string; isOverdue: boolean; isDueToday: boolean } {
  if (!date) return { text: '', isOverdue: false, isDueToday: false }

  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueDate = new Date(d)
  dueDate.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const isOverdue = diffDays < 0
  const isDueToday = diffDays === 0

  const text = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return { text, isOverdue, isDueToday }
}
