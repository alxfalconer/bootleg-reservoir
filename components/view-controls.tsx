"use client"

import { useEffect, useRef } from "react"
import { motion, useMotionValue } from "motion/react"
import { Image as ImageIcon, Link as LinkIcon, Shuffle as ShuffleIcon, Play as PlayIcon, Pause as PauseIcon } from "lucide-react"
import { useViewContext, type ViewMode, type MediaFilter } from "@/lib/view-context"
import { useTheme } from "@/lib/theme"

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: "chaos", label: "Field" },
  { value: "grid",  label: "Index" },
]

const BORDER = "border-foreground/[0.13]"
const POS_KEY = "rsv-panel-pos"

export function ViewControls() {
  const { viewMode, setViewMode, triggerShuffle, mediaFilter, setMediaFilter, autoplay, setAutoplay } = useViewContext()
  const { dark, toggle: toggleTheme } = useTheme()
  const constraintsRef = useRef<HTMLDivElement>(null)
  const isDraggingRef  = useRef(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(POS_KEY)
      if (saved) {
        const pos = JSON.parse(saved)
        x.set(pos.x)
        y.set(pos.y)
      }
    } catch {}
  }, [])

  function handleDragEnd() {
    setTimeout(() => { isDraggingRef.current = false }, 0)
    try {
      localStorage.setItem(POS_KEY, JSON.stringify({ x: x.get(), y: y.get() }))
    } catch {}
  }

  function guard(fn: () => void) {
    return () => { if (!isDraggingRef.current) fn() }
  }

  const filters: { value: MediaFilter; icon: React.ReactNode; title: string }[] = [
    { value: "all",   title: "All",   icon: <span className="text-[15px] leading-none">◇</span> },
    { value: "image", title: "Image", icon: <ImageIcon size={15} strokeWidth={1.6} /> },
    { value: "video", title: "Video", icon: <span className="text-[12px] leading-none">▶</span> },
    { value: "audio", title: "Audio", icon: <span className="text-[15px] leading-none">♫</span> },
    { value: "text",  title: "Text",  icon: <span className="text-[15px] leading-none font-serif">¶</span> },
    { value: "link",  title: "Link",  icon: <LinkIcon size={15} strokeWidth={1.6} /> },
  ]

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[55]">
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => { isDraggingRef.current = true }}
        onDragEnd={handleDragEnd}
        style={{ x, y, bottom: 20, right: 20 }}
        className={`absolute pointer-events-auto border ${BORDER} bg-background/[0.97] backdrop-blur-md overflow-hidden select-none shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] rounded-[5px] cursor-grab active:cursor-grabbing`}
      >

        {/* View mode: Field / Index */}
        <div className={`flex items-stretch border-b ${BORDER}`}>
          {VIEW_MODES.map(({ value, label }, i) => (
            <button
              key={value}
              onPointerDown={e => e.stopPropagation()}
              onClick={guard(() => { setViewMode(value); if (value === "chaos") setMediaFilter("all"); else setAutoplay(false) })}
              className={`flex-1 text-[9px] font-bold tracking-widest uppercase px-3 py-2 transition-colors duration-100 text-center cursor-pointer
                ${i > 0 ? `border-l ${BORDER}` : ""}
                ${viewMode === value
                  ? "text-foreground bg-foreground/[0.07]"
                  : "text-foreground/30 hover:text-foreground/55"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Play / Pause — Field mode only */}
        {viewMode === "chaos" && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={guard(() => setAutoplay(!autoplay))}
            title={autoplay ? "Pause" : "Play"}
            className={`w-full flex items-center justify-center py-2.5 border-b ${BORDER} transition-colors duration-100 cursor-pointer
              ${autoplay
                ? "text-foreground hover:text-foreground/70 bg-foreground/[0.04]"
                : "text-foreground/35 hover:text-foreground/70 hover:bg-foreground/[0.03]"
              }`}
          >
            {autoplay
              ? <PauseIcon size={16} strokeWidth={1.6} />
              : <PlayIcon  size={16} strokeWidth={1.6} />
            }
          </button>
        )}

        {/* Shuffle — primary action */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={guard(triggerShuffle)}
          title="Shuffle"
          className={`w-full flex items-center justify-center py-2.5 border-b ${BORDER} text-foreground/35 hover:text-foreground/70 hover:bg-foreground/[0.03] transition-colors duration-100 cursor-pointer`}
        >
          <ShuffleIcon size={20} strokeWidth={1.4} />
        </button>

        {/* Filter grid: 2 × 3, icon only */}
        <div className="grid grid-cols-2">
          {filters.map(({ value, icon, title }, i) => {
            const active   = mediaFilter === value
            const rightCol = i % 2 !== 0
            const lastRow  = i >= filters.length - 2
            return (
              <button
                key={value}
                onPointerDown={e => e.stopPropagation()}
                onClick={guard(() => { setMediaFilter(value); if (value !== "all") setViewMode("grid") })}
                title={title}
                className={`flex items-center justify-center py-3 transition-colors duration-100 cursor-pointer
                  ${rightCol ? `border-l ${BORDER}` : ""}
                  ${!lastRow ? `border-b ${BORDER}` : ""}
                  ${active
                    ? "text-foreground bg-foreground/[0.08]"
                    : "text-foreground/30 hover:text-foreground/60 hover:bg-foreground/[0.03]"
                  }`}
              >
                {icon}
              </button>
            )
          })}
        </div>

        {/* Theme toggle */}
        <div className={`border-t ${BORDER} flex items-center justify-center px-3 py-2.5`}>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={guard(toggleTheme)}
            title={dark ? "Switch to light" : "Switch to dark"}
            className={`relative w-full h-[18px] rounded-full border ${BORDER} bg-foreground/[0.05] transition-colors duration-200 cursor-pointer`}
          >
            <span
              className={`absolute top-[2px] w-[12px] h-[12px] rounded-full transition-all duration-200 bg-foreground/60 ${
                dark ? "left-[calc(100%-14px)]" : "left-[2px]"
              }`}
            />
          </button>
        </div>

      </motion.div>
    </div>
  )
}
