#!/usr/bin/env node
/**
 * Release script for @edd_remonts/create-edd-app
 *
 * Usage:
 *   pnpm release           — interactive: prompts for bump type
 *   pnpm release patch     — bump patch (0.1.1 → 0.1.2)
 *   pnpm release minor     — bump minor (0.1.1 → 0.2.0)
 *   pnpm release major     — bump major (0.1.1 → 1.0.0)
 *   pnpm release 1.2.3     — set explicit version
 *
 * What it does:
 *   1. Validates the working tree is clean
 *   2. Bumps the version in tools/create-edd-app/package.json
 *   3. Commits: "chore(create-edd-app): bump version to X.Y.Z"
 *   4. Creates an annotated tag: create-edd-app-vX.Y.Z
 *   5. Pushes branch + tag to origin
 *   6. Optionally creates a GitHub Release (requires `gh` CLI)
 *
 * GitHub Actions then publishes to npm automatically.
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const PKG_PATH = resolve(ROOT, 'tools/create-edd-app/package.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function exec(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

function execOut(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function isValidSemver(v) {
  return /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(v);
}

function ask(rl, question) {
  return new Promise(res => rl.question(question, ans => res(ans.trim())));
}

function abort(msg) {
  console.error(`\nAborted: ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Guard: clean working tree
// ---------------------------------------------------------------------------

const dirty = execOut('git status --porcelain');
if (dirty) {
  console.error('Working tree is not clean. Commit or stash your changes first:');
  console.error(dirty);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Determine new version
// ---------------------------------------------------------------------------

const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
const currentVersion = pkg.version;

const rl = createInterface({ input: process.stdin, output: process.stdout });

let bumpArg = process.argv[2];

if (!bumpArg) {
  console.log(`\nCurrent @edd_remonts/create-edd-app version: \x1b[36m${currentVersion}\x1b[0m\n`);
  const choices = [
    `  patch  →  ${bumpVersion(currentVersion, 'patch')}`,
    `  minor  →  ${bumpVersion(currentVersion, 'minor')}`,
    `  major  →  ${bumpVersion(currentVersion, 'major')}`,
    `  or type an explicit version (e.g. 1.0.0-rc.1)`,
  ].join('\n');
  console.log(choices + '\n');
  bumpArg = await ask(rl, 'Bump type or version: ');
}

let newVersion;
if (['patch', 'minor', 'major'].includes(bumpArg)) {
  newVersion = bumpVersion(currentVersion, bumpArg);
} else if (isValidSemver(bumpArg)) {
  newVersion = bumpArg;
} else {
  rl.close();
  abort(`"${bumpArg}" is not a valid bump type or semver string.`);
}

const tag = `create-edd-app-v${newVersion}`;

console.log(`\n  \x1b[2m${currentVersion}\x1b[0m  →  \x1b[32m${newVersion}\x1b[0m  (tag: \x1b[33m${tag}\x1b[0m)\n`);

const confirm = await ask(rl, 'Proceed? (y/N) ');
if (confirm.toLowerCase() !== 'y') {
  rl.close();
  abort('User cancelled.');
}

// ---------------------------------------------------------------------------
// Bump, commit, tag, push
// ---------------------------------------------------------------------------

pkg.version = newVersion;
writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
console.log(`\n✓ Bumped ${PKG_PATH}`);

exec('git add tools/create-edd-app/package.json');
exec(`git commit -m "chore(create-edd-app): bump version to ${newVersion}"`);
console.log('✓ Committed version bump');

exec(`git tag ${tag} -m "release: @edd_remonts/create-edd-app v${newVersion}"`);
console.log(`✓ Created tag ${tag}`);

exec('git push origin main');
exec(`git push origin ${tag}`);
console.log('✓ Pushed main and tag to origin');

// ---------------------------------------------------------------------------
// Optional GitHub Release
// ---------------------------------------------------------------------------

let ghAvailable = false;
try {
  execOut('which gh');
  ghAvailable = true;
} catch {
  // gh not installed
}

if (ghAvailable) {
  const createRelease = await ask(rl, '\nCreate GitHub Release? (y/N) ');
  if (createRelease.toLowerCase() === 'y') {
    exec(
      `gh release create ${tag}` +
        ` --repo eddremonts86/edd-app-template` +
        ` --title "@edd_remonts/create-edd-app v${newVersion}"` +
        ` --generate-notes`
    );
    console.log(
      `✓ Release: https://github.com/eddremonts86/edd-app-template/releases/tag/${tag}`
    );
  }
} else {
  console.log('\nNote: install gh CLI to create GitHub Releases automatically.');
}

rl.close();

console.log(
  `\n\x1b[32m✓ Done!\x1b[0m CI will publish @edd_remonts/create-edd-app@${newVersion} to npm.`
);
console.log(
  `  Monitor: https://github.com/eddremonts86/edd-app-template/actions\n`
);
