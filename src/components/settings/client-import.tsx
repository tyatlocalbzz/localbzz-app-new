'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { bulkImportClients } from '@/lib/actions/clients'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ParsedClient {
  name: string
  status: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
}

function parseCSV(text: string): ParsedClient[] {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))

  // Parse data rows
  return lines.slice(1).map(line => {
    // Handle quoted values with commas inside
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    headers.forEach((header, i) => {
      row[header] = values[i] || ''
    })

    return {
      name: row.name || '',
      status: row.status || 'active',
      contact_name: row.contact_name,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      notes: row.notes,
    }
  }).filter(row => row.name)
}

export function ClientImport() {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<ParsedClient[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const { toast, errorToast } = useToast()

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      errorToast({ error: 'Please upload a CSV file', context: { action: 'parseCSV' } })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setPreview(parsed)
    }
    reader.readAsText(file)
  }, [errorToast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  async function handleImport() {
    if (preview.length === 0) return

    setIsImporting(true)
    const result = await bulkImportClients(preview)

    if (result.error) {
      errorToast({ error: result.error, context: { action: 'bulkImportClients' } })
    } else {
      toast({
        title: 'Import successful',
        description: `Imported ${result.imported} clients`,
      })
      setPreview([])
    }
    setIsImporting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Import Clients</CardTitle>
        <CardDescription>
          Upload a CSV file to bulk import clients. Expected columns: name, status, contact_name, contact_email, contact_phone, notes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            'hover:border-primary/50'
          )}
        >
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Drag and drop a CSV file here, or
            </p>
            <label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer">Browse files</span>
              </Button>
            </label>
          </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Preview ({preview.length} clients)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreview([])}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={isImporting}
                >
                  {isImporting ? 'Importing...' : `Import ${preview.length} Clients`}
                </Button>
              </div>
            </div>

            <div className="max-h-[300px] overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Contact</th>
                    <th className="text-left p-2 font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((client, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{client.name}</td>
                      <td className="p-2">
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          client.status.toLowerCase() === 'ongoing' || client.status.toLowerCase() === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        )}>
                          {client.status}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground">{client.contact_name || '-'}</td>
                      <td className="p-2 text-muted-foreground">{client.contact_email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Template download */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Download a{' '}
            <a
              href="data:text/csv;charset=utf-8,name,status,contact_name,contact_email,contact_phone,notes%0AExample Client,Ongoing,John Doe,john@example.com,555-1234,Notes here"
              download="client-import-template.csv"
              className="text-primary hover:underline"
            >
              template CSV
            </a>{' '}
            to see the expected format.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
