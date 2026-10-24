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

  // 1. Build production bundle
  console.log('[1/4] Building production bundle...');
  run('npm.cmd run build');

  // 2. Commit changes to main branch
  console.log('\n[2/4] Checking Git status and staging changes...');
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

  // 3. Push main branch
  console.log('\n[3/4] Pushing source code to GitHub (main)...');
  run('git push origin main');

  // 4. Update gh-pages branch for live web hosting
  console.log('\n[4/4] Deploying live web app to GitHub Pages (gh-pages)...');
  const blob = execSync('git hash-object -w pdf-notes-editor.html').toString().trim();
  const treeInput = `100644 blob ${blob}\tindex.html\n`;
  const tree = execSync('git mktree', { input: treeInput }).toString().trim();
  const commit = execSync(`git commit-tree ${tree} -m "Deploy latest build to GitHub Pages"`).toString().trim();
  execSync(`git update-ref refs/heads/gh-pages ${commit}`);
  run('git push origin gh-pages --force');

  console.log('\n========================================================');
  console.log('✓ SUCCESS: Build, source sync, and GitHub Pages updated!');
  console.log('========================================================\n');
} catch (error) {
  console.error('\n❌ Sync failed:', error.message);
  process.exit(1);
}
