"use client"

import { useViewContext, type ViewMode, type MediaFilter } from "@/lib/view-context"
import { useTheme } from "@/lib/theme"

const MODES: { value: ViewMode; label: string }[] = [
  { value: "chaos", label: "chaos" },
  { value: "grid",  label: "order" },
]

const FILTERS: { value: MediaFilter; label: string }[] = [
  { value: "all",   label: "all"   },
  { value: "image", label: "image" },
  { value: "video", label: "video" },
  { value: "audio", label: "audio" },
  { value: "words", label: "words" },
]

export function ViewControls() {
  const { viewMode, setViewMode, triggerShuffle, mediaFilter, setMediaFilter } = useViewContext()
  const { dark, toggle: toggleTheme } = useTheme()

  return (
    <div className="fixed bottom-5 right-5 md:bottom-7 md:right-7 z-[55] border border-foreground/[0.08] bg-background shadow-md dark:shadow-none rounded-[5px] overflow-hidden">

      {/* View mode */}
      <div className="flex items-center gap-6 px-6 py-2">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setViewMode(value)}
            className={`text-[10px] font-bold tracking-wide transition-colors duration-150 ${
              viewMode === value ? "bg-foreground/5 text-foreground px-2 py-0.5 rounded-[5px]" : "text-foreground/40 hover:text-foreground/60"
            }`}
          >
            {label}
          </button>
        ))}

        <button
          onClick={triggerShuffle}
          className="group/shuffle transition-colors duration-150"
        >
          <img src="/shuffle.svg" alt="shuffle" className="w-4 h-4 opacity-40 group-hover/shuffle:opacity-60 dark:invert" />
        </button>

        <button
          onClick={toggleTheme}
          className="text-[10px] text-foreground/40 hover:text-foreground/70 transition-colors duration-150 leading-none"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? "○" : "●"}
        </button>
      </div>

      <div className="border-t border-foreground/[0.08]" />

      {/* Media type filter */}
      <div className="flex items-center gap-6 px-6 py-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setMediaFilter(value)}
            className={`text-[10px] font-bold tracking-wide transition-colors duration-150 ${
              mediaFilter === value ? "bg-foreground/5 text-foreground px-2 py-0.5 rounded-[5px]" : "text-foreground/40 hover:text-foreground/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

    </div>
  )
}
