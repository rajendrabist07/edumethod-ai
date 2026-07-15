import * as dotenv from "dotenv";
import * as path from "path";
// Load environment variables first
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { supabaseAdmin } from "../lib/supabase-admin";

async function run() {
  console.log("Checking if message_feedback table exists...");
  const { data: fbData, error: fbError } = await supabaseAdmin
    .from("message_feedback")
    .select("*")
    .limit(1);

  if (fbError) {
    console.error("message_feedback check error:", fbError.message);
  } else {
    console.log("message_feedback table exists and is readable!");
  }

  console.log("Checking if user_reports table exists...");
  const { data: repData, error: repError } = await supabaseAdmin
    .from("user_reports")
    .select("*")
    .limit(1);

  if (repError) {
    console.error("user_reports check error:", repError.message);
  } else {
    console.log("user_reports table exists and is readable!");
  }
}

run();
