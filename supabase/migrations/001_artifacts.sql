create table if not exists artifacts (
  id           text primary key,
  type         text not null,
  title        text not null,
  date_raw     text not null default '',
  uploaded_at  text,
  source       text,
  notes        text,
  description  text not null default '',
  media_type   text not null default 'none',
  media_url    text,
  technical    jsonb,
  tags         text[],
  status       text not null default 'pending',
  deposited_by uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table artifacts enable row level security;

-- Public visitors can read published artifacts
create policy "public read published"
  on artifacts for select
  using (status = 'published');

-- Authenticated users can read their own pending artifacts
create policy "owner read pending"
  on artifacts for select
  using (auth.uid() = deposited_by);

-- Authenticated users can insert their own artifacts
create policy "authenticated insert"
  on artifacts for insert
  with check (auth.uid() = deposited_by);
