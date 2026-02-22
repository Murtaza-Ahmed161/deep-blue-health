-- Create medication_reminders table
CREATE TABLE public.medication_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'twice_daily', 'three_times_daily', 'weekly', 'as_needed')),
  time_of_day TEXT NOT NULL, -- Format: "HH:MM" (24-hour)
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication_logs table (track when medications are taken)
CREATE TABLE public.medication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_id UUID NOT NULL REFERENCES public.medication_reminders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'skipped', 'missed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medication_reminders
CREATE POLICY "Users can view their own reminders" 
ON public.medication_reminders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders" 
ON public.medication_reminders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" 
ON public.medication_reminders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" 
ON public.medication_reminders 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient reminders" 
ON public.medication_reminders 
FOR SELECT 
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for medication_logs
CREATE POLICY "Users can view their own logs" 
ON public.medication_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs" 
ON public.medication_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs" 
ON public.medication_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient logs" 
ON public.medication_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_medication_reminders_user_id ON public.medication_reminders(user_id, created_at DESC);
CREATE INDEX idx_medication_reminders_active ON public.medication_reminders(user_id, is_active);
CREATE INDEX idx_medication_logs_user_id ON public.medication_logs(user_id, scheduled_time DESC);
CREATE INDEX idx_medication_logs_reminder_id ON public.medication_logs(reminder_id, scheduled_time DESC);
CREATE INDEX idx_medication_logs_status ON public.medication_logs(user_id, status, scheduled_time DESC);

-- Create trigger for medication_reminders updated_at
CREATE TRIGGER update_medication_reminders_updated_at
BEFORE UPDATE ON public.medication_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for medication tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_logs;
