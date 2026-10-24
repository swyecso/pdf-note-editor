import fs from 'fs';
import path from 'path';

const distFile = path.resolve('dist/index.html');
const targetFile = path.resolve('pdf-notes-editor.html');

if (fs.existsSync(distFile)) {
  fs.copyFileSync(distFile, targetFile);
  console.log('✓ Inlined bundle copied to pdf-notes-editor.html');
} else {
  console.error('dist/index.html not found!');
  process.exit(1);
}
