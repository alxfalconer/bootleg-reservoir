"use client"

import { useEffect } from "react"
import type { Artifact } from "./artifacts"

const STORAGE_KEY = "rsv-local-artifacts"

export function useArtifacts(serverArtifacts: Artifact[]) {
  // Clear any legacy localStorage artifacts on first mount
  useEffect(() => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])

  return { allArtifacts: serverArtifacts }
}
