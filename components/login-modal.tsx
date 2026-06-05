"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { getSupabaseBrowser } from "@/lib/supabase/client"

type State = "idle" | "loading" | "sent" | "error"

export function LoginModal() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [state, setState] = useState<State>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("login:open", handler)
    return () => window.removeEventListener("login:open", handler)
  }, [])

  function close() {
    setOpen(false)
    setEmail("")
    setState("idle")
    setErrorMsg("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState("loading")
    setErrorMsg("")

    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setErrorMsg(error.message)
      setState("error")
    } else {
      setState("sent")
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm bg-background/40"
            onClick={close}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-xs mx-6 border border-border bg-background p-8 shadow-lg"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-8 space-y-1">
              <h2 className="text-sm font-bold tracking-tight">Sign in</h2>
              <p className="text-[10px] text-muted-foreground">Enter your email to receive a magic link.</p>
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
