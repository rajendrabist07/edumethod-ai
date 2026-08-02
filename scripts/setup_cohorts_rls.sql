-- Cohorts & Cohort Members RLS Setup
-- Execute these SQL statements in your Supabase SQL editor to secure data access.

-- Enable Row Level Security
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_members ENABLE ROW LEVEL SECURITY;

-- 1. Cohorts Policies
-- Teachers can do anything with their own cohorts
CREATE POLICY teacher_all_cohorts ON public.cohorts
  FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Students can read cohorts they are members of
CREATE POLICY member_read_cohorts ON public.cohorts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cohort_members
      WHERE cohort_members.cohort_id = cohorts.id
      AND cohort_members.student_id = auth.uid()
    )
  );

-- 2. Cohort Members Policies
-- Teachers can view members of cohorts they own
CREATE POLICY teacher_read_members ON public.cohort_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cohorts
      WHERE cohorts.id = cohort_members.cohort_id
      AND cohorts.teacher_id = auth.uid()
    )
  );

-- Students can read their own memberships
CREATE POLICY student_read_members ON public.cohort_members
  FOR SELECT
  USING (student_id = auth.uid());

-- Students can insert themselves into a cohort membership (join classroom)
CREATE POLICY student_join_cohort ON public.cohort_members
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Students can delete themselves from a membership (leave classroom)
CREATE POLICY student_leave_cohort ON public.cohort_members
  FOR DELETE
  USING (student_id = auth.uid());
