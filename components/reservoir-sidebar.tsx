"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DepositTrigger } from "@/components/deposit-trigger"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseBrowser } from "@/lib/supabase/client"
export function ReservoirSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const toggleSidebar = () => setIsCollapsed(c => !c)
  const { user } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.refresh()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); toggleSidebar() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <aside
      className="group/panel relative hidden md:flex flex-none flex-col border-r border-border bg-background overflow-hidden transition-[width] duration-300 ease-in-out"
      style={{ width: isCollapsed ? "56px" : "clamp(280px, 20vw, 420px)" }}
    >
      {/* ── COLLAPSED RAIL ─────────────────────────────── */}
      <div
        className="absolute inset-y-0 left-0 flex flex-col items-center py-8 gap-6 transition-opacity duration-200"
        style={{
          width: "56px",
          opacity:         isCollapsed ? 1 : 0,
          pointerEvents:   isCollapsed ? "auto" : "none",
          transitionDelay: isCollapsed ? "150ms" : "0ms",
        }}
      >
        <button
          onClick={toggleSidebar}
          className="text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
          title="Expand (⌘B)"
        >
          ›
        </button>
        <span
          className="text-[9px] font-bold tracking-widest text-muted-foreground/30 select-none"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          RESERVOIR
        </span>
        <div className="mt-auto mb-2">
          <DepositTrigger collapsed />
        </div>
      </div>

      {/* ── EXPANDED CONTENT ────────────────────────────── */}
      <div
        className="flex flex-col flex-1 px-8 py-8 overflow-y-auto transition-opacity duration-200"
        style={{
          opacity:         isCollapsed ? 0 : 1,
          pointerEvents:   isCollapsed ? "none" : "auto",
          transitionDelay: isCollapsed ? "0ms" : "150ms",
          minWidth: "280px",
        }}
      >
        {/* Title + collapse trigger */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-sm font-bold tracking-tight">Reservoir</h1>
            <p className="text-[10px] text-muted-foreground italic">When you cut into the present the future leaks out.</p>
          </div>
          <button
            onClick={toggleSidebar}
            className="opacity-0 group-hover/panel:opacity-100 transition-opacity duration-150 text-[10px] text-muted-foreground/40 hover:text-foreground mt-0.5"
            title="Collapse (⌘B)"
          >
            ‹
          </button>
        </div>

        {/* Manifesto */}
        <div className="mt-10 space-y-6">
          <div className="space-y-4 text-xs leading-relaxed text-foreground/90">
            <p>
              If you&apos;re here I either admire your taste or consider it so atrocious that it enters visionary territory.
            </p>
            <p>
              This place is for pooling artifacts. Deposit field recordings, video, images, words, slop, copyrighted material, nudes, ads, etc.
            </p>
            <p>
              Slicing, stitching and smashing pieces together till strange patterns emerge is a religious experience.
            </p>
            <p>
              Credits aren&apos;t publicized on the site but can be posted on release of completed material, per request.
            </p>
          </div>
          <div className="mt-10">
            <DepositTrigger />
          </div>

        </div>

        {/* Bottom — invite only / signed in state */}
        <div className="mt-auto pt-10 space-y-2">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-muted-foreground/60 truncate max-w-[160px]">
                {user.email}
              </div>
              <button
                onClick={handleSignOut}
                className="text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors ml-2"
              >
                sign out
              </button>
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground/60">
              <span className="inline-block w-2 h-2 bg-muted-foreground/30 mr-1" />
              invite only
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
