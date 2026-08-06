-- Indexes for fast journey overview lookups
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_created 
  ON public.learning_paths(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_next_review 
  ON public.flashcard_decks(user_id, next_review);

CREATE INDEX IF NOT EXISTS idx_flashcards_user_next_review 
  ON public.flashcards(user_id, next_review);

CREATE INDEX IF NOT EXISTS idx_quizzes_user_created 
  ON public.quizzes(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_doubt_sessions_user_created 
  ON public.doubt_sessions(user_id, created_at DESC);
