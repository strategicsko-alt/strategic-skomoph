const fs = require('fs');
let file = fs.readFileSync('src/app/editor/kpi-template/page.tsx', 'utf8');

file = file.replace(/if \(editingKpi\.calc_type !== 'process_status'\) \{\s*if \(editingKpi\.data_items\.length >= 1\) payload\.numerator = editingKpi\.data_items\[0\]\.label;\s*if \(editingKpi\.data_items\.length >= 2\) payload\.denominator = editingKpi\.data_items\[1\]\.label;\s*\}/g, 
  "// Removed overwriting of numerator and denominator to prevent data loss in KPI Dictionary");

fs.writeFileSync('src/app/editor/kpi-template/page.tsx', file);
