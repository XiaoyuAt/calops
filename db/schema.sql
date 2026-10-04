-- CalOps schema (Neon Postgres)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source text DEFAULT 'manual',            -- luma | partiful | svb | manual
  status text NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered','pending','approved','waitlist','declined','attended')),
  priority int NOT NULL DEFAULT 2,          -- 3=⭐⭐⭐必去, 2=⭐⭐, 1=⭐
  start_time timestamptz,
  end_time timestamptz,
  location text,
  goal text,                               -- 现场目标（见谁/什么口径）
  fallback_for uuid REFERENCES events(id) ON DELETE SET NULL,
  -- 语义：若本行 approved，则弃 fallback_for 指向的备选场
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inbox_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_addr text,
  subject text,
  body_preview text,
  classified text,                         -- approved | declined | waitlist | other | needs_review
  confidence real,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_inbox_time ON inbox_log(received_at DESC);
