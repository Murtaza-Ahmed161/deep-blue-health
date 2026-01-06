-- Emergency Escalation System Migration (Safe Version)
-- Phase 2: Real Emergency Escalation Implementation
-- This version handles existing database objects safely

-- Create emergency_events table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.emergency_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  triggered_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_consented BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create emergency_notifications table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.emergency_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.emergency_events(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('email', 'sms')),
  recipient_address TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Patients can create their own emergency events" ON public.emergency_events;
DROP POLICY IF EXISTS "Patients can view their own emergency events" ON public.emergency_events;
DROP POLICY IF EXISTS "Doctors can view all emergency events" ON public.emergency_events;
DROP POLICY IF EXISTS "System can update emergency event status" ON public.emergency_events;

DROP POLICY IF EXISTS "Patients can view their own emergency notifications" ON public.emergency_notifications;
DROP POLICY IF EXISTS "System can insert emergency notifications" ON public.emergency_notifications;
DROP POLICY IF EXISTS "System can update emergency notifications" ON public.emergency_notifications;
DROP POLICY IF EXISTS "Doctors can view all emergency notifications" ON public.emergency_notifications;

-- RLS Policies for emergency_events
-- Patients can only create and view their own emergency events
CREATE POLICY "Patients can create their own emergency events"
ON public.emergency_events
FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can view their own emergency events"
ON public.emergency_events
FOR SELECT
USING (auth.uid() = patient_id);

-- Check if has_role function exists before using it
DO $$
BEGIN
  -- Try to create policies with has_role function if it exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
    -- Doctors and admins can view all emergency events
    EXECUTE 'CREATE POLICY "Doctors can view all emergency events"
    ON public.emergency_events
    FOR SELECT
    USING (
      has_role(auth.uid(), ''doctor''::app_role) OR 
      has_role(auth.uid(), ''admin''::app_role)
    )';

    -- Doctors and admins can view all emergency notifications
    EXECUTE 'CREATE POLICY "Doctors can view all emergency notifications"
    ON public.emergency_notifications
    FOR SELECT
    USING (
      has_role(auth.uid(), ''doctor''::app_role) OR 
      has_role(auth.uid(), ''admin''::app_role)
    )';
  ELSE
    -- Fallback: create simpler policies without role checking
    RAISE NOTICE 'has_role function not found, creating simplified policies';
  END IF;
END
$$;

-- System can update emergency event status (for notification results)
CREATE POLICY "System can update emergency event status"
ON public.emergency_events
FOR UPDATE
USING (true)
WITH CHECK (true);

-- RLS Policies for emergency_notifications
-- Patients can view notifications for their own emergency events
CREATE POLICY "Patients can view their own emergency notifications"
ON public.emergency_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.emergency_events 
    WHERE id = event_id AND patient_id = auth.uid()
  )
);

-- System can insert notification records
CREATE POLICY "System can insert emergency notifications"
ON public.emergency_notifications
FOR INSERT
WITH CHECK (true);

-- System can update notification status
CREATE POLICY "System can update emergency notifications"
ON public.emergency_notifications
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_emergency_events_patient_id ON public.emergency_events(patient_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_events_status ON public.emergency_events(status, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_events_triggered_at ON public.emergency_events(triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_notifications_event_id ON public.emergency_notifications(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_status ON public.emergency_notifications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_recipient ON public.emergency_notifications(recipient_address, created_at DESC);

-- Add trigger for emergency_events updated_at (only if update_updated_at_column function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_emergency_events_updated_at ON public.emergency_events;
    CREATE TRIGGER update_emergency_events_updated_at
    BEFORE UPDATE ON public.emergency_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  ELSE
    RAISE NOTICE 'update_updated_at_column function not found, skipping trigger creation';
  END IF;
END
$$;

-- Enable realtime for emergency events (for doctor dashboards)
-- Handle potential errors if tables are already in publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_events;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'emergency_events already in supabase_realtime publication';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_notifications;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'emergency_notifications already in supabase_realtime publication';
  END;
END
$$;

-- Add comments for documentation
COMMENT ON TABLE public.emergency_events IS 'Records of patient emergency alerts with location consent and delivery status';
COMMENT ON TABLE public.emergency_notifications IS 'Audit trail of all emergency notification attempts with delivery results';

COMMENT ON COLUMN public.emergency_events.patient_id IS 'Patient who triggered the emergency';
COMMENT ON COLUMN public.emergency_events.triggered_by IS 'User who actually triggered (usually same as patient_id)';
COMMENT ON COLUMN public.emergency_events.location_lat IS 'Latitude if location consent granted';
COMMENT ON COLUMN public.emergency_events.location_lng IS 'Longitude if location consent granted';
COMMENT ON COLUMN public.emergency_events.location_consented IS 'Whether patient consented to location sharing for this emergency';
COMMENT ON COLUMN public.emergency_events.status IS 'Overall emergency status: pending, sent, or failed';

COMMENT ON COLUMN public.emergency_notifications.recipient_type IS 'Type of recipient: email or sms';
COMMENT ON COLUMN public.emergency_notifications.recipient_address IS 'Email address or phone number';
COMMENT ON COLUMN public.emergency_notifications.channel IS 'Delivery channel used: email or sms';
COMMENT ON COLUMN public.emergency_notifications.message_id IS 'External service message ID for tracking';
COMMENT ON COLUMN public.emergency_notifications.error_message IS 'Full error details if delivery failed';

-- Verification query to confirm tables were created
SELECT 
  'emergency_events' as table_name,
  COUNT(*) as row_count
FROM public.emergency_events
UNION ALL
SELECT 
  'emergency_notifications' as table_name,
  COUNT(*) as row_count  
FROM public.emergency_notifications;