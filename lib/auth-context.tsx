"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"

interface AuthContextValue {
  user: User | null
}

const AuthContext = createContext<AuthContextValue>({ user: null })

export function AuthProvider({ user, children }: { user: User | null; children: ReactNode }) {
  return <AuthContext value={{ user }}>{children}</AuthContext>
}

export function useAuth() {
  return useContext(AuthContext)
}
