-- Doctor-Patient Assignment System Migration
-- Phase 1, Priority 1: Patient-Doctor Assignment System

-- Create patient_doctor_assignments table
CREATE TABLE IF NOT EXISTS public.patient_doctor_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'transferred')) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one active assignment per patient-doctor pair
  UNIQUE(patient_id, doctor_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create alert_acknowledgments table for persistent alert management
CREATE TABLE IF NOT EXISTS public.alert_acknowledgments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.ai_screening_results(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one acknowledgment per alert-doctor pair
  UNIQUE(alert_id, doctor_id)
);

-- Enable Row Level Security
ALTER TABLE public.patient_doctor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Doctors can view their assigned patients" ON public.patient_doctor_assignments;
DROP POLICY IF EXISTS "Doctors can manage their patient assignments" ON public.patient_doctor_assignments;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.patient_doctor_assignments;
DROP POLICY IF EXISTS "Patients can view their doctor assignments" ON public.patient_doctor_assignments;

DROP POLICY IF EXISTS "Doctors can acknowledge alerts" ON public.alert_acknowledgments;
DROP POLICY IF EXISTS "Doctors can view their acknowledgments" ON public.alert_acknowledgments;
DROP POLICY IF EXISTS "Admins can view all acknowledgments" ON public.alert_acknowledgments;

-- RLS Policies for patient_doctor_assignments
-- Doctors can view assignments where they are the doctor
CREATE POLICY "Doctors can view their assigned patients"
ON public.patient_doctor_assignments
FOR SELECT
USING (auth.uid() = doctor_id);

-- Doctors can update their own assignments (notes, status)
CREATE POLICY "Doctors can manage their patient assignments"
ON public.patient_doctor_assignments
FOR UPDATE
USING (auth.uid() = doctor_id)
WITH CHECK (auth.uid() = doctor_id);

-- Admins can manage all assignments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all assignments"
    ON public.patient_doctor_assignments
    FOR ALL
    USING (has_role(auth.uid(), ''admin''::app_role))
    WITH CHECK (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END
$$;

-- Patients can view their doctor assignments
CREATE POLICY "Patients can view their doctor assignments"
ON public.patient_doctor_assignments
FOR SELECT
USING (auth.uid() = patient_id);

-- RLS Policies for alert_acknowledgments
-- Doctors can acknowledge alerts and view their acknowledgments
CREATE POLICY "Doctors can acknowledge alerts"
ON public.alert_acknowledgments
FOR INSERT
WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can view their acknowledgments"
ON public.alert_acknowledgments
FOR SELECT
USING (auth.uid() = doctor_id);

-- Admins can view all acknowledgments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
    EXECUTE 'CREATE POLICY "Admins can view all acknowledgments"
    ON public.alert_acknowledgments
    FOR SELECT
    USING (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_doctor_assignments_doctor_id ON public.patient_doctor_assignments(doctor_id, status, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_assignments_patient_id ON public.patient_doctor_assignments(patient_id, status, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_assignments_assigned_by ON public.patient_doctor_assignments(assigned_by, assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_acknowledgments_doctor_id ON public.alert_acknowledgments(doctor_id, acknowledged_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_acknowledgments_alert_id ON public.alert_acknowledgments(alert_id, acknowledged_at DESC);

-- Add trigger for patient_doctor_assignments updated_at
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_patient_doctor_assignments_updated_at ON public.patient_doctor_assignments;
    CREATE TRIGGER update_patient_doctor_assignments_updated_at
    BEFORE UPDATE ON public.patient_doctor_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- Enable realtime for assignments (for live updates)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_doctor_assignments;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'patient_doctor_assignments already in supabase_realtime publication';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_acknowledgments;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'alert_acknowledgments already in supabase_realtime publication';
  END;
END
$$;

-- Add comments for documentation
COMMENT ON TABLE public.patient_doctor_assignments IS 'Manages which doctors are assigned to which patients';
COMMENT ON TABLE public.alert_acknowledgments IS 'Tracks which doctors have acknowledged which alerts';

COMMENT ON COLUMN public.patient_doctor_assignments.patient_id IS 'Patient being assigned to doctor';
COMMENT ON COLUMN public.patient_doctor_assignments.doctor_id IS 'Doctor responsible for patient';
COMMENT ON COLUMN public.patient_doctor_assignments.assigned_by IS 'Admin or doctor who made the assignment';
COMMENT ON COLUMN public.patient_doctor_assignments.status IS 'Assignment status: active, inactive, or transferred';

COMMENT ON COLUMN public.alert_acknowledgments.alert_id IS 'AI screening result that was acknowledged';
COMMENT ON COLUMN public.alert_acknowledgments.doctor_id IS 'Doctor who acknowledged the alert';
COMMENT ON COLUMN public.alert_acknowledgments.notes IS 'Optional notes about the acknowledgment';

-- Verification query to confirm tables were created
SELECT 
  'patient_doctor_assignments' as table_name,
  COUNT(*) as row_count
FROM public.patient_doctor_assignments
UNION ALL
SELECT 
  'alert_acknowledgments' as table_name,
  COUNT(*) as row_count  
FROM public.alert_acknowledgments;