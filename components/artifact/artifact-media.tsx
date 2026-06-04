import { cn } from "@/lib/utils"
import type { Artifact } from "@/lib/artifacts"
import { AudioPlayer } from "./audio-player"

interface ArtifactMediaProps {
  artifact: Artifact
  className?: string
}

export function ArtifactMedia({ artifact, className }: ArtifactMediaProps) {
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

  if (artifact.type === "text") {
    return (
      <p className="text-xs leading-relaxed whitespace-pre-wrap p-3">
        {artifact.description}
      </p>
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
