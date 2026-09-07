const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role key if possible to bypass RLS, but if not available, try anon
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// If SUPABASE_SERVICE_ROLE_KEY is not defined, we might get RLS errors
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tagName = "ยุทธศาสตร์สุขภาพ สระแก้ว (5 ปี)";
  let { data: tagData } = await supabase.from('kpi_tags').select('id').eq('name', tagName).single();
  let tagId;
  
  if (!tagData) {
    const { data: newTag, error: tagErr } = await supabase.from('kpi_tags').insert({ name: tagName }).select().single();
    if (tagErr) {
      console.log("Error inserting tag:", tagErr);
      return;
    }
    tagId = newTag.id;
  } else {
    tagId = tagData.id;
  }
  
  const { data: krData } = await supabase.from('key_results').select('id');
  const inserts = krData.map(kr => ({ key_result_id: kr.id, tag_id: tagId }));
  
  const { error } = await supabase.from('key_result_tags').upsert(inserts, { onConflict: 'key_result_id,tag_id' });
  if (error) console.error(error);
  else console.log("Assigned tag to", inserts.length, "key results.");
}
run();
