-- Database Performance Optimization Indexes
-- Run these DDL queries in your Supabase SQL Editor to index foreign keys and frequently queried columns.

-- 1. Index foreign keys/user lookups on major user data tables
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_feynman_evaluations_user_id ON feynman_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_doubt_sessions_user_id ON doubt_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 2. Index foreign keys for sub-relations
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_learning_path_id ON flashcard_decks(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_learning_path_id ON quizzes(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_topic_prerequisites_learning_path_id ON topic_prerequisites(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_chunks_learning_path_id ON syllabus_chunks(learning_path_id);
