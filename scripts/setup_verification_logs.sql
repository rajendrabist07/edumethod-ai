-- Verification Logs Table
CREATE TABLE IF NOT EXISTS public.ai_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  request_type TEXT NOT NULL, -- 'quiz', 'solve-doubt', 'math'
  passed BOOLEAN NOT NULL,
  reason TEXT DEFAULT '',
  math_code_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast user and analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_verification_logs_user_id ON public.ai_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_verification_logs_request_type ON public.ai_verification_logs(request_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_verification_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS select_own_verification_logs ON public.ai_verification_logs;
DROP POLICY IF EXISTS insert_own_verification_logs ON public.ai_verification_logs;

-- Create Policies
CREATE POLICY select_own_verification_logs ON public.ai_verification_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY insert_own_verification_logs ON public.ai_verification_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());
