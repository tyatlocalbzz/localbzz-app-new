// Input validation helpers

/**
 * Validate that a URL is well-formed (if provided)
 * Returns null if valid, error message if invalid
 */
export function validateUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') return null // Empty is valid (optional field)

  try {
    new URL(url)
    return null
  } catch {
    return 'Invalid URL format'
  }
}

/**
 * Validate required string field
 */
export function validateRequired(value: string | null | undefined, fieldName: string): string | null {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`
  }
  return null
}

/**
 * Validate string length
 */
export function validateLength(
  value: string | null | undefined,
  fieldName: string,
  { min, max }: { min?: number; max?: number }
): string | null {
  if (!value) return null

  if (min !== undefined && value.length < min) {
    return `${fieldName} must be at least ${min} characters`
  }
  if (max !== undefined && value.length > max) {
    return `${fieldName} must be less than ${max} characters`
  }
  return null
}

/**
 * Validate time format (HH:MM)
 */
export function validateTimeFormat(time: string | null | undefined): string | null {
  if (!time) return null

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(time)) {
    return 'Invalid time format (expected HH:MM)'
  }
  return null
}

/**
 * Run multiple validators and return first error
 */
export function validate(...validators: (string | null)[]): string | null {
  for (const error of validators) {
    if (error) return error
  }
  return null
}
