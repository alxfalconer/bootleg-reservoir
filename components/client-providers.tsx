"use client"

import { ViewProvider } from "@/lib/view-context"
import { AuthProvider } from "@/lib/auth-context"
import { LoginModal } from "@/components/login-modal"
import type { User } from "@supabase/supabase-js"
import type { ReactNode } from "react"

export function ClientProviders({ user, children }: { user: User | null; children: ReactNode }) {
  return (
    <AuthProvider user={user}>
      <ViewProvider>{children}</ViewProvider>
      <LoginModal />
    </AuthProvider>
  )
}
