import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function readSession() {
  const { supabaseAdmin } = await import("../lib/supabase-admin");
  console.log("Reading last doubt session from DB...");
  const { data: sessions, error } = await supabaseAdmin
    .from("doubt_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !sessions || sessions.length === 0) {
    console.error("No sessions found or DB error:", error);
    return;
  }

  const session = sessions[0];
  console.log(`\nSession ID: ${session.id}`);
  console.log(`Updated At: ${session.updated_at}`);
  console.log("\nMessages JSON from DB:");
  console.log(JSON.stringify(session.messages, null, 2));
}

readSession();
