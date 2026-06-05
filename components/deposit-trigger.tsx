"use client"

import { useAuth } from "@/lib/auth-context"

export function DepositTrigger({ collapsed }: { collapsed?: boolean } = {}) {
  const { user } = useAuth()

  const handleClick = () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent("login:open"))
      return
    }
    window.dispatchEvent(new CustomEvent("deposit:open"))
  }

  if (collapsed) {
    return (
      <button
        onClick={handleClick}
        className="text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
        title="Deposit"
      >
        +
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="text-[8px] font-bold tracking-widest uppercase px-3 py-1 bg-foreground text-background hover:bg-foreground/70 transition-colors duration-200"
    >
      deposit
    </button>
  )
}
