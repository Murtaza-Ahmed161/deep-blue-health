-- Create vitals table for smartwatch data
CREATE TABLE public.vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  heart_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  temperature DECIMAL(4,1),
  oxygen_saturation INTEGER,
  device_type TEXT,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;

-- Create policies for vitals access
CREATE POLICY "Users can view their own vitals" 
ON public.vitals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vitals" 
ON public.vitals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient vitals" 
ON public.vitals 
FOR SELECT 
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_vitals_user_id_created_at ON public.vitals(user_id, created_at DESC);

-- Enable realtime for vitals table
ALTER PUBLICATION supabase_realtime ADD TABLE public.vitals;