import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SHOOT_STATUS_CONFIG } from '@/lib/constants'
import { formatShortDate } from '@/lib/utils'
import type { Shoot } from '@/lib/database.types'
import Link from 'next/link'

type ShootWithClient = Shoot & {
  clients: { id: string; name: string } | null
}

export default async function CalendarPage() {
  const supabase = await createClient()

  // Fetch all shoots with client info
  const { data: shoots } = await supabase
    .from('shoots')
    .select(`
      *,
      clients:client_id (id, name)
    `)
    .order('shoot_date', { ascending: true })

  // Group shoots by month
  const shootsByMonth = new Map<string, ShootWithClient[]>()
  ;(shoots as ShootWithClient[] | null)?.forEach((shoot) => {
    const date = new Date(shoot.shoot_date)
    const monthKey = date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    const existing = shootsByMonth.get(monthKey) || []
    shootsByMonth.set(monthKey, [...existing, shoot])
  })

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">All scheduled shoots</p>
      </div>

      {!shoots || shoots.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <p>No shoots scheduled</p>
            <p className="text-sm mt-2">
              <Link href="/dashboard/clients" className="text-primary hover:underline">
                Go to a client
              </Link>{' '}
              to schedule a shoot
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Array.from(shootsByMonth.entries()).map(([month, monthShoots]) => (
            <div key={month}>
              <h2 className="text-lg font-semibold mb-4">{month}</h2>
              <div className="space-y-3">
                {monthShoots?.map((shoot) => {
                  const statusConfig = SHOOT_STATUS_CONFIG[shoot.status]
                  const client = shoot.clients

                  return (
                    <Link
                      key={shoot.id}
                      href={client ? `/dashboard/clients/${client.id}` : '#'}
                    >
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {formatShortDate(shoot.shoot_date)}
                                </span>
                                <Badge className={statusConfig.color}>
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {client?.name || 'Unknown Client'}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {shoot.type}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
