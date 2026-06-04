"use client"

import { useViewContext, type ViewMode } from "@/lib/view-context"

const MODES: { value: ViewMode; label: string }[] = [
  { value: "chaos",  label: "chaos"  },
  { value: "grid",   label: "grid"   },
  { value: "single", label: "single" },
]

export function ViewControls() {
  const { viewMode, setViewMode, triggerShuffle } = useViewContext()

  return (
    <div className="fixed bottom-5 right-5 md:bottom-7 md:right-7 z-[55] flex items-center gap-0.5 rounded-full border border-foreground/[0.08] bg-background/80 backdrop-blur-md shadow-md p-1">

      {MODES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setViewMode(value)}
          className={`rounded-full px-3 py-1.5 text-[10px] tracking-wide transition-all duration-150 ${
            viewMode === value
              ? "bg-foreground/[0.07] text-foreground"
              : "text-foreground/40 hover:text-foreground/60"
          }`}
        >
          {label}
        </button>
      ))}

      <div className="mx-1 h-3 w-px bg-foreground/[0.12]" />

      <button
        onClick={triggerShuffle}
        className="rounded-full px-3 py-1.5 text-[10px] tracking-wide text-foreground/40 transition-colors duration-150 hover:text-foreground/60"
      >
        shuffle
      </button>

    </div>
  )
}
