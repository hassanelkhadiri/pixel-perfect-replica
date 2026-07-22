
ALTER TABLE public.project_stages
  ADD COLUMN IF NOT EXISTS countdown_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annotation text;
