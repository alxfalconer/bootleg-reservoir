import { getSupabaseAnon } from "./supabase/server"
import { artifacts as seedArtifacts, type Artifact } from "./artifacts"

type ArtifactRow = {
  id: string
  type: string
  title: string
  date_raw: string
  uploaded_at: string | null
  source: string | null
  notes: string | null
  description: string
  media_type: string
  media_url: string | null
  status: string
  technical: { dimensions?: string; duration?: string; format?: string } | null
  tags: string[] | null
}

function rowToArtifact(row: ArtifactRow): Artifact {
  return {
    id: row.id,
    type: row.type as Artifact["type"],
    title: row.title,
    dateRaw: row.date_raw,
    uploadedAt: row.uploaded_at ?? undefined,
    source: row.source ?? undefined,
    notes: row.notes ?? undefined,
    description: row.description,
    technical: row.technical ?? undefined,
    tags: row.tags ?? undefined,
    media: {
      type: row.media_type as Artifact["media"]["type"],
      url: row.media_url ?? undefined,
    },
    status: row.status as Artifact["status"],
  }
}

export async function getPublishedArtifacts(): Promise<Artifact[]> {
  const supabase = getSupabaseAnon()

  if (!supabase) {
    // Supabase not configured — use static seed data
    return seedArtifacts
  }

  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Supabase fetch error:", error.message)
    return seedArtifacts
  }

  return (data as ArtifactRow[]).map(rowToArtifact)
}
