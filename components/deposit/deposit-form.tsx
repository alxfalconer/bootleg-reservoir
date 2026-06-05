"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { type Artifact } from "@/lib/artifacts"
import { getMediaTypeForFile, isValidFile, ACCEPT_ATTR } from "@/lib/artifact-validation"
import { generateLocalId } from "@/lib/use-artifacts"

interface DepositFormProps {
  localCount: number
  onSubmit: (artifact: Artifact) => void
  onClose: () => void
}

type Tab = "media" | "words"

interface FormState {
  title: string
  notes: string
}

const INITIAL: FormState = {
  title: "",
  notes: "",
}

function formatUploadDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function deriveTitle(text: string): string {
  const first = text.trim().split(/\n/)[0].trim()
  return first.length > 80 ? first.slice(0, 77) + "…" : first || "untitled"
}

export function DepositForm({ localCount, onSubmit, onClose }: DepositFormProps) {
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
      let artifact: Artifact

      const uploadedAt = formatUploadDate(new Date())

      if (tab === "words") {
        artifact = {
          id: generateLocalId(localCount),
          type: "found text",
          title: wordTitle.trim() || deriveTitle(wordText),
          dateRaw: "",
          uploadedAt,
          description: wordText.trim(),
          media: { type: "none" },
          status: "published",
        }
      } else {
        let mediaType: Artifact["media"]["type"] = "none"
        let mediaUrl: string | undefined

        if (file) {
          const detected = getMediaTypeForFile(file.name)
          if (detected && detected !== "text") {
            mediaType = detected
            mediaUrl = await fileToDataUrl(file)
          }
        }

        artifact = {
          id: generateLocalId(localCount),
          type: "unknown",
          title: form.title.trim(),
          dateRaw: "",
          uploadedAt,
          notes: form.notes.trim() || undefined,
          description: form.title.trim(),
          media: { type: mediaType, url: mediaUrl },
          status: "published",
        }
      }

      onSubmit(artifact)
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setSubmitError(
        msg.toLowerCase().includes("quota")
          ? "storage quota exceeded — try a smaller file"
          : "something went wrong"
      )
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

            {/* Tab content — fixed height so the modal doesn't resize between tabs */}
            <div className="h-[480px] overflow-y-auto">

            {/* ── MEDIA TAB ── */}
            {tab === "media" && (
              <div className="p-6 space-y-5">

                {/* File zone — prominent */}
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

                {/* Title */}
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

                {/* Notes */}
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

            </div>{/* end fixed-height content wrapper */}

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
