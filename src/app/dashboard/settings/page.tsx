import { getTemplatesByType } from '@/lib/actions/templates'
import { getProfiles } from '@/lib/actions/users'
import { getProfile, isAdmin } from '@/lib/actions/auth'
import { TaskTemplatesEditor } from '@/components/settings/task-templates-editor'
import { TeamManagement } from '@/components/settings/team-management'
import { ClientImport } from '@/components/settings/client-import'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function SettingsPage() {
  const [cycleTemplates, shootTemplates, profiles, currentProfile, userIsAdmin] = await Promise.all([
    getTemplatesByType('cycle'),
    getTemplatesByType('shoot'),
    getProfiles(),
    getProfile(),
    isAdmin(),
  ])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-8">
        {/* Team Management Section */}
        <section>
          <TeamManagement
            profiles={profiles}
            currentUserId={currentProfile?.id || ''}
            isAdmin={userIsAdmin}
          />
        </section>

        {/* Task Templates Section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Task Templates</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Configure the default tasks that are created when starting a new cycle or scheduling a shoot.
          </p>

          <Tabs defaultValue="cycle" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="cycle">Cycle Tasks</TabsTrigger>
              <TabsTrigger value="shoot">Shoot Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="cycle">
              <TaskTemplatesEditor
                templates={cycleTemplates}
                parentType="cycle"
              />
            </TabsContent>

            <TabsContent value="shoot">
              <TaskTemplatesEditor
                templates={shootTemplates}
                parentType="shoot"
              />
            </TabsContent>
          </Tabs>
        </section>

        {/* Client Import Section - Admin only */}
        {userIsAdmin && (
          <section>
            <ClientImport />
          </section>
        )}
      </div>
    </div>
  )
}
