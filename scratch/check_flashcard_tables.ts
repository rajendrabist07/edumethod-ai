import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkTables() {
  // Dynamically import to ensure dotenv.config() runs first
  const { supabaseAdmin } = await import("../lib/supabase-admin");

  console.log("Checking if 'flashcard_decks' table exists...");
  const { data: deckData, error: deckError } = await supabaseAdmin
    .from("flashcard_decks")
    .select("id")
    .limit(1);

  if (deckError) {
    console.error("❌ flashcard_decks check error:", deckError.message);
  } else {
    console.log("✅ flashcard_decks table exists and is readable!");
  }

  console.log("Checking if 'flashcards' table exists...");
  const { data: cardData, error: cardError } = await supabaseAdmin
    .from("flashcards")
    .select("id")
    .limit(1);

  if (cardError) {
    console.error("❌ flashcards check error:", cardError.message);
  } else {
    console.log("✅ flashcards table exists and is readable!");
  }
}

checkTables();
