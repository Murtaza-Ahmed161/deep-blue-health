-- Add source tracking columns to vitals table
ALTER TABLE public.vitals 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'wearable' CHECK (source IN ('manual', 'wearable')),
ADD COLUMN IF NOT EXISTS entered_by text DEFAULT 'system' CHECK (entered_by IN ('patient', 'doctor', 'system')),
ADD COLUMN IF NOT EXISTS respiratory_rate integer;

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_vitals_source ON public.vitals(source);
CREATE INDEX IF NOT EXISTS idx_vitals_user_created ON public.vitals(user_id, created_at DESC);