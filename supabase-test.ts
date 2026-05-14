import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zhvwwxossnddrtthkzks.supabase.co";
const supabaseAnonKey = "sb_publishable_oElJPoVECQ4VW5SFVohcrw_tA1hqL-M";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log("Testing Supabase connection...");
  const { data, error } = await supabase.storage.getBucket('avatars');
  console.log("Bucket check error:", error);
  console.log("Bucket check data:", data);
}
testConnection();
