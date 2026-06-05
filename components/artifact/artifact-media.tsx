import { cn } from "@/lib/utils"
import type { Artifact } from "@/lib/artifacts"
import { AudioPlayer } from "./audio-player"

interface ArtifactMediaProps {
  artifact: Artifact
  className?: string
  expanded?: boolean
}

export function isEmbedVideo(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url)
}

function getEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`
  return url
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
    const url = artifact.media.url

    if (isEmbedVideo(url)) {
      if (!expanded) {
        return (
          <div className="w-full aspect-video bg-black flex items-center justify-center">
            <span className="text-white/20 text-[10px] uppercase tracking-[0.25em]">video</span>
          </div>
        )
      }
      return (
        <div className="w-full aspect-video">
          <iframe
            src={getEmbedUrl(url)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={artifact.title}
          />
        </div>
      )
    }

    return (
      <video
        src={url}
        className={cn("w-full h-auto block", className)}
        muted
        loop
        playsInline
        autoPlay
      />
    )
  }

  if (artifact.media.type === "pdf" && artifact.media.url) {
    if (!expanded) {
      return (
        <div className="w-full h-40 bg-foreground/[0.03] flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.25em]">pdf</span>
        </div>
      )
    }
    return (
      <iframe
        src={artifact.media.url}
        className="w-full border-0"
        style={{ height: "72vh" }}
        title={artifact.title}
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
