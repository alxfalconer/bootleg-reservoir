"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { isValidFile, ACCEPT_ATTR } from "@/lib/artifact-validation"

interface DepositFormProps {
  onClose: () => void
}

type Tab = "media" | "words"

interface FormState {
  title: string
  notes: string
}

const INITIAL: FormState = { title: "", notes: "" }

export function DepositForm({ onClose }: DepositFormProps) {
  const router = useRouter()

  const [tab,         setTab]         = useState<Tab>("media")
  const [form,        setForm]        = useState<FormState>(INITIAL)
  const [file,        setFile]        = useState<File | null>(null)
  const [fileError,   setFileError]   = useState<string | null>(null)
  const [wordText,    setWordText]    = useState("")
  const [wordTitle,   setWordTitle]   = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFileError(null)
    if (!f) { setFile(null); return }
    if (!isValidFile(f.name)) {
      setFileError(`unsupported file type: .${f.name.split(".").pop()}`)
      setFile(null)
      return
    }
    setFile(f)
  }

  const canSubmit = tab === "media"
    ? form.title.trim().length > 0
    : wordText.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const body = new FormData()
      body.append("tab", tab)

      if (tab === "words") {
        body.append("wordText",  wordText.trim())
        body.append("wordTitle", wordTitle.trim())
      } else {
        body.append("title", form.title.trim())
        body.append("notes", form.notes.trim())
        if (file) body.append("file", file)
      }

      const res = await fetch("/api/deposit", { method: "POST", body })
      const json = await res.json()

      if (!res.ok) {
        setSubmitError(json.error ?? "something went wrong")
        return
      }

      onClose()
      router.refresh()
    } catch {
      setSubmitError("something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <motion.div
        className="fixed inset-0 bg-black/75"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-8 md:p-16">
        <motion.div
          className="relative z-10 bg-background border border-border w-full max-w-md"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
        >
          <form onSubmit={handleSubmit}>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {(["media", "words"] as Tab[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-[10px] uppercase tracking-widest transition-colors duration-150 ${
                    tab === t
                      ? "bg-black text-white"
                      : "text-muted-foreground/50 hover:text-muted-foreground bg-background"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="h-[480px] overflow-y-auto">

            {/* ── MEDIA TAB ── */}
            {tab === "media" && (
              <div className="p-6 space-y-5">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT_ATTR}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-dashed border-border bg-foreground/[0.03] hover:bg-foreground/[0.06] hover:border-foreground/40 transition-colors duration-150 py-10 flex flex-col items-center justify-center gap-2 text-center"
                  >
                    {file ? (
                      <>
                        <span className="text-xs text-foreground font-medium truncate max-w-[260px]">{file.name}</span>
                        <span className="text-[10px] text-muted-foreground/50">click to change</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-foreground/60">attach file</span>
                        <span className="text-[10px] text-muted-foreground/40">image · video · audio · text</span>
                      </>
                    )}
                  </button>
                  {fileError && <div className="mt-1 text-[10px] text-red-500/70">{fileError}</div>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    title <span className="normal-case tracking-normal">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={e => set("title", e.target.value)}
                    className="w-full bg-transparent border border-border text-[11px] text-foreground px-2 py-1.5 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground/40"
                    placeholder="untitled"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => set("notes", e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border border-border text-[11px] text-foreground px-2 py-1.5 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground/40 resize-none"
                    placeholder="any contextual observations"
                  />
                </div>

                {submitError && <div className="text-[10px] text-red-500/70">{submitError}</div>}
              </div>
            )}

            {/* ── WORDS TAB ── */}
            {tab === "words" && (
              <div className="p-6 h-full flex flex-col gap-4">
                <input
                  type="text"
                  value={wordTitle}
                  onChange={e => setWordTitle(e.target.value)}
                  className="w-full bg-transparent border-b border-border text-[11px] text-foreground pb-2 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground/30"
                  placeholder="title (optional)"
                />
                <textarea
                  value={wordText}
                  onChange={e => setWordText(e.target.value)}
                  autoFocus
                  className="w-full flex-1 bg-transparent text-[13px] text-foreground focus:outline-none placeholder:text-muted-foreground/30 resize-none leading-relaxed"
                  placeholder="write here…"
                />
                {submitError && <div className="text-[10px] text-red-500/70">{submitError}</div>}
              </div>
            )}

            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={onClose}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !canSubmit}
                className="text-[10px] border border-border px-4 py-1.5 text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "depositing…" : "deposit"}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </div>
  )
}
