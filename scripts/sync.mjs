import { execSync } from 'child_process';
import path from 'path';

function run(command) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit' });
}

try {
  console.log('========================================================');
  console.log('       PDF Note Editor - Build & Sync to GitHub');
  console.log('========================================================\n');

  console.log('[1/3] Building production bundle...');
  run('npm.cmd run build');

  console.log('\n[2/3] Checking Git status and staging changes...');
  run('git add .');

  const status = execSync('git status --porcelain').toString().trim();
  if (status.length === 0) {
    console.log('Working tree is already clean. Nothing new to commit.');
  } else {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    console.log(`Committing changes (${timestamp})...`);
    run(`git commit -m "Auto-sync build: ${timestamp}"`);
  }

  console.log('\n[3/3] Pushing to GitHub (origin/main)...');
  run('git push origin main');

  console.log('\n========================================================');
  console.log('✓ SUCCESS: Build and GitHub sync completed!');
  console.log('========================================================\n');
} catch (error) {
  console.error('\n❌ Sync failed:', error.message);
  process.exit(1);
}
