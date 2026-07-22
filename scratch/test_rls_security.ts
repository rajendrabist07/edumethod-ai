import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function verifyRLS() {
  const { supabase } = await import("../lib/supabase");
  console.log("==========================================");
  console.log("🛡️ Supabase Row-Level Security (RLS) Audit");
  console.log("==========================================\n");

  console.log("1. Attempting unauthenticated SELECT on 'learning_paths'...");
  const { data: paths, error: pathsErr } = await supabase
    .from("learning_paths")
    .select("*");

  if (pathsErr) {
    console.log(`❌ paths read blocked with error: ${pathsErr.message}`);
  } else if (!paths || paths.length === 0) {
    console.log("✅ paths read returned 0 rows (RLS isolated).");
  } else {
    console.warn("⚠️ WARNING: Read returned rows! RLS might be disabled on learning_paths!");
  }

  console.log("\n2. Attempting unauthenticated SELECT on 'doubt_sessions'...");
  const { data: sessions, error: sessionsErr } = await supabase
    .from("doubt_sessions")
    .select("*");

  if (sessionsErr) {
    console.log(`❌ sessions read blocked with error: ${sessionsErr.message}`);
  } else if (!sessions || sessions.length === 0) {
    console.log("✅ sessions read returned 0 rows (RLS isolated).");
  } else {
    console.warn("⚠️ WARNING: Read returned rows! RLS might be disabled on doubt_sessions!");
  }

  console.log("\n3. Attempting unauthenticated SELECT on 'flashcard_decks'...");
  const { data: decks, error: decksErr } = await supabase
    .from("flashcard_decks")
    .select("*");

  if (decksErr) {
    console.log(`❌ decks read blocked with error: ${decksErr.message}`);
  } else if (!decks || decks.length === 0) {
    console.log("✅ decks read returned 0 rows (RLS isolated).");
  } else {
    console.warn("⚠️ WARNING: Read returned rows! RLS might be disabled on flashcard_decks!");
  }

  console.log("\n4. Attempting raw insert without user_id on 'doubt_sessions'...");
  const { error: insertErr } = await supabase
    .from("doubt_sessions")
    .insert({
      messages: [{ role: "user", content: "Attack attempt" }]
    });

  if (insertErr) {
    console.log(`✅ Insert blocked by security constraints: ${insertErr.message}`);
  } else {
    console.warn("⚠️ WARNING: Insert succeeded without authentication!");
  }

  console.log("\nRLS Audit complete.");
}

verifyRLS();
