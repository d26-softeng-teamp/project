-- Add format column derived from filename extension
ALTER TABLE public.content_management
  ADD COLUMN IF NOT EXISTS format VARCHAR(20);

-- Backfill existing rows from filename (lowercase extension after last dot)
UPDATE public.content_management
SET format = lower(
  substring(filename FROM '\.([^.]+)$')
)
WHERE filename IS NOT NULL
  AND filename ~ '\.[^.]+$'
  AND format IS NULL;

-- Index for efficient format filtering
CREATE INDEX IF NOT EXISTS idx_content_management_format
  ON public.content_management (format);
