-- ============================================
-- NEURALTRACE COMPLETE SCHEMA EXPORT
-- Run this in your new Supabase SQL Editor
-- ============================================

-- 1. CREATE ENUM TYPE
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'patient', 'caregiver');

-- 2. CREATE TABLES

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  specialty TEXT,
  license_number TEXT,
  organization TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Vitals table
CREATE TABLE public.vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  heart_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  oxygen_saturation INTEGER,
  temperature NUMERIC,
  device_type TEXT,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Screening Results table
CREATE TABLE public.ai_screening_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vitals_id UUID,
  severity TEXT NOT NULL,
  explanation TEXT NOT NULL,
  recommendations TEXT[],
  confidence_level NUMERIC NOT NULL,
  anomaly_detected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Medical Reports table
CREATE TABLE public.medical_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  ocr_text TEXT,
  ai_summary TEXT,
  ai_tags TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',
  doctor_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Consultations table
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID,
  consultation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  patient_notes TEXT,
  doctor_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notification Preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  critical_alerts BOOLEAN NOT NULL DEFAULT true,
  vitals_warnings BOOLEAN NOT NULL DEFAULT true,
  doctor_messages BOOLEAN NOT NULL DEFAULT true,
  new_reports BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT,
  screenshot_url TEXT,
  device_info JSONB,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Beta Invite Codes table
CREATE TABLE public.beta_invite_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Sessions table
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  actions_performed JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System Metrics table
CREATE TABLE public.system_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC,
  metadata JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Offline Queue table
CREATE TABLE public.offline_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  request_data JSONB NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. CREATE DATABASE FUNCTIONS

-- Has role function (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update updated_at column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Handle new user function (creates profile and role on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  user_role := (NEW.raw_user_meta_data->>'role')::public.app_role;
  
  IF user_role IS NULL THEN
    user_role := 'patient';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, specialty, license_number)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'specialty',
    NEW.raw_user_meta_data->>'license_number'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);

  RETURN NEW;
END;
$$;

-- 4. CREATE TRIGGER FOR NEW USER SIGNUP
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_queue ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Doctors can view patient profiles they have access to" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Vitals policies
CREATE POLICY "Users can view their own vitals" ON public.vitals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Doctors can view patient vitals" ON public.vitals FOR SELECT USING (has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert their own vitals" ON public.vitals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Screening Results policies
CREATE POLICY "Users can view their own AI screenings" ON public.ai_screening_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Doctors can view patient AI screenings" ON public.ai_screening_results FOR SELECT USING (has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert AI screenings" ON public.ai_screening_results FOR INSERT WITH CHECK (true);

-- Medical Reports policies
CREATE POLICY "Users can view their own reports" ON public.medical_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Doctors can view patient reports" ON public.medical_reports FOR SELECT USING (has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert their own reports" ON public.medical_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Doctors can update reports they review" ON public.medical_reports FOR UPDATE USING (has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin'));

-- Consultations policies
CREATE POLICY "Patients can view their own consultations" ON public.consultations FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned consultations" ON public.consultations FOR SELECT USING (auth.uid() = doctor_id OR has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients can create consultation requests" ON public.consultations FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors can update consultations" ON public.consultations FOR UPDATE USING (auth.uid() = doctor_id OR has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin'));

-- Notification Preferences policies
CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notification preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Users can view their own feedback" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all feedback" ON public.feedback FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create their own feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update feedback status" ON public.feedback FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Beta Invite Codes policies
CREATE POLICY "Anyone can view active invite codes" ON public.beta_invite_codes FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Only admins can manage invite codes" ON public.beta_invite_codes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User Sessions policies
CREATE POLICY "Users can insert their own sessions" ON public.user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.user_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.user_sessions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- System Metrics policies
CREATE POLICY "Admins can view all metrics" ON public.system_metrics FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert metrics" ON public.system_metrics FOR INSERT WITH CHECK (true);

-- Offline Queue policies
CREATE POLICY "Users can view their own offline queue" ON public.offline_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into their own offline queue" ON public.offline_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own offline queue" ON public.offline_queue FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from their own offline queue" ON public.offline_queue FOR DELETE USING (auth.uid() = user_id);

-- 7. ENABLE REALTIME FOR TABLES THAT NEED IT
ALTER PUBLICATION supabase_realtime ADD TABLE public.vitals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
