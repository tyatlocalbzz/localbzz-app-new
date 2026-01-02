import { DesktopSidebar } from '@/components/layout/desktop-sidebar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/toaster'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content */}
      <div className="md:pl-64">
        {/* Mobile Header */}
        <Header />

        {/* Page Content - add padding for mobile bottom nav */}
        <main className="pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}
