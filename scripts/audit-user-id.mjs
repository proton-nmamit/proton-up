import fs from 'fs';
import path from 'path';

function searchDir(dir, pattern, results = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === '.gemini') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, pattern, results);
    } else if (/\.(ts|tsx|js|mjs|sql)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes(pattern)) {
          results.push({ file: fullPath, lineNum: idx + 1, line: line.trim() });
        }
      });
    }
  }
  return results;
}

const matches = searchDir('.', 'user_id');
console.log('Total matches for user_id:', matches.length);
matches.forEach(m => console.log(`${m.file}:${m.lineNum} -> ${m.line.slice(0, 100)}`));
