"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { ArtifactCard } from "./artifact/artifact-card"
import { ArtifactDetail } from "./artifact/artifact-detail"
import { DepositForm } from "./deposit/deposit-form"
import { useArtifacts } from "@/lib/use-artifacts"
import { useViewContext } from "@/lib/view-context"
import { useAuth } from "@/lib/auth-context"
import type { Artifact } from "@/lib/artifacts"

interface FragmentFieldProps {
  serverArtifacts: Artifact[]
}

// ── Temporal depth constants ──────────────────────────────────────────────────

const STRATUM_HEIGHT  = 600  // px of scroll per year layer
const STRATA_YEARS    = [2026, 2025, 2024, 2023, 2022, 2021] as const
const NEWEST_YEAR     = 2026
const OLDEST_YEAR     = 2021

// ── Pure helpers ──────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }
function randRange(min: number, max: number) { return min + Math.random() * (max - min) }

function getArtifactDepth(artifact: Artifact): number {
  const year = artifact.depositYear ?? NEWEST_YEAR
  return clamp(NEWEST_YEAR - year, 0, 5)
}

// Visual properties scaled by how far the artifact is from the depth camera.
// relDepth > 0 = behind camera (older, receding); relDepth < 0 = in front (emerging)
function getDepthProps(artDepth: number, depthCamera: number) {
  const rel = artDepth - depthCamera
  return {
    scale:         1 - clamp(rel * 0.055, -0.05, 0.30),
    opacity:       clamp(1 - rel * 0.08, 0.55, 1),
    blur:          clamp(rel * 0.5, 0, 3.5),
    driftDuration: 9 + artDepth * 1.5,  // older → slower drift
  }
}

// Deterministic, year-biased initial positions.
// Newer artifacts cluster near the top; older ones settle deeper in the canvas.
function buildInitialPositions(artifacts: Artifact[]): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {}
  artifacts.forEach(a => {
    const depth = getArtifactDepth(a)
    let h = 0
    for (let i = 0; i < a.id.length; i++) h = (Math.imul(31, h) + a.id.charCodeAt(i)) | 0
    const seed = Math.abs(h)
    const yBase   = (depth / 5) * 68 + 4           // depth 0 → ~4%, depth 5 → ~72%
    const yJitter = ((seed % 300) / 300 - 0.5) * 16 // ±8% jitter
    pos[a.id] = {
      x: (seed % 78) + 3,
      y: clamp(yBase + yJitter, 3, 85),
    }
  })
  return pos
}

function fallbackPosition(id: string): { x: number; y: number } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  const abs = Math.abs(h)
  return { x: (abs % 75) + 5, y: ((abs >> 8) % 80) + 5 }
}

// ── Animation constants ───────────────────────────────────────────────────────

const DELETE_ANIMATE = {
  opacity: [1, 1, 0.85, 0.35, 0] as number[],
  scale:   [1, 0.98, 0.95, 0.87, 0] as number[],
  filter: [
    "blur(0px) saturate(1) brightness(1)",
    "blur(0.3px) saturate(0.75) brightness(1.05)",
    "blur(1px) saturate(0.35) brightness(1.15)",
    "blur(2.5px) saturate(0) brightness(1.25)",
    "blur(5px) saturate(0) brightness(1.3)",
  ],
}

const DELETE_TRANSITION = {
  opacity: { duration: 0.75, times: [0, 0.12, 0.45, 0.75, 1], ease: "easeIn" as const },
  scale:   { duration: 0.75, times: [0, 0.12, 0.42, 0.72, 1], ease: "easeIn" as const },
  filter:  { duration: 0.75, times: [0, 0.12, 0.42, 0.72, 1], ease: "easeIn" as const },
}

// Very slow ease-in-out — starts almost flat, accelerates through middle, settles gently
const DRIFT_EASE = [0.76, 0, 0.24, 1] as const

// ── Types ─────────────────────────────────────────────────────────────────────

type DragState   = { id: string; startX: number; startY: number; initialPos: { x: number; y: number } }
type DriftOffset = { x: number; y: number; rotate: number; scale: number; zOffset: number }

const DISPLAY_ORDER_KEY = "rsv-display-order"

function loadDisplayOrder(): string[] {
  try {
    const raw = localStorage.getItem(DISPLAY_ORDER_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FragmentField({ serverArtifacts }: FragmentFieldProps) {
  const router  = useRouter()
  const { user } = useAuth()
  const isAdmin = !!user
  const { viewMode, shuffleSignal, mediaFilter } = useViewContext()
  const effectiveView = mediaFilter !== "all" ? "grid" : viewMode
  const { allArtifacts } = useArtifacts(serverArtifacts)

  const containerRef        = useRef<HTMLDivElement>(null)
  const dragStateRef        = useRef<DragState | null>(null)
  const didDragRef          = useRef(false)
  const isFirstRender       = useRef(true)
  const executeShuffleRef   = useRef<() => void>(() => {})
  const driftStateRef       = useRef<Record<string, DriftOffset>>({})
  const inactivityTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visibleArtifactsRef = useRef<Artifact[]>([])
  const hasStartedDriftRef  = useRef(false)

  const [positions,    setPositions]    = useState(() => buildInitialPositions(allArtifacts))
  const [draggedId,    setDraggedId]    = useState<string | null>(null)
  const [hoveredId,    setHoveredId]    = useState<string | null>(null)
  const [expandedId,   setExpandedId]   = useState<string | null>(null)
  const [depositOpen,  setDepositOpen]  = useState(false)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [displayOrder, setDisplayOrder] = useState<string[]>([])
  const [singleIndex,  setSingleIndex]  = useState(0)
  const [driftState,   setDriftState]   = useState<Record<string, DriftOffset>>({})
  const [driftActive,  setDriftActive]  = useState(true)
  const [scrollY,      setScrollY]      = useState(0)

  // Temporal depth camera — scrollY mapped to year layers
  const depthCamera     = scrollY / STRATUM_HEIGHT
  const currentDepthYear = clamp(Math.round(NEWEST_YEAR - depthCamera), OLDEST_YEAR, NEWEST_YEAR)

  useEffect(() => { driftStateRef.current = driftState }, [driftState])

  const orderedArtifacts = useMemo(() => {
    const existingIds = new Set(allArtifacts.map(a => a.id))
    const validOrder  = displayOrder.filter(id => existingIds.has(id))
    const validSet    = new Set(validOrder)
    const newIds      = allArtifacts.filter(a => !validSet.has(a.id)).map(a => a.id)
    return [...validOrder, ...newIds]
      .map(id => allArtifacts.find(a => a.id === id)!)
      .filter(Boolean)
  }, [allArtifacts, displayOrder])

  const visibleArtifacts = useMemo(() => {
    if (mediaFilter === "all") return orderedArtifacts
    if (mediaFilter === "words") return orderedArtifacts.filter(a => a.type === "text" || a.type === "found text")
    return orderedArtifacts.filter(a => a.media.type === mediaFilter)
  }, [orderedArtifacts, mediaFilter])

  useEffect(() => { visibleArtifactsRef.current = visibleArtifacts }, [visibleArtifacts])

  useEffect(() => {
    setDisplayOrder(loadDisplayOrder())
  }, [])

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    try { localStorage.setItem(DISPLAY_ORDER_KEY, JSON.stringify(displayOrder)) } catch {}
  }, [displayOrder])

  // Scroll tracking — reads scrollTop of the <main> ancestor
  useEffect(() => {
    if (effectiveView !== "chaos") return
    const el = containerRef.current?.parentElement
    if (!el) return
    const onScroll = () => setScrollY(el.scrollTop)
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [effectiveView])

  executeShuffleRef.current = () => {
    if (orderedArtifacts.length === 0) return
    if (viewMode === "single") {
      setSingleIndex(Math.floor(Math.random() * orderedArtifacts.length))
    } else if (viewMode === "grid") {
      setDisplayOrder([...orderedArtifacts].sort(() => Math.random() - 0.5).map(a => a.id))
    } else {
      setDisplayOrder([...orderedArtifacts].sort(() => Math.random() - 0.5).map(a => a.id))
      setPositions(prev => {
        const next = { ...prev }
        orderedArtifacts.forEach(a => {
          next[a.id] = { x: 2 + Math.random() * 83, y: 2 + Math.random() * 88 }
        })
        return next
      })
      // Dramatic drift burst on shuffle
      setDriftState(() => {
        const next: Record<string, DriftOffset> = {}
        orderedArtifacts.forEach(a => {
          next[a.id] = {
            x:       randRange(-120, 120),
            y:       randRange(-120, 120),
            rotate:  randRange(-8, 8),
            scale:   randRange(0.93, 1.07),
            zOffset: Math.floor(randRange(-10, 10)),
          }
        })
        return next
      })
    }
  }

  useEffect(() => {
    if (shuffleSignal === 0) return
    executeShuffleRef.current()
  }, [shuffleSignal])

  useEffect(() => {
    if (viewMode !== "single") return
    const handleKey = (e: KeyboardEvent) => {
      if (expandedId) return
      const len = visibleArtifacts.length
      if (e.key === "ArrowLeft")  setSingleIndex(i => (i - 1 + len) % len)
      if (e.key === "ArrowRight") setSingleIndex(i => (i + 1) % len)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [viewMode, visibleArtifacts.length, expandedId])

  useEffect(() => {
    const handler = () => setDepositOpen(true)
    window.addEventListener("deposit:open", handler)
    return () => window.removeEventListener("deposit:open", handler)
  }, [])

  // Seed initial drift offsets when entering chaos view
  useEffect(() => {
    if (effectiveView !== "chaos") return
    setDriftState(prev => {
      const next = { ...prev }
      visibleArtifactsRef.current.forEach(a => {
        if (!next[a.id]) {
          next[a.id] = {
            x:       randRange(-20, 20),
            y:       randRange(-20, 20),
            rotate:  randRange(-3, 3),
            scale:   randRange(0.97, 1.03),
            zOffset: Math.floor(randRange(-3, 3)),
          }
        }
      })
      return next
    })
  }, [effectiveView])

  // Pause on hover / expand / drag; resume 3 s after last interaction
  useEffect(() => {
    if (inactivityTimerRef.current) { clearTimeout(inactivityTimerRef.current); inactivityTimerRef.current = null }
    if (effectiveView !== "chaos") return
    const isInteracting = hoveredId !== null || expandedId !== null || draggedId !== null
    if (isInteracting) {
      setDriftActive(false)
    } else {
      inactivityTimerRef.current = setTimeout(() => setDriftActive(true), 3000)
    }
    return () => { if (inactivityTimerRef.current) { clearTimeout(inactivityTimerRef.current); inactivityTimerRef.current = null } }
  }, [hoveredId, expandedId, draggedId, effectiveView])

  // Drift interval — 7 s initial delay on page load, then every 3 s
  useEffect(() => {
    if (!driftActive || effectiveView !== "chaos") return

    const fireDrift = () => {
      setDriftState(prev => {
        const next: Record<string, DriftOffset> = { ...prev }
        visibleArtifactsRef.current.forEach(a => {
          next[a.id] = {
            x:       randRange(-40, 40),
            y:       randRange(-40, 40),
            rotate:  randRange(-5, 5),
            scale:   randRange(0.96, 1.04),
            zOffset: Math.floor(randRange(-6, 6)),
          }
        })
        return next
      })
    }

    const initialDelay = hasStartedDriftRef.current ? 0 : 7000
    let intervalId: ReturnType<typeof setInterval>

    const timerId = setTimeout(() => {
      hasStartedDriftRef.current = true
      fireDrift()
      intervalId = setInterval(fireDrift, 3000)
    }, initialDelay)

    return () => { clearTimeout(timerId); clearInterval(intervalId) }
  }, [driftActive, effectiveView])

  // ── Drag handlers ───────────────────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent, id: string) {
    if (e.button !== 0) return
    e.preventDefault()
    containerRef.current?.setPointerCapture(e.pointerId)

    let currentPos = positions[id] ?? fallbackPosition(id)
    const drift = driftStateRef.current[id]
    if (drift && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const absorbed = {
        x: clamp(currentPos.x + (drift.x / rect.width  * 100), 0, 85),
        y: clamp(currentPos.y + (drift.y / rect.height * 100), 0, 95),
      }
      setPositions(prev => ({ ...prev, [id]: absorbed }))
      setDriftState(prev => ({ ...prev, [id]: { x: 0, y: 0, rotate: 0, scale: 1, zOffset: 0 } }))
      currentPos = absorbed
    }

    dragStateRef.current = { id, startX: e.clientX, startY: e.clientY, initialPos: { ...currentPos } }
    didDragRef.current = false
    setDraggedId(id)
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragStateRef.current
    if (!drag || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDragRef.current = true
    const newX = Math.max(0, Math.min(85, drag.initialPos.x + (dx / rect.width)  * 100))
    const newY = Math.max(0, Math.min(95, drag.initialPos.y + (dy / rect.height) * 100))
    setPositions(prev => ({ ...prev, [drag.id]: { x: newX, y: newY } }))
  }

  function handlePointerUp() {
    const drag    = dragStateRef.current
    const wasDrag = didDragRef.current
    const id      = drag?.id
    dragStateRef.current = null
    didDragRef.current   = false
    setDraggedId(null)
    if (!wasDrag && id) setExpandedId(id)
  }

  // ── Artifact lifecycle ──────────────────────────────────────────────────────

  async function handleDeleteComplete(id: string) {
    await fetch(`/api/artifacts/${id}`, { method: "DELETE" })
    setDeletingId(null)
    setDisplayOrder(prev => prev.filter(oid => oid !== id))
    setPositions(prev => { const { [id]: _, ...rest } = prev; return rest })
    router.refresh()
  }

  async function handlePublish(id: string) {
    await fetch(`/api/artifacts/${id}`, { method: "PATCH" })
    router.refresh()
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function wrapDelete(artifact: Artifact, content: React.ReactNode) {
    const isDeleting = deletingId === artifact.id
    return (
      <motion.div
        style={{ transformOrigin: "center center" }}
        {...(isDeleting ? {
          animate: DELETE_ANIMATE,
          transition: DELETE_TRANSITION,
          onAnimationComplete: () => handleDeleteComplete(artifact.id),
        } : {})}
      >
        {content}
      </motion.div>
    )
  }

  function card(artifact: Artifact, variant?: "default" | "grid" | "single") {
    const isDeleting = deletingId === artifact.id
    const isPending  = artifact.status === "pending"
    return wrapDelete(artifact, (
      <ArtifactCard
        artifact={artifact}
        isExpanded={expandedId === artifact.id}
        isDragging={draggedId === artifact.id}
        isDeleting={isDeleting}
        onDelete={isAdmin && !isDeleting ? () => setDeletingId(artifact.id) : undefined}
        onPublish={isAdmin && isPending && !isDeleting ? () => handlePublish(artifact.id) : undefined}
        variant={variant}
      />
    ))
  }

  const expandedArtifact = expandedId
    ? (orderedArtifacts.find(a => a.id === expandedId) ?? null)
    : null

  const safeIndex = visibleArtifacts.length > 0
    ? Math.min(singleIndex, visibleArtifacts.length - 1)
    : 0

  return (
    <>
      {/* ── CHAOS ─────────────────────────────────────────────── */}
      {effectiveView === "chaos" && (
        <div
          ref={containerRef}
          className="relative w-full min-h-[4200px]"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Sticky temporal depth indicator */}
          <div className="sticky top-0 h-0 w-full z-[45] pointer-events-none overflow-visible">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDepthYear}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute top-5 left-5 space-y-1.5"
              >
                <div className="text-[9px] text-muted-foreground/30 tracking-[0.3em] uppercase tabular-nums">
                  {currentDepthYear}
                </div>
                <div className="w-4 h-px bg-muted-foreground/15" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Year strata dividers */}
          {STRATA_YEARS.map((year, i) => (
            <div
              key={year}
              className="absolute left-0 right-0 pointer-events-none select-none"
              style={{ top: i * STRATUM_HEIGHT + 48 }}
            >
              <div className="flex items-center gap-4 px-5">
                <span className="text-[9px] tracking-[0.28em] text-muted-foreground/15 uppercase tabular-nums shrink-0">
                  {year}
                </span>
                <div className="flex-1 border-t border-muted-foreground/[0.05]" />
              </div>
            </div>
          ))}

          {/* Artifacts */}
          {visibleArtifacts.map((artifact, index) => {
            const pos        = positions[artifact.id] ?? fallbackPosition(artifact.id)
            const isDeleting = deletingId === artifact.id
            const isDragging = draggedId === artifact.id
            const isHovered  = hoveredId === artifact.id
            const drift      = driftState[artifact.id] ?? { x: 0, y: 0, rotate: 0, scale: 1, zOffset: 0 }
            const artDepth   = getArtifactDepth(artifact)
            const { scale: dScale, opacity: dOpacity, blur: dBlur, driftDuration } = getDepthProps(artDepth, depthCamera)

            return (
              <motion.div
                key={artifact.id}
                className={isDragging ? "absolute cursor-grabbing" : "absolute cursor-grab"}
                style={{
                  top:           `${pos.y}%`,
                  left:          `${pos.x}%`,
                  // Newer artifacts sit on top; drift adds z-variation within each layer
                  zIndex:        isDragging ? 100 : isHovered ? 50 : (10 - artDepth * 2) + (drift.zOffset ?? 0),
                  pointerEvents: isDeleting ? "none" : undefined,
                  // Blur in style (not animate) so it tracks scroll immediately
                  filter:        isDragging || isHovered ? undefined : dBlur > 0.05 ? `blur(${dBlur.toFixed(2)}px)` : undefined,
                }}
                animate={{
                  x:       isDragging ? 0 : drift.x,
                  y:       isDragging ? 0 : drift.y,
                  rotate:  isDragging ? 0 : drift.rotate,
                  scale:   isDragging ? 1.03 * dScale : isHovered ? 1.02 * dScale : (drift.scale ?? 1) * dScale,
                  opacity: isDragging ? 0.95 : dOpacity,
                }}
                transition={isDragging ? {
                  x: { duration: 0 }, y: { duration: 0 }, rotate: { duration: 0 },
                  scale:   { duration: 0.15, ease: "easeOut" },
                  opacity: { duration: 0.1 },
                } : {
                  x:       { duration: driftDuration,       ease: DRIFT_EASE },
                  y:       { duration: driftDuration + 0.5, ease: DRIFT_EASE },
                  rotate:  { duration: driftDuration + 1,   ease: DRIFT_EASE },
                  scale:   { duration: 8,                   ease: DRIFT_EASE },
                  opacity: { duration: 0.4 },
                }}
                onPointerDown={e => !isDeleting && handlePointerDown(e, artifact.id)}
                onMouseEnter={() => !dragStateRef.current && !isDeleting && setHoveredId(artifact.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {card(artifact)}
              </motion.div>
            )
          })}

          <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground/30 pointer-events-none select-none">
            {visibleArtifacts.length} fragments
          </div>
        </div>
      )}

      {/* ── GRID ──────────────────────────────────────────────── */}
      {effectiveView === "grid" && (
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleArtifacts.map(artifact => {
              const isDeleting = deletingId === artifact.id
              return (
                <div
                  key={artifact.id}
                  className={isDeleting ? "pointer-events-none" : "cursor-pointer"}
                  onClick={() => !isDeleting && setExpandedId(artifact.id)}
                >
                  {card(artifact, "grid")}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SINGLE ────────────────────────────────────────────── */}
      {effectiveView === "single" && visibleArtifacts.length > 0 && (
        <div className="h-full flex flex-col items-center justify-center p-8 md:p-12 overflow-hidden">
          <div
            className="w-full max-w-2xl cursor-pointer"
            onClick={() => setExpandedId(visibleArtifacts[safeIndex].id)}
          >
            {card(visibleArtifacts[safeIndex], "single")}
          </div>

          <div className="mt-6 flex items-center gap-8 text-[10px] text-muted-foreground select-none flex-none">
            <button
              onClick={() => setSingleIndex(i => (i - 1 + visibleArtifacts.length) % visibleArtifacts.length)}
              className="hover:text-foreground transition-colors"
            >
              ← prev
            </button>
            <span className="text-muted-foreground/40 tabular-nums">
              {safeIndex + 1} / {visibleArtifacts.length}
            </span>
            <button
              onClick={() => setSingleIndex(i => (i + 1) % visibleArtifacts.length)}
              className="hover:text-foreground transition-colors"
            >
              next →
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {expandedArtifact && (
          <ArtifactDetail
            key={expandedArtifact.id}
            artifact={expandedArtifact}
            onClose={() => setExpandedId(null)}
            onPublish={isAdmin && expandedArtifact.status === "pending" ? () => handlePublish(expandedArtifact.id) : undefined}
            onDelete={isAdmin ? () => { setExpandedId(null); setDeletingId(expandedArtifact.id) } : undefined}
          />
        )}
        {depositOpen && (
          <DepositForm
            key="deposit"
            onClose={() => setDepositOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
