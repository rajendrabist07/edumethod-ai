-- Enable the pgvector extension in Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the syllabus_chunks table with pgvector column
CREATE TABLE IF NOT EXISTS public.syllabus_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id UUID REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768), -- Gemini text-embedding-004 vector dimension is 768
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for fast vector similarity search using HNSW
CREATE INDEX IF NOT EXISTS idx_syllabus_chunks_embedding 
  ON public.syllabus_chunks 
  USING hnsw (embedding vector_cosine_ops);

-- Index user lookups
CREATE INDEX IF NOT EXISTS idx_syllabus_chunks_user_id ON public.syllabus_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_chunks_learning_path_id ON public.syllabus_chunks(learning_path_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.syllabus_chunks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS select_own_syllabus_chunks ON public.syllabus_chunks;
DROP POLICY IF EXISTS insert_own_syllabus_chunks ON public.syllabus_chunks;
DROP POLICY IF EXISTS delete_own_syllabus_chunks ON public.syllabus_chunks;

-- Security Policies
CREATE POLICY select_own_syllabus_chunks ON public.syllabus_chunks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY insert_own_syllabus_chunks ON public.syllabus_chunks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY delete_own_syllabus_chunks ON public.syllabus_chunks
  FOR DELETE USING (user_id = auth.uid());

-- Create or replace similarity search RPC function match_syllabus_chunks
CREATE OR REPLACE FUNCTION public.match_syllabus_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.35,
  match_count int DEFAULT 5,
  filter_learning_path_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  learning_path_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.learning_path_id,
    sc.content,
    (1 - (sc.embedding <=> query_embedding))::float AS similarity,
    sc.metadata
  FROM public.syllabus_chunks sc
  WHERE
    (filter_learning_path_id IS NULL OR sc.learning_path_id = filter_learning_path_id)
    AND (1 - (sc.embedding <=> query_embedding)) >= match_threshold
  ORDER BY sc.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;
