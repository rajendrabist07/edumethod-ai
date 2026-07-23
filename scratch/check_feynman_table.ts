import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkTable() {
  const { supabaseAdmin } = await import("../lib/supabase-admin");
  console.log("Checking feynman_evaluations table status...");
  const { data, error } = await supabaseAdmin
    .from("feynman_evaluations")
    .select("*")
    .limit(1);

  if (error) {
    console.log(`❌ Table check failed: ${error.message}`);
    console.log("This indicates the table needs to be created using the SQL schema in the Supabase Editor.");
  } else {
    console.log("✅ feynman_evaluations table exists and is ready!");
  }
}

checkTable();
