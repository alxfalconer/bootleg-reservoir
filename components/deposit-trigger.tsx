"use client"

export function DepositTrigger({ collapsed }: { collapsed?: boolean } = {}) {
  const dispatch = () => window.dispatchEvent(new CustomEvent("deposit:open"))

  if (collapsed) {
    return (
      <button
        onClick={dispatch}
        className="text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
        title="Deposit"
      >
        +
      </button>
    )
  }

  return (
    <button
      onClick={dispatch}
      className="text-xs border border-foreground/20 px-3 py-1 text-foreground bg-foreground/5 hover:bg-foreground hover:text-background transition-colors"
    >
      deposit
    </button>
  )
}
