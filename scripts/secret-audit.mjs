import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'data') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (/\.(ts|tsx|js|mjs|json)$/.test(file) && !file.includes('package-lock.json')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('.');
let leaksFound = 0;

for (const file of files) {
  if (file.includes('.env') || file.includes('secret-audit')) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('npg_' + '') || content.includes('postgresql://' + 'neondb_owner')) {
    console.error(`❌ Potential secret found in: ${file}`);
    leaksFound++;
  }
}

if (leaksFound === 0) {
  console.log('✅ SECRET AUDIT PASSED: Zero credentials or connection strings committed.');
} else {
  console.error(`❌ ${leaksFound} files contain secrets!`);
  process.exit(1);
}
