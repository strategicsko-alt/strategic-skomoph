const fs = require('fs');

const path = 'src/app/kpi/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the literal string hIdx with its evaluated index 0 to 4
let count = 0;
content = content.replace(/idx \+ hIdx/g, () => `idx + ${count++}`);

fs.writeFileSync(path, content);
