const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fix() {
  console.log("Fixing numerator...");
  await supabase.from('kpi_dictionaries').update({ numerator: '' }).eq('numerator', 'ตัวตั้ง');
  
  console.log("Fixing denominator...");
  await supabase.from('kpi_dictionaries').update({ denominator: '' }).eq('denominator', 'ตัวหาร');
  
  console.log("Done.");
}
fix();
