-- Quiz Outcome Flywheel Logs Table
CREATE TABLE IF NOT EXISTS public.quiz_outcome_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  question_index INT NOT NULL,
  topic TEXT NOT NULL,
  strategy_used TEXT NOT NULL, -- 'socratic', 'direct-explanation', 'worked-example', 'challenge'
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for flywheel aggregation queries
CREATE INDEX IF NOT EXISTS idx_quiz_outcome_logs_strategy ON public.quiz_outcome_logs(strategy_used);
CREATE INDEX IF NOT EXISTS idx_quiz_outcome_logs_topic ON public.quiz_outcome_logs(topic);
CREATE INDEX IF NOT EXISTS idx_quiz_outcome_logs_user_id ON public.quiz_outcome_logs(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.quiz_outcome_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS select_own_quiz_outcome_logs ON public.quiz_outcome_logs;
DROP POLICY IF EXISTS insert_own_quiz_outcome_logs ON public.quiz_outcome_logs;

-- Security Policies
CREATE POLICY select_own_quiz_outcome_logs ON public.quiz_outcome_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY insert_own_quiz_outcome_logs ON public.quiz_outcome_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());
