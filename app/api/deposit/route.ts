import { NextResponse } from "next/server"
import { getSupabaseAuth, getSupabaseAdmin } from "@/lib/supabase/server"
import { getMediaTypeForFile } from "@/lib/artifact-validation"

function deriveTitle(text: string): string {
  const first = text.trim().split(/\n/)[0].trim()
  return first.length > 80 ? first.slice(0, 77) + "…" : first || "untitled"
}

function formatUploadDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function generateId(): string {
  return `rsv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export async function POST(request: Request) {
  // Verify session
  const supabase = await getSupabaseAuth()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const tab       = formData.get("tab") as "media" | "words" | "link"
  const uploadedAt = formatUploadDate(new Date())
  const artifactId = generateId()

  let row: Record<string, unknown>

  if (tab === "link") {
    const linkUrl   = (formData.get("linkUrl")   as string ?? "").trim()
    const linkTitle = (formData.get("linkTitle") as string ?? "").trim()
    const notes     = (formData.get("linkNotes") as string ?? "").trim() || null

    const isVideo = /youtube\.com|youtu\.be|vimeo\.com/i.test(linkUrl)
    const isPdf   = /\.pdf(\?|$)/i.test(linkUrl)

    row = {
      id:           artifactId,
      type:         isPdf ? "document" : "video",
      title:        linkTitle || "untitled",
      date_raw:     "",
      uploaded_at:  uploadedAt,
      notes,
      description:  linkTitle || linkUrl,
      media_type:   isPdf ? "pdf" : isVideo ? "video" : "video",
      media_url:    linkUrl,
      status:       "pending",
      deposited_by: user.id,
    }
  } else if (tab === "words") {
    const wordText  = (formData.get("wordText")  as string ?? "").trim()
    const wordTitle = (formData.get("wordTitle") as string ?? "").trim()

    row = {
      id:           artifactId,
      type:         "found text",
      title:        wordTitle || deriveTitle(wordText),
      date_raw:     "",
      uploaded_at:  uploadedAt,
      description:  wordText,
      media_type:   "none",
      media_url:    null,
      status:       "pending",
      deposited_by: user.id,
    }
  } else {
    // media tab
    const title = (formData.get("title") as string ?? "").trim()
    const notes = (formData.get("notes") as string ?? "").trim() || null
    const file  = formData.get("file") as File | null

    let mediaType: string = "none"
    let mediaUrl:  string | null = null

    if (file && file.size > 0) {
      const detected = getMediaTypeForFile(file.name)
      if (detected && detected !== "text") {
        mediaType = detected

        const admin = getSupabaseAdmin()
        const path  = `${artifactId}/${file.name}`
        const { error: uploadError } = await admin.storage
          .from("artifact-media")
          .upload(path, file, { contentType: file.type || undefined })

        if (uploadError) {
          return NextResponse.json({ error: uploadError.message }, { status: 500 })
        }

        const { data: { publicUrl } } = admin.storage
          .from("artifact-media")
          .getPublicUrl(path)

        mediaUrl = publicUrl
      }
    }

    row = {
      id:           artifactId,
      type:         "unknown",
      title,
      date_raw:     "",
      uploaded_at:  uploadedAt,
      notes,
      description:  title,
      media_type:   mediaType,
      media_url:    mediaUrl,
      status:       "pending",
      deposited_by: user.id,
    }
  }

  const { data, error } = await supabase
    .from("artifacts")
    .insert(row)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ artifact: data }, { status: 201 })
}
