-- Create medical_reports table for patient report uploads
CREATE TABLE public.medical_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ocr_text TEXT,
  ai_summary TEXT,
  ai_tags TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'approved', 'rejected')),
  doctor_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('video', 'chat', 'in_person', 'phone')),
  notes TEXT,
  patient_notes TEXT,
  doctor_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_screening_results table
CREATE TABLE public.ai_screening_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vitals_id UUID REFERENCES public.vitals(id) ON DELETE CASCADE,
  confidence_level DECIMAL(3,2) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
  anomaly_detected BOOLEAN NOT NULL DEFAULT false,
  explanation TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('normal', 'warning', 'critical')),
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_screening_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_reports
CREATE POLICY "Users can view their own reports" 
ON public.medical_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" 
ON public.medical_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient reports" 
ON public.medical_reports 
FOR SELECT 
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can update reports they review" 
ON public.medical_reports 
FOR UPDATE 
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for consultations
CREATE POLICY "Patients can view their own consultations" 
ON public.consultations 
FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create consultation requests" 
ON public.consultations 
FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctors can view assigned consultations" 
ON public.consultations 
FOR SELECT 
USING (auth.uid() = doctor_id OR has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can update consultations" 
ON public.consultations 
FOR UPDATE 
USING (auth.uid() = doctor_id OR has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for ai_screening_results
CREATE POLICY "Users can view their own AI screenings" 
ON public.ai_screening_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI screenings" 
ON public.ai_screening_results 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Doctors can view patient AI screenings" 
ON public.ai_screening_results 
FOR SELECT 
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_medical_reports_user_id ON public.medical_reports(user_id, created_at DESC);
CREATE INDEX idx_consultations_patient_id ON public.consultations(patient_id, scheduled_at DESC);
CREATE INDEX idx_consultations_doctor_id ON public.consultations(doctor_id, scheduled_at DESC);
CREATE INDEX idx_ai_screening_user_id ON public.ai_screening_results(user_id, created_at DESC);

-- Create trigger for consultations updated_at
CREATE TRIGGER update_consultations_updated_at
BEFORE UPDATE ON public.consultations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for consultations
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;