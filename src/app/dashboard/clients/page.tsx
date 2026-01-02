import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'
import type { Client } from '@/lib/database.types'

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  const typedClients = clients as Client[] | null
  const activeClients = typedClients?.filter((c) => c.status === 'active') || []
  const archivedClients = typedClients?.filter((c) => c.status === 'archived') || []

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your client accounts</p>
        </div>
        <CreateClientDialog />
      </div>

      {activeClients.length === 0 && archivedClients.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <p>No clients yet</p>
            <p className="text-sm mt-2">Click &quot;Add Client&quot; to create your first client</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Clients */}
          {activeClients.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Active</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeClients.map((client) => (
                  <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
                    <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          {client.name}
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 flex-wrap">
                          {client.assets?.drive_url && (
                            <Badge variant="outline" className="text-xs">Drive</Badge>
                          )}
                          {client.assets?.schedule_url && (
                            <Badge variant="outline" className="text-xs">Schedule</Badge>
                          )}
                          {client.assets?.brand_url && (
                            <Badge variant="outline" className="text-xs">Brand</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Archived Clients */}
          {archivedClients.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Archived</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {archivedClients.map((client) => (
                  <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
                    <Card className="h-full opacity-60 hover:opacity-80 transition-opacity cursor-pointer">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          {client.name}
                          <Badge variant="secondary">Archived</Badge>
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
