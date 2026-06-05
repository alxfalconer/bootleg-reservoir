/**
 * One-time seed script. Run with:
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... npx tsx scripts/seed.ts
 * Or after adding values to .env.local:
 *   npx dotenv -e .env.local -- npx tsx scripts/seed.ts
 */

import { createClient } from "@supabase/supabase-js"
import { artifacts } from "../lib/artifacts"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const rows = artifacts.map((a) => ({
  id:          a.id,
  type:        a.type,
  title:       a.title,
  date_raw:    a.dateRaw,
  uploaded_at: a.uploadedAt ?? null,
  source:      a.source ?? null,
  notes:       a.notes ?? null,
  description: a.description,
  media_type:  a.media.type,
  media_url:   a.media.url ?? null,
  technical:   a.technical ?? null,
  tags:        a.tags ?? null,
  status:      a.status,
  deposited_by: null,
}))

async function main() {
  const { error } = await supabase
    .from("artifacts")
    .upsert(rows, { onConflict: "id" })

  if (error) {
    console.error("Seed failed:", error.message)
    process.exit(1)
  }

  console.log(`Seeded ${rows.length} artifacts.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
