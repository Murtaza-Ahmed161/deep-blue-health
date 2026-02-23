-- Memory Journal (cognitive disorder focus: store notes, images, and voice recordings for personal recall)
CREATE TABLE public.memory_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT, -- Notes/text content
  image_urls TEXT[], -- Array of image URLs from Supabase Storage
  audio_url TEXT, -- Voice recording URL from Supabase Storage
  tags TEXT[], -- Tags for categorization (e.g., 'family', 'medical', 'important')
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_memory_journal_user_id ON public.memory_journal(user_id);
CREATE INDEX idx_memory_journal_user_created ON public.memory_journal(user_id, created_at DESC);
CREATE INDEX idx_memory_journal_tags ON public.memory_journal USING GIN(tags); -- GIN index for array searches

-- Enable RLS
ALTER TABLE public.memory_journal ENABLE ROW LEVEL SECURITY;

-- RLS: users manage their own journal entries
CREATE POLICY "Users can view their own journal entries"
ON public.memory_journal FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
ON public.memory_journal FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
ON public.memory_journal FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
ON public.memory_journal FOR DELETE
USING (auth.uid() = user_id);

-- Optional: doctors/caregivers can view patient journal entries (for future caregiver dashboard)
CREATE POLICY "Doctors can view patient journal entries"
ON public.memory_journal FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at (if function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE TRIGGER update_memory_journal_updated_at
    BEFORE UPDATE ON public.memory_journal
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Note: Storage bucket 'memory-journal' should be created separately in Supabase Dashboard
-- with RLS policies allowing users to upload/read their own files
