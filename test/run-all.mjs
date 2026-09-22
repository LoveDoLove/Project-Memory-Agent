import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function findTestFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && entry.name.endsWith('.test.mjs')) {
      const parent = entry.parentPath || entry.path || dir;
      files.push(path.join(parent, entry.name));
    }
  }
  return files.sort();
}

const files = findTestFiles('test');
const res = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(res.status ?? 1);
