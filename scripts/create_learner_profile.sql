-- Create learner_profiles table
CREATE TABLE IF NOT EXISTS public.learner_profiles (
  user_id TEXT PRIMARY KEY REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  mastery_scores JSONB DEFAULT '{}'::jsonb,
  recent_mistakes JSONB DEFAULT '[]'::jsonb,
  preferred_explanation_style TEXT DEFAULT 'balanced',
  study_times JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for user lookup speed
CREATE INDEX IF NOT EXISTS idx_learner_profiles_user_id ON public.learner_profiles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to ensure clean idempotent creation
DROP POLICY IF EXISTS read_own_learner_profile ON public.learner_profiles;
DROP POLICY IF EXISTS insert_own_learner_profile ON public.learner_profiles;
DROP POLICY IF EXISTS update_own_learner_profile ON public.learner_profiles;

-- Create Security Policies
CREATE POLICY read_own_learner_profile ON public.learner_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_learner_profile ON public.learner_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_learner_profile ON public.learner_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
