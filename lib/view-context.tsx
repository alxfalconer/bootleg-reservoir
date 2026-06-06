"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

export type ViewMode = "chaos" | "grid" | "single"
export type MediaFilter = "all" | "image" | "video" | "audio" | "text" | "link"

interface ViewContextValue {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  shuffleSignal: number
  triggerShuffle: () => void
  mediaFilter: MediaFilter
  setMediaFilter: (f: MediaFilter) => void
  autoplay: boolean
  setAutoplay: (v: boolean) => void
}

const ViewContext = createContext<ViewContextValue | null>(null)

export function ViewProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>("chaos")
  const [shuffleSignal, setShuffleSignal] = useState(0)
  const [mediaFilter, setMediaFilterState] = useState<MediaFilter>("all")
  const [autoplay, setAutoplayState] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rsv-view-mode") as ViewMode | null
      if (stored && ["chaos", "grid", "single"].includes(stored)) setViewModeState(stored)
    } catch {}
  }, [])

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    try { localStorage.setItem("rsv-view-mode", mode) } catch {}
  }, [])

  const triggerShuffle = useCallback(() => setShuffleSignal(n => n + 1), [])

  const setMediaFilter = useCallback((f: MediaFilter) => setMediaFilterState(f), [])

  const setAutoplay = useCallback((v: boolean) => setAutoplayState(v), [])

  return (
    <ViewContext.Provider value={{ viewMode, setViewMode, shuffleSignal, triggerShuffle, mediaFilter, setMediaFilter, autoplay, setAutoplay }}>
      {children}
    </ViewContext.Provider>
  )
}

export function useViewContext() {
  const ctx = useContext(ViewContext)
  if (!ctx) throw new Error("useViewContext requires ViewProvider")
  return ctx
}
