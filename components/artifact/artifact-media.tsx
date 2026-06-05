import { cn } from "@/lib/utils"
import type { Artifact } from "@/lib/artifacts"
import { AudioPlayer } from "./audio-player"

interface ArtifactMediaProps {
  artifact: Artifact
  className?: string
  expanded?: boolean
}

export function ArtifactMedia({ artifact, className, expanded }: ArtifactMediaProps) {
  const isText = artifact.type === "text" || artifact.type === "found text"
  if (isText && artifact.description) {
    if (expanded) {
      return (
        <div
          className="bg-white p-8 w-full"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <p className="text-xl font-normal leading-relaxed text-black whitespace-pre-wrap" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {artifact.description}
          </p>
        </div>
      )
    }
    return (
      <div
        className="bg-white p-6 w-64 mx-auto overflow-hidden"
        style={{ fontFamily: "var(--font-display)", aspectRatio: "8.5 / 11" }}
      >
        <p className="text-sm font-normal leading-relaxed text-black line-clamp-[13]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          {artifact.description}
        </p>
      </div>
    )
  }

  if (artifact.media.type === "image" && artifact.media.url) {
    return (
      <img
        src={artifact.media.url}
        alt={artifact.title}
        className={cn("w-full h-auto block", className)}
      />
    )
  }

  if (artifact.media.type === "video" && artifact.media.url) {
    return (
      <video
        src={artifact.media.url}
        className={cn("w-full h-auto block", className)}
        muted
        loop
        playsInline
        autoPlay
      />
    )
  }

  if (artifact.media.type === "audio" && artifact.media.url) {
    return (
      <AudioPlayer
        src={artifact.media.url}
        title={artifact.type === "field recording" ? artifact.title : undefined}
      />
    )
  }

  if (artifact.media.type === "audio") {
    return (
      <div className="flex items-center gap-2 text-xs p-3">
        <span className="font-mono text-[10px] text-muted-foreground">AUDIO — no file</span>
      </div>
    )
  }

  return (
    <div className="text-xs text-muted-foreground italic p-3">
      [{artifact.description}]
    </div>
  )
}
