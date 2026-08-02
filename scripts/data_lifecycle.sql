-- Data Lifecycle Policy Migration
-- Run these SQL statements in your Supabase SQL Editor to aggregate and prune old AI request logs.

-- 1. Create a daily aggregated metrics table to preserve long-term cost/volume trends
CREATE TABLE IF NOT EXISTS public.daily_ai_metrics (
  day DATE NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  request_type TEXT NOT NULL,
  total_requests INT DEFAULT 0,
  avg_latency_ms NUMERIC DEFAULT 0,
  total_prompt_tokens INT DEFAULT 0,
  total_completion_tokens INT DEFAULT 0,
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  PRIMARY KEY (day, provider, model, request_type)
);

-- 2. Define a function that aggregates metrics and prunes raw logs older than 90 days
CREATE OR REPLACE FUNCTION public.aggregate_and_prune_ai_logs()
RETURNS void AS $$
BEGIN
  -- Insert/update daily aggregated metrics for logs older than 90 days
  INSERT INTO public.daily_ai_metrics (
    day, provider, model, request_type, 
    total_requests, avg_latency_ms, total_prompt_tokens, 
    total_completion_tokens, success_count, error_count
  )
  SELECT 
    created_at::date as day,
    provider,
    model,
    request_type,
    count(*) as total_requests,
    avg(latency_ms) as avg_latency_ms,
    sum(coalesce(prompt_tokens, 0)) as total_prompt_tokens,
    sum(coalesce(completion_tokens, 0)) as total_completion_tokens,
    count(case when status = 'success' then 1 end) as success_count,
    count(case when status = 'error' then 1 end) as error_count
  FROM public.ai_request_logs
  WHERE created_at < now() - interval '90 days'
  GROUP BY 1, 2, 3, 4
  ON CONFLICT (day, provider, model, request_type) DO UPDATE SET
    total_requests = daily_ai_metrics.total_requests + EXCLUDED.total_requests,
    avg_latency_ms = (daily_ai_metrics.avg_latency_ms * daily_ai_metrics.total_requests + EXCLUDED.avg_latency_ms * EXCLUDED.total_requests) / (daily_ai_metrics.total_requests + EXCLUDED.total_requests),
    total_prompt_tokens = daily_ai_metrics.total_prompt_tokens + EXCLUDED.total_prompt_tokens,
    total_completion_tokens = daily_ai_metrics.total_completion_tokens + EXCLUDED.total_completion_tokens,
    success_count = daily_ai_metrics.success_count + EXCLUDED.success_count,
    error_count = daily_ai_metrics.error_count + EXCLUDED.error_count;

  -- Delete raw logs older than 90 days
  DELETE FROM public.ai_request_logs
  WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;

-- 3. Schedule this function to run every night at 3:00 AM UTC using pg_cron (if pg_cron extension is enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--   'aggregate-and-prune-ai-logs',
--   '0 3 * * *',
--   'SELECT public.aggregate_and_prune_ai_logs()'
-- );
