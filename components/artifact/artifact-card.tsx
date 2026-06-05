"use client"

import { motion } from "motion/react"
import { ArtifactMedia } from "./artifact-media"
import { ArtifactMeta } from "./artifact-meta"
import type { Artifact } from "@/lib/artifacts"

interface ArtifactCardProps {
  artifact: Artifact
  isExpanded: boolean
  isDragging: boolean
  isDeleting?: boolean
  onDelete?: () => void
  onPublish?: () => void
  variant?: "default" | "grid" | "single"
}

export function ArtifactCard({ artifact, isExpanded, isDeleting, onDelete, onPublish, variant = "default" }: ArtifactCardProps) {
  const isGrid   = variant === "grid" || variant === "single"
  const isSingle = variant === "single"
  const isText   = artifact.type === "text" || artifact.type === "found text"

  return (
    <div className="group select-none">
      <div className={`relative ${isGrid ? "w-full" : "w-fit"}`}>
        {isExpanded ? (
          // Invisible placeholder — maintains card footprint while media lives in the detail overlay
          <div
            className={`border border-transparent bg-card overflow-hidden invisible ${isGrid ? "w-full" : "max-w-[320px]"}`}
            aria-hidden="true"
          >
            <ArtifactMedia artifact={artifact} />
          </div>
        ) : (
          <motion.div
            layoutId={`media-${artifact.id}`}
            className={`border border-border bg-card overflow-hidden transition-colors duration-200 group-hover:border-foreground/30 ${isGrid ? "w-full" : "max-w-[320px]"}`}
          >
            <ArtifactMedia
              artifact={artifact}
              className={isSingle ? "w-auto max-w-full max-h-[calc(100svh-11rem)] mx-auto" : undefined}
            />
          </motion.div>
        )}

        {/* Metadata */}
        <motion.div
          className="mt-2 px-2 py-1 w-full overflow-hidden space-y-0.5 transition-colors duration-200 group-hover:bg-background"
          animate={{ opacity: isDeleting ? 0 : 1 }}
          transition={{ duration: isDeleting ? 0.35 : 0.1, delay: isDeleting ? 0.2 : 0 }}
        >
          <ArtifactMeta artifact={artifact} />
          {!isDeleting && (onDelete || onPublish) && (
            <div className="mt-1 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {onPublish && (
                <button
                  className="text-[10px] text-muted-foreground/40 hover:text-foreground/70"
                  onClick={(e) => { e.stopPropagation(); onPublish() }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  publish
                </button>
              )}
              {onDelete && (
                <button
                  className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/80"
                  onClick={(e) => { e.stopPropagation(); onDelete() }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  delete
                </button>
              )}
            </div>
          )}
          {artifact.status === "pending" && (
            <div className="mt-1 text-[9px] text-muted-foreground/30 uppercase tracking-widest">pending</div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
