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

// ── Chaos field constants ─────────────────────────────────────────────────────

const SCROLL_PER_LAYER  = 1050
const NUM_LAYERS        = 5
const MAX_SCROLL_LAYERS = 999

// ── Pure helpers ──────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function randRange(min: number, max: number) { return min + Math.random() * (max - min) }

// Phase-based scroll mapping for each layer cycle.
// Raw frac (0→1) is remapped so the active layer holds at full visibility
// for the first 65% of its scroll budget, then transitions out over the
// final 35%.  Smoothstep easing softens the start of the exit so the
// layer doesn't abruptly begin receding.
//
//   enter + hold (0–65%):  mappedFrac = 0  → relPos stays at 0, full visibility
//   exit       (65–100%):  mappedFrac 0→1  → layer recedes using normal depth curve
//
function applyHoldPhase(rawFrac: number): number {
  const HOLD_END = 0.65
  if (rawFrac <= HOLD_END) return 0
  const t = (rawFrac - HOLD_END) / (1 - HOLD_END)
  return t * t * (3 - 2 * t)  // smoothstep: gentle start, clean finish
}

// relPos 0 = active surface, 1 = next behind, 2 = deeper, <0 = exiting
function getLayerTransform(relPos: number) {
  if (relPos < 0) {
    const t = clamp(-relPos, 0, 1)
    return {
      scale:         1 + t * 0.18,
      opacity:       Math.max(0, 1 - t * 2.5),
      blur:          0,
      contrast:      1,
      saturate:      1,
      pointerEvents: (t > 0.05 ? "none" : "auto") as "none" | "auto",
    }
  }
  if (relPos <= 1) {
    const t = relPos
    return {
      scale:         lerp(1,    0.65,  t),
      opacity:       lerp(1,    0.20,  t),
      blur:          lerp(0,    4,     t),
      contrast:      lerp(1,    0.72,  t),
      saturate:      lerp(1,    0.50,  t),
      pointerEvents: (t < 0.6 ? "auto" : "none") as "none" | "auto",
    }
  }
  if (relPos <= 2) {
    const t = relPos - 1
    return {
      scale:         lerp(0.65, 0.35, t),
      opacity:       lerp(0.20, 0.08, t),
      blur:          lerp(4,    8,    t),
      contrast:      lerp(0.72, 0.45, t),
      saturate:      lerp(0.50, 0.20, t),
      pointerEvents: "none" as const,
    }
  }
  if (relPos <= 3) {
    const t = relPos - 2
    return {
      scale:         lerp(0.35, 0.20, t),
      opacity:       lerp(0.08, 0.03, t),
      blur:          lerp(8,    12,   t),
      contrast:      lerp(0.45, 0.35, t),
      saturate:      lerp(0.20, 0.10, t),
      pointerEvents: "none" as const,
    }
  }
  return {
    scale: 0.20, opacity: 0.02, blur: 14, contrast: 0.30, saturate: 0.08,
    pointerEvents: "none" as const,
  }
}

// Wang hash — sequential IDs avalanche into independent positions
function fallbackPosition(id: string): { x: number; y: number } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  h = h ^ (h >>> 16)
  const u = h >>> 0
  return { x: (u % 72) + 5, y: ((u >>> 11) % 42) + 4 }
}

// Deterministic position seeded by (id + slot index) — safe for SSR
function buildSlotPositions(
  ids: string[],
  seed: number,
): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {}
  ids.forEach(id => { pos[id] = fallbackPosition(`${id}:${seed}`) })
  return pos
}

// Random positions used only at runtime (never during SSR)
function generateLayerPositions(
  ids: string[],
): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {}
  ids.forEach(id => { pos[id] = { x: 5 + Math.random() * 72, y: 4 + Math.random() * 42 } })
  return pos
}

// ── Layer slot ────────────────────────────────────────────────────────────────
//
// A slot is one stratum in the depth field: a subset of artifacts at a specific
// depth plane.  This replaces year-based grouping from the temporal version —
// `artifactIds` here plays the same role that `depositYear === year` filtering
// played before.  The slot key is stable across depth rotation so React reuses
// the DOM node as the slot moves from depth 4 → 3 → 2 → 1 → 0 → exit.

interface LayerSlot {
  key:         number
  artifactIds: string[]   // the subset of artifacts that belong to this stratum
  positions:   Record<string, { x: number; y: number }>
}

// Round-robin assignment is deterministic (safe for hydration).
// Slot 0 gets artifact 0, 5, 10, …  Slot 1 gets artifact 1, 6, 11, … etc.
function buildInitialSlots(artifacts: Artifact[]): LayerSlot[] {
  const groups = Array.from({ length: NUM_LAYERS }, (_, i) =>
    artifacts.filter((_, j) => j % NUM_LAYERS === i).map(a => a.id),
  )
  return groups.map((ids, seed) => ({
    key:         seed,
    artifactIds: ids,
    positions:   buildSlotPositions(ids, seed),
  }))
}

// Randomly assigns ~1/NUM_LAYERS of the artifact pool to a new slot.
function generateNewSlot(artifacts: Artifact[], key: number): LayerSlot {
  const shuffled = [...artifacts].sort(() => Math.random() - 0.5)
  const size     = Math.max(1, Math.round(shuffled.length / NUM_LAYERS))
  const ids      = shuffled.slice(0, size).map(a => a.id)
  return { key, artifactIds: ids, positions: generateLayerPositions(ids) }
}

// ── Chaos state persistence ───────────────────────────────────────────────────
//
// Saves layer assignments + positions after every full shuffle so the field
// survives a page refresh.  Layer assignments are the only meaningful data —
// Supabase artifact records are never mutated.

const CHAOS_STATE_KEY = "rsv-chaos-state"

interface ChaosLocalState {
  layerMap:  Record<string, number>
  positions: Record<string, { x: number; y: number }>
}

function saveChaosLocalState(slots: LayerSlot[]): void {
  try {
    const layerMap:  Record<string, number>                    = {}
    const positions: Record<string, { x: number; y: number }> = {}
    slots.forEach((slot, i) => {
      slot.artifactIds.forEach(id => {
        layerMap[id] = i
        if (slot.positions[id]) positions[id] = slot.positions[id]
      })
    })
    localStorage.setItem(CHAOS_STATE_KEY, JSON.stringify({ layerMap, positions }))
  } catch {}
}

function loadChaosLocalState(): ChaosLocalState | null {
  try {
    const raw = localStorage.getItem(CHAOS_STATE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// Reconstruct slots from a saved state, round-robin-placing any new artifacts
// that weren't present when the state was saved.
function buildSlotsFromLocalState(
  artifacts: Artifact[],
  state: ChaosLocalState,
): LayerSlot[] {
  const groups: string[][] = Array.from({ length: NUM_LAYERS }, () => [])
  artifacts.forEach((a, i) => {
    const layer = state.layerMap[a.id] !== undefined
      ? clamp(state.layerMap[a.id], 0, NUM_LAYERS - 1)
      : i % NUM_LAYERS
    groups[layer].push(a.id)
  })
  return groups.map((ids, seed) => ({
    key:         seed,
    artifactIds: ids,
    positions:   Object.fromEntries(
      ids.map(id => [id, state.positions[id] ?? fallbackPosition(`${id}:${seed}`)]),
    ),
  }))
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
  const router   = useRouter()
  const { user } = useAuth()
  const isAdmin  = !!user
  const { viewMode, shuffleSignal, mediaFilter } = useViewContext()
  const effectiveView = mediaFilter !== "all" ? "grid" : viewMode
  const { allArtifacts } = useArtifacts(serverArtifacts)

  const scrollTrackRef      = useRef<HTMLDivElement>(null)
  const containerRef        = useRef<HTMLDivElement>(null)
  const dragStateRef        = useRef<DragState | null>(null)
  const didDragRef          = useRef(false)
  const isFirstRender       = useRef(true)
  const executeShuffleRef   = useRef<() => void>(() => {})
  const driftStateRef       = useRef<Record<string, DriftOffset>>({})
  const inactivityTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visibleArtifactsRef = useRef<Artifact[]>([])
  const hasStartedDriftRef  = useRef(false)
  const consumedCountRef    = useRef(0)
  const slotKeyCounterRef   = useRef(NUM_LAYERS)
  const slotsRef            = useRef<LayerSlot[]>([])

  const [slots,        setSlots]        = useState<LayerSlot[]>(() => buildInitialSlots(serverArtifacts))
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

  // scrollProgress drives all layer transforms, same as the temporal version.
  // rawFrac is the linear 0→1 position within the current layer's scroll budget.
  // mappedFrac applies the hold-phase curve so the active layer stays stable
  // for the first 65% of its budget before beginning the depth transition.
  const scrollProgress = scrollY / SCROLL_PER_LAYER
  const rawFrac        = scrollProgress - Math.floor(scrollProgress)
  const mappedFrac     = applyHoldPhase(rawFrac)

  useEffect(() => { driftStateRef.current = driftState }, [driftState])
  useEffect(() => { slotsRef.current = slots }, [slots])

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
    if (mediaFilter === "text") return orderedArtifacts.filter(a => a.type === "text" || a.type === "found text")
    if (mediaFilter === "link") return orderedArtifacts.filter(a => (a.type as string) === "link")
    return orderedArtifacts.filter(a => a.media.type === mediaFilter)
  }, [orderedArtifacts, mediaFilter])

  useEffect(() => { visibleArtifactsRef.current = visibleArtifacts }, [visibleArtifacts])

  useEffect(() => { setDisplayOrder(loadDisplayOrder()) }, [])

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    try { localStorage.setItem(DISPLAY_ORDER_KEY, JSON.stringify(displayOrder)) } catch {}
  }, [displayOrder])

  // Distribute newly deposited artifacts into slots (round-robin by slot index).
  useEffect(() => {
    setSlots(prev => {
      const known    = new Set(prev.flatMap(s => s.artifactIds))
      const incoming = allArtifacts.filter(a => !known.has(a.id))
      if (incoming.length === 0) return prev
      const next = prev.map(s => ({
        ...s,
        artifactIds: [...s.artifactIds],
        positions:   { ...s.positions },
      }))
      incoming.forEach((a, i) => {
        const target = i % NUM_LAYERS
        next[target].artifactIds.push(a.id)
        next[target].positions[a.id] = fallbackPosition(a.id)
      })
      return next
    })
  }, [allArtifacts])

  // Reset chaos field whenever the view is entered.
  // Restores a previously shuffled state from localStorage if available;
  // otherwise falls back to the deterministic initial layout.
  useEffect(() => {
    if (effectiveView !== "chaos") return
    if (scrollTrackRef.current?.parentElement) {
      scrollTrackRef.current.parentElement.scrollTop = 0
    }
    setScrollY(0)
    consumedCountRef.current   = 0
    slotKeyCounterRef.current  = NUM_LAYERS
    hasStartedDriftRef.current = false
    setSlots(() => {
      const arts  = visibleArtifactsRef.current
      const all   = arts.length > 0 ? arts : serverArtifacts
      const saved = loadChaosLocalState()
      if (saved) return buildSlotsFromLocalState(all, saved)
      return buildInitialSlots(all)
    })
  }, [effectiveView]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll listener + slot rotation — mirrors the temporal scroll listener but
  // also rotates the slot stack when a layer has been fully scrolled past.
  useEffect(() => {
    if (effectiveView !== "chaos") return
    const el = scrollTrackRef.current?.parentElement
    if (!el) return
    const onScroll = () => {
      const newScrollY  = el.scrollTop
      setScrollY(newScrollY)
      setHoveredId(null)

      const newConsumed = Math.floor(newScrollY / SCROLL_PER_LAYER)
      if (newConsumed > consumedCountRef.current) {
        const advances    = newConsumed - consumedCountRef.current
        consumedCountRef.current = newConsumed
        // Capture keys/positions outside the updater to avoid StrictMode double-calls
        const newKeys     = Array.from({ length: advances }, () => slotKeyCounterRef.current++)
        const newSlots    = newKeys.map(key =>
          generateNewSlot(visibleArtifactsRef.current, key),
        )
        setSlots(prev => {
          let next = [...prev]
          for (let i = 0; i < advances; i++) {
            const [, ...rest] = next
            next = [...rest, newSlots[i]]
          }
          return next
        })
      }
    }
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
      // Chaos: fully recompose the field — redistribute artifacts across all
      // five layers, generate new positions, randomize drift for every artifact.
      // Round-robin after shuffle guarantees each layer receives ~N/5 artifacts
      // rather than risking accidental clustering from pure random assignment.
      const arts = visibleArtifactsRef.current
      if (arts.length === 0) return

      const shuffled  = [...arts].sort(() => Math.random() - 0.5)
      const groups: string[][] = Array.from({ length: NUM_LAYERS }, () => [])
      shuffled.forEach((a, i) => { groups[i % NUM_LAYERS].push(a.id) })

      const newSlots: LayerSlot[] = groups.map(ids => ({
        key:         slotKeyCounterRef.current++,
        artifactIds: ids,
        positions:   generateLayerPositions(ids),
      }))

      // Scroll back to the surface so the newly composed layer 0 is active
      const el = scrollTrackRef.current?.parentElement
      if (el) el.scrollTop = 0
      setScrollY(0)
      consumedCountRef.current = 0

      setSlots(newSlots)

      setDriftState(() => {
        const next: Record<string, DriftOffset> = {}
        arts.forEach(a => {
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

      saveChaosLocalState(newSlots)
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

    let currentPos = slotsRef.current[0]?.positions[id] ?? fallbackPosition(id)
    const drift = driftStateRef.current[id]
    if (drift && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const absorbed = {
        x: clamp(currentPos.x + (drift.x / rect.width  * 100), 0, 82),
        y: clamp(currentPos.y + (drift.y / rect.height * 100), 0, 50),
      }
      setSlots(prev => {
        const next = [...prev]
        next[0] = { ...next[0], positions: { ...next[0].positions, [id]: absorbed } }
        return next
      })
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
    const newX = Math.max(0, Math.min(82, drag.initialPos.x + (dx / rect.width)  * 100))
    const newY = Math.max(0, Math.min(50, drag.initialPos.y + (dy / rect.height) * 100))
    setSlots(prev => {
      const next = [...prev]
      next[0] = { ...next[0], positions: { ...next[0].positions, [drag.id]: { x: newX, y: newY } } }
      return next
    })
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
    setSlots(prev => prev.map(slot => {
      const { [id]: _, ...rest } = slot.positions
      return { ...slot, artifactIds: slot.artifactIds.filter(aid => aid !== id), positions: rest }
    }))
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
        // Scroll track — large enough to be effectively infinite
        <div
          ref={scrollTrackRef}
          style={{ height: `calc(${MAX_SCROLL_LAYERS * SCROLL_PER_LAYER}px + 100vh)` }}
          className="relative"
        >
          {/* Sticky 100vh viewport — stays pinned while scroll track passes beneath */}
          <div
            ref={containerRef}
            className="sticky top-0 h-screen overflow-hidden"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >

            {/*
              Depth strata — the direct structural equivalent of the temporal
              STRATA_YEARS.map loop.

              Temporal version:   STRATA_YEARS.map((year, layerIndex) => {
                                    relPos = layerIndex - scrollProgress
                                    layerArtifacts = filter(a => a.depositYear === year)
                                  })

              Chaos version:      slots.map((slot, depth) => {
                                    relPos = depth - frac
                                    layerArtifacts = filter(a => slot.artifactIds has a.id)
                                  })

              `slot.key` is stable as the slot moves through depths, so React
              reuses the DOM node (avoiding flash) as each slot rises from
              depth 4 → 3 → 2 → 1 → 0 → exit.
            */}
            {slots.map((slot, depth) => {
              const relPos = depth - mappedFrac
              const { scale, opacity, blur, contrast, saturate, pointerEvents } = getLayerTransform(relPos)
              const driftDuration = 9 + depth * 1.5
              const idSet         = new Set(slot.artifactIds)
              const layerArtifacts = visibleArtifacts.filter(a => idSet.has(a.id))

              return (
                <div
                  key={slot.key}
                  className="absolute inset-0"
                  style={{
                    transform:     `scale(${scale.toFixed(4)})`,
                    opacity,
                    filter:        `blur(${blur.toFixed(2)}px) contrast(${contrast.toFixed(2)}) saturate(${saturate.toFixed(2)})`,
                    zIndex:        NUM_LAYERS - depth,
                    pointerEvents,
                    transition:    "transform 0.08s ease-out, opacity 0.08s ease-out, filter 0.12s ease-out",
                    willChange:    "transform, opacity, filter",
                  }}
                >
                  {layerArtifacts.map(artifact => {
                    const pos        = slot.positions[artifact.id] ?? fallbackPosition(artifact.id)
                    const isDeleting = deletingId === artifact.id
                    const isDragging = draggedId === artifact.id
                    const isHovered  = hoveredId === artifact.id
                    const drift      = driftState[artifact.id] ?? { x: 0, y: 0, rotate: 0, scale: 1, zOffset: 0 }

                    return (
                      <motion.div
                        key={artifact.id}
                        className={isDragging ? "absolute cursor-grabbing" : "absolute cursor-grab"}
                        style={{
                          top:           `${pos.y}%`,
                          left:          `${pos.x}%`,
                          zIndex:        isDragging ? 100 : isHovered ? 50 : 10 + (drift.zOffset ?? 0),
                          pointerEvents: isDeleting ? "none" : undefined,
                        }}
                        animate={{
                          x:       isDragging ? 0 : drift.x,
                          y:       isDragging ? 0 : drift.y,
                          rotate:  isDragging ? 0 : drift.rotate,
                          scale:   isDragging ? 1.03 : isHovered ? 1.02 : (drift.scale ?? 1),
                          opacity: isDragging ? 0.95 : 1,
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
                </div>
              )
            })}

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
