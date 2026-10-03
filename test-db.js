const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('contacts').select('*');
  console.log("Contacts count:", data?.length);
  if (data) {
    console.log(data.map(d => d.name));
  }
}
check();
