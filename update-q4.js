const fs = require('fs');
let file = fs.readFileSync('src/app/editor/kpi-template/page.tsx', 'utf8');

file = file.replace(
  /\.select\('id, name, auto_id, responsible_group, objective:objectives\(name\), tags:key_result_tags\(tag:kpi_tags\(name\)\)'\)/,
  `.select('id, name, auto_id, responsible_group, target_2570, objective:objectives(name), tags:key_result_tags(tag:kpi_tags(name))')`
);

file = file.replace(
  /const evalCriteria = dict\?\.evaluation_criteria_json\s*\?\s*\(typeof dict\.evaluation_criteria_json === 'string' \? JSON\.parse\(dict\.evaluation_criteria_json\) : dict\.evaluation_criteria_json\)\s*:\s*\{\};\s*const apiConfig/m,
  `const evalCriteria = dict?.evaluation_criteria_json
        ? (typeof dict.evaluation_criteria_json === 'string' ? JSON.parse(dict.evaluation_criteria_json) : dict.evaluation_criteria_json)
        : {};
      
      // Auto-extract number from target_2570 to use as Q4 default if missing
      if (!evalCriteria['Q4'] && kr.target_2570) {
        const numMatch = kr.target_2570.toString().replace(/,/g, '').match(/\\d+(\\.\\d+)?/);
        if (numMatch) {
          evalCriteria['Q4'] = numMatch[0];
        }
      }

      const apiConfig`
);

fs.writeFileSync('src/app/editor/kpi-template/page.tsx', file);
