import fs from 'node:fs';
import path from 'node:path';

function fail(message) {
  console.error(`\n[verify-routing] ${message}\n`);
  process.exit(1);
}

const repoRoot = process.cwd();
const appPath = path.join(repoRoot, 'App.tsx');

if (!fs.existsSync(appPath)) {
  fail(`Missing App.tsx at ${appPath}`);
}

const appSource = fs.readFileSync(appPath, 'utf8');

// Guard against reintroducing alternate homepage routes.
const forbiddenRouteFragments = ['/test-home', '/spa-home'];
for (const frag of forbiddenRouteFragments) {
  if (appSource.includes(frag)) {
    fail(`Forbidden route detected in App.tsx: ${frag}`);
  }
}

// Guard against reintroducing the removed Homepage v2.1 entry point.
// (Homepage v2.1 implementation has been deleted from the repo.)
if (appSource.includes('path="/home"')) {
  fail('Forbidden route detected in App.tsx: /home (homepage v2.1 was removed)');
}
if (appSource.includes('/modules/homepage-v2') || appSource.includes('homepage-v2')) {
  fail('Forbidden homepage-v2 reference detected in App.tsx');
}

// Ensure root route exists exactly once and redirects to the canonical homepage.
const rootRouteRegex = /<Route\s+path=\"\/\"\s+element=\{<Navigate\s+to=\"\/demo-shell\/a\"\s+replace\s*\/?>\}\s*\/>/g;
const rootMatches = appSource.match(rootRouteRegex) ?? [];
if (rootMatches.length !== 1) {
  fail(`Expected exactly 1 root route "/" redirecting to "/demo-shell/a", found ${rootMatches.length}.`);
}

console.log('[verify-routing] OK');
