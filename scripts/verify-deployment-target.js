#!/usr/bin/env node

/**
 * DEPLOYMENT VERIFICATION SCRIPT
 * 
 * This script verifies that you're deploying to the correct target BEFORE pushing.
 * It checks:
 * 1. Current git branch is 'main'
 * 2. No uncommitted changes
 * 3. Displays deployment target (Vercel/Firebase)
 * 
 * Usage: npm run verify-deploy
 */

import { execSync } from 'child_process';

console.log('\n🔍 DEPLOYMENT VERIFICATION\n');
console.log('═'.repeat(60));

try {
  // 1. Check current branch
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD')
    .toString()
    .trim();

  console.log(`\n✓ Current branch: ${currentBranch}`);

  if (currentBranch !== 'main') {
    console.log(
      '\n⚠️  WARNING: You are not on the main branch!',
      '\nDev.khuyoot.app only updates from the "main" branch.',
      '\nSwitch to main with: git checkout main'
    );
    process.exit(1);
  }

  // 2. Check for uncommitted changes
  const gitStatus = execSync('git status --porcelain')
    .toString()
    .trim();

  if (gitStatus) {
    console.log('\n⚠️  WARNING: You have uncommitted changes:');
    console.log(gitStatus);
    console.log(
      '\nCommit them first with:',
      '\n  git add .',
      '\n  git commit -m "your message"'
    );
    process.exit(1);
  }

  console.log('✓ All changes are committed');

  // 3. Show deployment target
  console.log('\n' + '═'.repeat(60));
  console.log('\n📍 DEPLOYMENT TARGET:\n');
  console.log('Domain:        dev.khuyoot.app');
  console.log('Hosting:       Vercel (auto-deploy from GitHub)');
  console.log('Action:        git push origin main');
  console.log('Time:          2-3 minutes for Vercel to build & deploy');
  console.log('\n' + '═'.repeat(60));

  // 4. Show what will be deployed
  const lastCommit = execSync('git log -1 --oneline')
    .toString()
    .trim();

  console.log('\n📦 WILL DEPLOY:\n');
  console.log(`Commit: ${lastCommit}`);
  console.log(`Branch: ${currentBranch}`);

  try {
    const filesToDeploy = execSync('git diff --name-only origin/main...main')
      .toString()
      .trim()
      .split('\n')
      .filter(f => f.length > 0);

    if (filesToDeploy.length > 0) {
      console.log(`Files changed: ${filesToDeploy.length}`);
      filesToDeploy.slice(0, 5).forEach(f => console.log(`  • ${f}`));
      if (filesToDeploy.length > 5) {
        console.log(`  ... and ${filesToDeploy.length - 5} more`);
      }
    }
  } catch (e) {
    // If no differences, that's ok
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ VERIFICATION PASSED\n');
  console.log('Ready to deploy! Run: git push origin main\n');
  console.log('═'.repeat(60) + '\n');

} catch (error) {
  console.error('\n❌ VERIFICATION FAILED:\n', error.message);
  process.exit(1);
}
