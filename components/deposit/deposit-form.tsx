"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { DEPOSIT_TYPES, type Artifact, type ArtifactType } from "@/lib/artifacts"
import { getMediaTypeForFile, isValidFile, ACCEPT_ATTR } from "@/lib/artifact-validation"
import { generateLocalId } from "@/lib/use-artifacts"

interface DepositFormProps {
  localCount: number
  onSubmit: (artifact: Artifact) => void
  onClose: () => void
}

interface FormState {
  type: ArtifactType
  title: string
  dateRaw: string
  source: string
  notes: string
  textContent: string
}

const INITIAL: FormState = {
  type: "photograph",
  title: "",
  dateRaw: "",
  source: "",
  notes: "",
  textContent: "",
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function DepositForm({ localCount, onSubmit, onClose }: DepositFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
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

  const isFoundText = form.type === "found text" || form.type === "text"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      let mediaType: Artifact["media"]["type"] = "none"
      let mediaUrl: string | undefined

      if (file) {
        const detected = getMediaTypeForFile(file.name)
        if (detected && detected !== "text") {
          mediaType = detected
          mediaUrl = await fileToDataUrl(file)
        }
      }

      const artifact: Artifact = {
        id: generateLocalId(localCount),
        type: form.type,
        title: form.title.trim(),
        dateRaw: form.dateRaw.trim() || "date unknown",
        source: form.source.trim() || undefined,
        notes: form.notes.trim() || undefined,
        description: isFoundText
          ? form.textContent.trim() || form.title.trim()
          : form.title.trim(),
        media: { type: mediaType, url: mediaUrl },
        status: "published",
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
            <div className="p-6 space-y-5">
              <div className="text-[10px] uppercase tracking-widest text-foreground">
                deposit fragment
              </div>

              {/* Type */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value as ArtifactType)}
                  className="w-full bg-transparent border border-border text-[11px] text-foreground px-2 py-1.5 focus:outline-none focus:border-foreground/50"
                >
                  {DEPOSIT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
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
                  onChange={(e) => set("title", e.target.value)}
                  className="w-full bg-transparent border border-border text-[11px] text-foreground px-2 py-1.5 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground/40"
                  placeholder="untitled"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  approximate date
                </label>
                <input
                  type="text"
                  value={form.dateRaw}
                  onChange={(e) => set("dateRaw", e.target.value)}
                  className="w-full bg-transparent border border-border text-[11px] text-foreground px-2 py-1.5 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground/40"
                  placeholder="c. 1990s, 2004, unknown"
                />
              </div>

              {/* Source */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  source / provenance
                </label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => set("source", e.target.value)}
                  className="w-full bg-transparent border border-border text-[11px] text-foreground px-2 py-1.5 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground/40"
                  placeholder="estate sale, personal photograph, unknown"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={3}
                  className="w-full bg-transparent border border-border text-[11px] text-foreground px-2 py-1.5 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground/40 resize-none"
                  placeholder="any contextual observations"
                />
              </div>

              {/* Found text content */}
              {isFoundText && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    text content
                  </label>
                  <textarea
                    value={form.textContent}
                    onChange={(e) => set("textContent", e.target.value)}
                    rows={5}
                    className="w-full bg-transparent border border-border text-[11px] text-foreground px-2 py-1.5 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground/40 resize-none"
                    placeholder="paste or type the found text"
                  />
                </div>
              )}

              {/* File upload */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  file
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
                  >
                    {file ? "change file" : "attach file"}
                  </button>
                  {file && (
                    <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                      {file.name}
                    </span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_ATTR}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {fileError && (
                  <div className="text-[10px] text-red-500/70">{fileError}</div>
                )}
                <div className="text-[10px] text-muted-foreground/40">
                  jpg, png, webp, heic, tiff — mp4, mov, webm — mp3, wav, flac — txt, md, pdf
                </div>
              </div>

              {submitError && (
                <div className="text-[10px] text-red-500/70">{submitError}</div>
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
                disabled={submitting || !form.title.trim()}
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
