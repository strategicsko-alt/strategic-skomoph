const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('key_results').select('responsible_group');
  if (error) console.error(error);
  else {
    const groups = new Set(data.map(d => d.responsible_group).filter(Boolean));
    console.log(Array.from(groups));
  }
}
run();
