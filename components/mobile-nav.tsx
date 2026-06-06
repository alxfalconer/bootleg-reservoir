"use client"

import { Shuffle as ShuffleIcon, Moon, Sun } from "lucide-react"
import { useViewContext } from "@/lib/view-context"
import { useTheme } from "@/lib/theme"
import { useAuth } from "@/lib/auth-context"

export function MobileNav() {
  const { triggerShuffle } = useViewContext()
  const { dark, toggle: toggleTheme } = useTheme()
  const { user } = useAuth()

  function handleDeposit() {
    if (!user) {
      window.dispatchEvent(new CustomEvent("login:open"))
      return
    }
    window.dispatchEvent(new CustomEvent("deposit:open"))
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-foreground/[0.07]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center h-14 px-6">
        <button
          onClick={handleDeposit}
          className="flex-1 flex items-center justify-center text-[9px] font-bold tracking-widest uppercase text-foreground/70 active:text-foreground transition-colors"
        >
          Deposit
        </button>

        <button
          onClick={triggerShuffle}
          className="flex-1 flex items-center justify-center text-foreground/35 active:text-foreground transition-colors"
          title="Shuffle"
        >
          <ShuffleIcon size={17} strokeWidth={1.4} />
        </button>

        <button
          onClick={toggleTheme}
          className="flex-1 flex items-center justify-center text-foreground/35 active:text-foreground transition-colors"
          title={dark ? "Light mode" : "Dark mode"}
        >
          {dark
            ? <Sun  size={17} strokeWidth={1.4} />
            : <Moon size={17} strokeWidth={1.4} />
          }
        </button>
      </div>
    </nav>
  )
}
