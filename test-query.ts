import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase
    .from('key_results')
    .select('auto_id, responsible_group, kpi_dict:kpi_dictionaries(work_group, responsible_person)')
    .eq('auto_id', 'KR3.4.1.1');
    
  console.log(JSON.stringify({data, error}, null, 2));
}
run();
