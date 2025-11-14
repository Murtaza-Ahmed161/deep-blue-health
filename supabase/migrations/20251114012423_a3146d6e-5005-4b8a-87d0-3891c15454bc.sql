-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  critical_alerts BOOLEAN NOT NULL DEFAULT true,
  new_reports BOOLEAN NOT NULL DEFAULT true,
  doctor_messages BOOLEAN NOT NULL DEFAULT true,
  vitals_warnings BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own preferences
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create offline queue table for failed requests
CREATE TABLE IF NOT EXISTS public.offline_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  request_data JSONB NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offline_queue ENABLE ROW LEVEL SECURITY;

-- Users can manage their own queue
CREATE POLICY "Users can view their own offline queue"
  ON public.offline_queue
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own offline queue"
  ON public.offline_queue
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offline queue"
  ON public.offline_queue
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own offline queue"
  ON public.offline_queue
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_offline_queue_updated_at
  BEFORE UPDATE ON public.offline_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();