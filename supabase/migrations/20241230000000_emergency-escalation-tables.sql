-- Emergency Escalation System Migration
-- Phase 2: Real Emergency Escalation Implementation

-- Add emergency_location consent type to existing enum (if not already present)
-- Note: 'location' already exists, so we'll use that for emergency location consent

-- Create emergency_events table
CREATE TABLE public.emergency_events (
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

-- Create emergency_notifications table for audit trail
CREATE TABLE public.emergency_notifications (
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

-- Doctors and admins can view all emergency events
CREATE POLICY "Doctors can view all emergency events"
ON public.emergency_events
FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

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

-- Doctors and admins can view all emergency notifications
CREATE POLICY "Doctors can view all emergency notifications"
ON public.emergency_notifications
FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create indexes for performance
CREATE INDEX idx_emergency_events_patient_id ON public.emergency_events(patient_id, triggered_at DESC);
CREATE INDEX idx_emergency_events_status ON public.emergency_events(status, triggered_at DESC);
CREATE INDEX idx_emergency_events_triggered_at ON public.emergency_events(triggered_at DESC);

CREATE INDEX idx_emergency_notifications_event_id ON public.emergency_notifications(event_id, created_at DESC);
CREATE INDEX idx_emergency_notifications_status ON public.emergency_notifications(status, created_at DESC);
CREATE INDEX idx_emergency_notifications_recipient ON public.emergency_notifications(recipient_address, created_at DESC);

-- Add trigger for emergency_events updated_at
CREATE TRIGGER update_emergency_events_updated_at
BEFORE UPDATE ON public.emergency_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for emergency events (for doctor dashboards)
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_notifications;

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