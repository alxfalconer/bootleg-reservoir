import type { Artifact } from "@/lib/artifacts"

interface ArtifactMetaProps {
  artifact: Artifact
  expanded?: boolean
}

export function ArtifactMeta({ artifact, expanded }: ArtifactMetaProps) {
  return (
    <div className="space-y-0.5 break-words">
      <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1">
        {artifact.type}
      </div>
      <div className="text-xs text-foreground">{artifact.title}</div>
      <div className="text-[10px] text-muted-foreground">{artifact.dateRaw}</div>
      {artifact.source && (
        <div className="text-[10px] text-muted-foreground">
          src: {artifact.source}
        </div>
      )}

      {expanded && (
        <div className="mt-2 pt-2 border-t border-border space-y-1">
          {artifact.technical?.dimensions && (
            <div className="text-[10px] text-muted-foreground">
              dim: {artifact.technical.dimensions}
            </div>
          )}
          {artifact.technical?.duration && (
            <div className="text-[10px] text-muted-foreground">
              dur: {artifact.technical.duration}
            </div>
          )}
          {artifact.technical?.format && (
            <div className="text-[10px] text-muted-foreground">
              fmt: {artifact.technical.format}
            </div>
          )}
          {artifact.notes && (
            <div className="text-[10px] text-muted-foreground italic mt-2">
              {artifact.notes}
            </div>
          )}
          <div className="text-[10px] text-muted-foreground/60 mt-2">
            id: {artifact.id}
          </div>
        </div>
      )}
    </div>
  )
}
