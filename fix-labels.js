const fs = require('fs');
let file = fs.readFileSync('src/app/editor/kpi-template/page.tsx', 'utf8');

// Replace in emptyRow
file = file.replace(/data_items: \[\{ id: 'A', label: 'ตัวตั้ง' \}, \{ id: 'B', label: 'ตัวหาร' \}\]/g, 
  "data_items: [{ id: 'A', label: '' }, { id: 'B', label: '' }]");

// Replace in fetch logic
file = file.replace(/dict\?\.numerator \|\| 'ตัวตั้ง'/g, "dict?.numerator || ''");
file = file.replace(/dict\?\.denominator \|\| 'ตัวหาร'/g, "dict?.denominator || ''");

// Replace placeholder in UI
file = file.replace(/placeholder="คำอธิบายค่า"/g, 'placeholder="ยังไม่มีการกำหนดไว้"');

fs.writeFileSync('src/app/editor/kpi-template/page.tsx', file);
