"use client"

import { useEffect } from "react"
import { motion } from "motion/react"
import { ArtifactMedia } from "./artifact-media"
import { ArtifactMeta } from "./artifact-meta"
import type { Artifact } from "@/lib/artifacts"

interface ArtifactDetailProps {
  artifact: Artifact
  onClose: () => void
  onPublish?: () => void
  onDelete?: () => void
}

export function ArtifactDetail({ artifact, onClose, onPublish, onDelete }: ArtifactDetailProps) {
  const isText = artifact.type === "text" || artifact.type === "found text"

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/75"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Centering shell — min-h-full + items-center centers short content; scrolls tall content from top */}
      <div className="flex min-h-full items-center justify-center p-8 md:p-16">
      {/* Content panel */}
      <div className={`relative z-10 ${isText ? "max-w-2xl w-full" : "max-w-2xl w-fit"}`}>
        {/* Media — shared element, flies from card position */}
        <motion.div
          layoutId={`media-${artifact.id}`}
          className="border border-border bg-card overflow-hidden"
        >
          <ArtifactMedia
            artifact={artifact}
            className={isText ? undefined : "max-h-[60vh] w-auto block mx-auto"}
            expanded
          />
        </motion.div>

        {/* Metadata — fades in after the morph settles */}
        <motion.div
          className="bg-background border border-border border-t-0 p-4 w-full space-y-0.5 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, delay: 0.2 }}
        >
          <ArtifactMeta artifact={artifact} expanded />

          <div className="pt-3 flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              close
            </button>
            {onPublish && (
              <button
                onClick={() => { onPublish(); onClose() }}
                className="text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                publish
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => { onClose(); onDelete() }}
                className="text-[10px] text-muted-foreground/50 hover:text-red-400 transition-colors"
              >
                delete
              </button>
            )}
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  )
}
