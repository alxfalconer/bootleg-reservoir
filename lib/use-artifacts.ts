"use client"

import { useState, useCallback, useEffect } from "react"
import type { Artifact } from "./artifacts"

const STORAGE_KEY = "rsv-local-artifacts"

function loadLocal(): Artifact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Artifact[]) : []
  } catch {
    return []
  }
}

function saveLocal(items: Artifact[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useArtifacts(serverArtifacts: Artifact[]) {
  const [localArtifacts, setLocalArtifacts] = useState<Artifact[]>([])

  useEffect(() => {
    setLocalArtifacts(loadLocal())
  }, [])

  const removeArtifact = useCallback((id: string) => {
    setLocalArtifacts((prev) => {
      const next = prev.filter((a) => a.id !== id)
      saveLocal(next)
      return next
    })
  }, [])

  return {
    allArtifacts: [...serverArtifacts, ...localArtifacts],
    removeArtifact,
  }
}
