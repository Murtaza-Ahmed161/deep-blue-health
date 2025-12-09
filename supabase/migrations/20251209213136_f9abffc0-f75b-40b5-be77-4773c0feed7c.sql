-- Create consent types enum
CREATE TYPE public.consent_type AS ENUM ('device_data', 'doctor_access', 'location', 'notifications', 'data_sharing', 'terms_of_service', 'privacy_policy');

-- Create consent audit trail table
CREATE TABLE public.consent_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  consent_type consent_type NOT NULL,
  granted BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consent_audit ENABLE ROW LEVEL SECURITY;

-- Users can view their own consent history
CREATE POLICY "Users can view their own consent audit"
ON public.consent_audit
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own consent records
CREATE POLICY "Users can insert their own consent records"
ON public.consent_audit
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all consent records
CREATE POLICY "Admins can view all consent records"
ON public.consent_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_consent_audit_user_id ON public.consent_audit(user_id);
CREATE INDEX idx_consent_audit_created_at ON public.consent_audit(created_at DESC);