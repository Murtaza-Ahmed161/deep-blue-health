-- Beta Invite Codes Table
CREATE TABLE public.beta_invite_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Feedback & Bug Reports Table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT,
  device_info JSONB,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Sessions & Analytics Table
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  device_type TEXT,
  browser TEXT,
  page_views INTEGER DEFAULT 0,
  actions_performed JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System Health Metrics Table
CREATE TABLE public.system_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('connection_uptime', 'alert_triggered', 'ai_screening', 'api_error', 'page_load')),
  metric_value NUMERIC,
  metadata JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for beta_invite_codes
CREATE POLICY "Anyone can view active invite codes"
  ON public.beta_invite_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Only admins can manage invite codes"
  ON public.beta_invite_codes FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for feedback
CREATE POLICY "Users can create their own feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update feedback status"
  ON public.feedback FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_sessions
CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for system_metrics
CREATE POLICY "System can insert metrics"
  ON public.system_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all metrics"
  ON public.system_metrics FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for feedback updated_at
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_start ON public.user_sessions(session_start DESC);
CREATE INDEX idx_system_metrics_type ON public.system_metrics(metric_type);
CREATE INDEX idx_system_metrics_recorded_at ON public.system_metrics(recorded_at DESC);