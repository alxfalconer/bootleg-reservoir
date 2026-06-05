import { FragmentField } from "@/components/fragment-field"
import { DepositTrigger } from "@/components/deposit-trigger"
import { ViewControls } from "@/components/view-controls"
import { ClientProviders } from "@/components/client-providers"
import { ReservoirSidebar } from "@/components/reservoir-sidebar"
import { getPublishedArtifacts } from "@/lib/get-artifacts"
import { getSupabaseAuth } from "@/lib/supabase/server"

export default async function ReservoirPage() {
  const [supabase, serverArtifacts] = await Promise.all([
    getSupabaseAuth(),
    getPublishedArtifacts(),
  ])

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <ClientProviders user={user}>
      <div className="flex h-screen overflow-hidden">

        {/* LEFT COLUMN — Archivist's notebook */}
        <ReservoirSidebar />

        {/* Mobile header — shown only below md */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex justify-between items-center px-6 py-3">
            <div className="space-y-0.5">
              <h1 className="text-sm font-bold tracking-tight">Reservoir</h1>
              <p className="text-[10px] text-muted-foreground">est. 2024</p>
            </div>
            <DepositTrigger />
          </div>
        </div>

        {/* RIGHT COLUMN — Fragment field */}
        <main className="flex-1 overflow-y-auto bg-foreground/5">
          {/* Spacer for mobile header */}
          <div className="md:hidden h-14" />
          <FragmentField serverArtifacts={serverArtifacts} />
        </main>

      </div>

      <ViewControls />
    </ClientProviders>
  )
}
