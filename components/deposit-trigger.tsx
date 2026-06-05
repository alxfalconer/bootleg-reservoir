"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function DepositTrigger({ collapsed }: { collapsed?: boolean } = {}) {
  const { user } = useAuth()
  const router = useRouter()

  const handleClick = () => {
    if (!user) {
      router.push("/login")
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
      className="text-xs border border-foreground/20 px-3 py-1 text-foreground bg-foreground/5 hover:bg-foreground hover:text-background transition-colors"
    >
      deposit
    </button>
  )
}
