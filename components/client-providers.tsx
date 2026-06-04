"use client"

import { ViewProvider } from "@/lib/view-context"
import type { ReactNode } from "react"

export function ClientProviders({ children }: { children: ReactNode }) {
  return <ViewProvider>{children}</ViewProvider>
}
