"use client"

import { useRef, useState, useEffect } from "react"

function fmt(s: number): string {
  if (!isFinite(s) || isNaN(s)) return "--:--"
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`
}

export function AudioPlayer({ src, title }: { src: string; title?: string }) {
  const audioRef              = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime = () => setCurrent(el.currentTime)
    const onMeta = () => setDuration(el.duration)
    const onEnd  = () => { setPlaying(false); setCurrent(0) }
    el.addEventListener("timeupdate",     onTime)
    el.addEventListener("loadedmetadata", onMeta)
    el.addEventListener("ended",          onEnd)
    return () => {
      el.removeEventListener("timeupdate",     onTime)
      el.removeEventListener("loadedmetadata", onMeta)
      el.removeEventListener("ended",          onEnd)
    }
  }, [])

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    const el = audioRef.current
    if (!el) return
    if (playing) { el.pause(); setPlaying(false) }
    else         { el.play();  setPlaying(true)  }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation()
    const el = audioRef.current
    if (!el || !duration) return
    const r = e.currentTarget.getBoundingClientRect()
    el.currentTime = ((e.clientX - r.left) / r.width) * duration
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div
      className="min-w-[220px] p-4 select-none"
      onPointerDown={e => e.stopPropagation()}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {title && (
        <div className="mb-3 text-[10px] text-foreground leading-snug">
          {title}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="w-4 text-[13px] text-foreground hover:opacity-50 transition-opacity leading-none text-center"
          aria-label={playing ? "pause" : "play"}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button
          onClick={e => { e.stopPropagation(); const el = audioRef.current; if (!el) return; el.currentTime = 0; el.play(); setPlaying(true); setCurrent(0) }}
          className="text-[13px] text-foreground hover:opacity-50 transition-opacity leading-none"
          aria-label="restart"
        >
          ↺
        </button>
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
          {fmt(current)}&thinsp;/&thinsp;{fmt(duration)}
        </span>
      </div>

      <div
        className="mt-3 h-px bg-border cursor-pointer relative"
        onClick={seek}
        onPointerDown={e => e.stopPropagation()}
      >
        <div
          className="absolute inset-y-0 left-0 bg-foreground transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
