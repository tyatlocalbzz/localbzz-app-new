'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isAdmin } from './auth'
import { validateRequired, validateUrl, validate } from '@/lib/validation'
import type { Client, ClientAssets } from '@/lib/database.types'

interface ClientImportRow {
  name: string
  status: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
}

export async function getClients(status?: 'active' | 'archived') {
  const supabase = await createClient()

  let query = supabase.from('clients').select('*').order('name')

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getClientById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function addClient(formData: FormData) {
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Only admins can create clients' }
  }

  const supabase = await createClient()

  const name = formData.get('name') as string
  const driveUrl = formData.get('drive_url') as string
  const scheduleUrl = formData.get('schedule_url') as string
  const brandUrl = formData.get('brand_url') as string

  // Validate inputs
  const validationError = validate(
    validateRequired(name, 'Name'),
    validateUrl(driveUrl),
    validateUrl(scheduleUrl),
    validateUrl(brandUrl)
  )
  if (validationError) {
    return { error: validationError }
  }

  const insertData = {
    name,
    assets: {
      drive_url: driveUrl || '',
      schedule_url: scheduleUrl || '',
      brand_url: brandUrl || '',
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('clients') as any)
    .insert(insertData)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/clients')
  return { data: data as Client }
}

export async function updateClient(id: string, formData: FormData) {
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Only admins can update clients' }
  }

  const supabase = await createClient()

  const name = formData.get('name') as string
  const status = formData.get('status') as 'active' | 'archived'
  const driveUrl = formData.get('drive_url') as string
  const scheduleUrl = formData.get('schedule_url') as string
  const brandUrl = formData.get('brand_url') as string

  // Validate inputs
  const validationError = validate(
    validateRequired(name, 'Name'),
    validateUrl(driveUrl),
    validateUrl(scheduleUrl),
    validateUrl(brandUrl)
  )
  if (validationError) {
    return { error: validationError }
  }

  const updateData = {
    name,
    status,
    assets: {
      drive_url: driveUrl || '',
      schedule_url: scheduleUrl || '',
      brand_url: brandUrl || '',
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('clients') as any)
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${id}`)
  return { success: true }
}

export async function bulkImportClients(clients: ClientImportRow[]) {
  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Only admins can import clients' }
  }

  const supabase = await createClient()

  // Map status values from CSV to database enum
  const mapStatus = (status: string): 'active' | 'archived' => {
    const normalized = status?.toLowerCase().trim() || ''
    if (normalized === 'ongoing' || normalized === 'active') return 'active'
    if (normalized === 'archived' || normalized === 'inactive') return 'archived'
    return 'active' // Default to active
  }

  const clientsToInsert = clients
    .filter(c => c.name && c.name.trim()) // Only include rows with a name
    .map(c => {
      const assets: ClientAssets = {}
      if (c.contact_name) assets.contact_name = c.contact_name.trim()
      if (c.contact_email) assets.contact_email = c.contact_email.trim()
      if (c.contact_phone) assets.contact_phone = c.contact_phone.trim()
      if (c.notes) assets.notes = c.notes.trim()

      return {
        name: c.name.trim(),
        status: mapStatus(c.status),
        assets: Object.keys(assets).length > 0 ? assets : null,
      }
    })

  if (clientsToInsert.length === 0) {
    return { error: 'No valid clients to import' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('clients') as any)
    .insert(clientsToInsert)
    .select('id, name')

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard/settings')

  return {
    success: true,
    imported: data?.length || 0,
    clients: data,
  }
}
