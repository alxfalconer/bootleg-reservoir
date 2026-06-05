import { NextResponse } from "next/server"
import { getSupabaseAuth, getSupabaseAdmin } from "@/lib/supabase/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await getSupabaseAuth()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase
    .from("artifacts")
    .update({ status: "published" })
    .eq("id", id)
    .eq("deposited_by", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await getSupabaseAuth()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Fetch the row first to get media_url for storage cleanup
  const { data: artifact } = await supabase
    .from("artifacts")
    .select("media_url")
    .eq("id", id)
    .eq("deposited_by", user.id)
    .single()

  if (artifact?.media_url) {
    const admin = getSupabaseAdmin()
    // Extract storage path from the public URL: .../artifact-media/<path>
    const marker = "/artifact-media/"
    const idx = artifact.media_url.indexOf(marker)
    if (idx !== -1) {
      const storagePath = artifact.media_url.slice(idx + marker.length)
      await admin.storage.from("artifact-media").remove([storagePath])
    }
  }

  const { error } = await supabase
    .from("artifacts")
    .delete()
    .eq("id", id)
    .eq("deposited_by", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
