"use client"

import { useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"

type State = "idle" | "loading" | "sent" | "error"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<State>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState("loading")
    setErrorMsg("")

    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErrorMsg(error.message)
      setState("error")
    } else {
      setState("sent")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-sm">

        <div className="mb-10 space-y-1">
          <h1 className="text-sm font-bold tracking-tight">Reservoir</h1>
          <p className="text-[10px] text-muted-foreground">est. 2024</p>
        </div>

        {state === "sent" ? (
          <div className="space-y-2">
            <p className="text-xs text-foreground">Check your email.</p>
            <p className="text-[10px] text-muted-foreground">
              A link was sent to {email}. Click it to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                email
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-transparent border border-border text-[11px] text-foreground px-2 py-1.5 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground/40"
                placeholder="you@example.com"
              />
            </div>

            {state === "error" && (
              <p className="text-[10px] text-red-500/70">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={state === "loading"}
              className="text-[10px] border border-border px-4 py-1.5 text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {state === "loading" ? "sending…" : "send magic link"}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
