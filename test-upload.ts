import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zhvwwxossnddrtthkzks.supabase.co";
const supabaseAnonKey = "sb_publishable_oElJPoVECQ4VW5SFVohcrw_tA1hqL-M";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpload() {
  console.log("Testing Supabase upload...");
  const dummyContent = "Hello World";
  const blob = new Blob([dummyContent], { type: 'text/plain' });
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload('test/hello.txt', blob, { upsert: true });

  if (error) {
    console.error("Upload Error:", error);
  } else {
    console.log("Upload Success:", data);
  }
}
testUpload();
