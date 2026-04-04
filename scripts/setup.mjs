#!/usr/bin/env node

/**
 * Event App — Interactive Setup Script
 *
 * Automates Firebase project setup, .env.local generation, and rules deployment.
 *
 * Usage:
 *   node scripts/setup.mjs
 *
 * Prerequisites:
 *   - Node.js 18+
 *   - Firebase CLI: npm install -g firebase-tools
 *   - Logged in: firebase login
 */

import { execSync, spawnSync } from 'child_process';
import { createInterface } from 'readline';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const ENV_PATH = resolve(ROOT, '.env.local');

// ── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: opts.stdio || 'pipe', ...opts }).trim();
  } catch (e) {
    if (opts.ignoreError) return '';
    throw e;
  }
}

function ask(rl, question, defaultVal) {
  const suffix = defaultVal ? ` (${defaultVal})` : '';
  return new Promise((res) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      res(answer.trim() || defaultVal || '');
    });
  });
}

function checkCommand(name) {
  const result = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf-8' });
  return result.status === 0;
}

function printStep(n, msg) {
  console.log(`\n\x1b[36m[${ n }]\x1b[0m ${msg}`);
}

function printSuccess(msg) {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
}

function printWarn(msg) {
  console.log(`  \x1b[33m⚠\x1b[0m ${msg}`);
}

function printInfo(msg) {
  console.log(`  ${msg}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n\x1b[1m🎉 Event App Setup\x1b[0m\n');
  console.log('This script will set up Firebase and generate your .env.local file.\n');

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  // ── Step 1: Check prerequisites ────────────────────────────────────────────

  printStep(1, 'Checking prerequisites...');

  if (!checkCommand('firebase')) {
    console.error('\n  ✖ Firebase CLI not found. Install it:\n    npm install -g firebase-tools\n');
    process.exit(1);
  }
  printSuccess('Firebase CLI found');

  try {
    run('firebase projects:list --json');
    printSuccess('Firebase CLI authenticated');
  } catch {
    console.error('\n  ✖ Not logged in. Run:\n    firebase login\n');
    process.exit(1);
  }

  // ── Step 2: Firebase project ───────────────────────────────────────────────

  printStep(2, 'Firebase project setup');

  const createNew = await ask(rl, 'Create a new Firebase project? (y/n)', 'y');

  let projectId;

  if (createNew.toLowerCase() === 'y') {
    projectId = await ask(rl, 'Project ID (lowercase, hyphens ok)');
    if (!projectId) { console.error('  ✖ Project ID is required'); process.exit(1); }

    const displayName = await ask(rl, 'Display name', projectId);

    try {
      printInfo('Creating Firebase project...');
      run(`firebase projects:create ${projectId} --display-name "${displayName}"`);
      printSuccess(`Project "${projectId}" created`);
    } catch (e) {
      if (e.message?.includes('already exists')) {
        printWarn(`Project "${projectId}" already exists — using it`);
      } else {
        console.error(`  ✖ Failed to create project: ${e.message}`);
        process.exit(1);
      }
    }
  } else {
    printInfo('Available projects:');
    try {
      const json = run('firebase projects:list --json');
      const projects = JSON.parse(json).results || JSON.parse(json);
      projects.slice(0, 15).forEach((p) => printInfo(`  - ${p.projectId}`));
      if (projects.length > 15) printInfo(`  ... and ${projects.length - 15} more`);
    } catch {
      printWarn('Could not list projects — enter ID manually');
    }
    projectId = await ask(rl, 'Firebase project ID');
    if (!projectId) { console.error('  ✖ Project ID is required'); process.exit(1); }
  }

  // Set as active project
  try {
    run(`firebase use ${projectId}`);
    printSuccess(`Active project: ${projectId}`);
  } catch {
    printWarn('Could not set active project — you may need to run: firebase use ' + projectId);
  }

  // ── Step 3: Enable services ────────────────────────────────────────────────

  printStep(3, 'Enabling Firebase services...');

  // Enable Firestore
  try {
    printInfo('Setting up Firestore...');
    run(`firebase firestore:databases:create --project ${projectId} --location nam5 --json`, { ignoreError: true });
    printSuccess('Firestore database ready');
  } catch {
    printSuccess('Firestore database already exists or ready');
  }

  // Enable Storage
  try {
    printInfo('Note: If Storage isn\'t enabled yet, enable it at:');
    printInfo(`  https://console.firebase.google.com/project/${projectId}/storage`);
  } catch { /* ignore */ }

  // Anonymous Auth — must be enabled manually
  printWarn('Enable Anonymous Authentication manually:');
  printInfo(`  https://console.firebase.google.com/project/${projectId}/authentication/providers`);
  printInfo('  → Sign-in method → Anonymous → Enable\n');
  await ask(rl, 'Press Enter once Anonymous Auth is enabled...');

  // ── Step 4: Web app + config ───────────────────────────────────────────────

  printStep(4, 'Getting Firebase web app config...');

  // Try to get existing web app config, or create one
  let sdkConfig;
  try {
    const configJson = run(`firebase apps:sdkconfig web --project ${projectId} --json`);
    sdkConfig = JSON.parse(configJson).result?.sdkConfig;
  } catch {
    // No web app exists — create one
    try {
      printInfo('Creating web app...');
      run(`firebase apps:create web "Event App" --project ${projectId}`);
      const configJson = run(`firebase apps:sdkconfig web --project ${projectId} --json`);
      sdkConfig = JSON.parse(configJson).result?.sdkConfig;
    } catch (e) {
      printWarn('Could not auto-detect config. You\'ll need to enter values manually.');
    }
  }

  let envVars = {};

  if (sdkConfig) {
    printSuccess('Firebase config retrieved');
    envVars = {
      NEXT_PUBLIC_FIREBASE_API_KEY: sdkConfig.apiKey,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: sdkConfig.authDomain,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: sdkConfig.projectId,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: sdkConfig.storageBucket,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: sdkConfig.messagingSenderId,
      NEXT_PUBLIC_FIREBASE_APP_ID: sdkConfig.appId,
    };
  } else {
    printInfo('Enter your Firebase web app config values:');
    envVars = {
      NEXT_PUBLIC_FIREBASE_API_KEY: await ask(rl, '  API Key'),
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: await ask(rl, '  Auth Domain', `${projectId}.firebaseapp.com`),
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: await ask(rl, '  Project ID', projectId),
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: await ask(rl, '  Storage Bucket', `${projectId}.firebasestorage.app`),
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: await ask(rl, '  Messaging Sender ID'),
      NEXT_PUBLIC_FIREBASE_APP_ID: await ask(rl, '  App ID'),
    };
  }

  // ── Step 5: Service account (for admin API) ────────────────────────────────

  printStep(5, 'Service account for admin API');
  printInfo('The admin password verification API needs a service account.');
  printInfo(`Download a key from:`);
  printInfo(`  https://console.firebase.google.com/project/${projectId}/settings/serviceaccounts/adminsdk\n`);

  const hasKey = await ask(rl, 'Do you have the service account JSON file? (y/n)', 'n');

  if (hasKey.toLowerCase() === 'y') {
    const keyPath = await ask(rl, 'Path to service account JSON file');
    if (keyPath && existsSync(keyPath)) {
      try {
        const keyData = JSON.parse(readFileSync(keyPath, 'utf-8'));
        envVars.FIREBASE_CLIENT_EMAIL = keyData.client_email;
        envVars.FIREBASE_PRIVATE_KEY = JSON.stringify(keyData.private_key);
        printSuccess('Service account config extracted');
      } catch {
        printWarn('Could not parse key file — you\'ll need to add these manually to .env.local');
      }
    } else {
      printWarn('File not found — add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to .env.local later');
    }
  } else {
    printInfo('No problem — add these to .env.local later:');
    printInfo('  FIREBASE_CLIENT_EMAIL=...');
    printInfo('  FIREBASE_PRIVATE_KEY="..."');
    envVars.FIREBASE_CLIENT_EMAIL = '';
    envVars.FIREBASE_PRIVATE_KEY = '';
  }

  // ── Step 6: Write .env.local ───────────────────────────────────────────────

  printStep(6, 'Writing .env.local...');

  if (existsSync(ENV_PATH)) {
    const overwrite = await ask(rl, '.env.local already exists. Overwrite? (y/n)', 'n');
    if (overwrite.toLowerCase() !== 'y') {
      printWarn('Skipped — keeping existing .env.local');
    } else {
      writeEnvFile(envVars);
    }
  } else {
    writeEnvFile(envVars);
  }

  // ── Step 7: Deploy rules ───────────────────────────────────────────────────

  printStep(7, 'Deploying Firestore & Storage rules...');

  try {
    run(`firebase deploy --only firestore:rules --project ${projectId}`, { stdio: 'inherit' });
    printSuccess('Firestore rules deployed');
  } catch {
    printWarn('Firestore rules deployment failed — deploy manually: firebase deploy --only firestore:rules');
  }

  try {
    run(`firebase deploy --only storage --project ${projectId}`, { stdio: 'inherit' });
    printSuccess('Storage rules deployed');
  } catch {
    printWarn('Storage rules deployment failed — deploy manually: firebase deploy --only storage');
  }

  // ── Step 8: Install dependencies ───────────────────────────────────────────

  printStep(8, 'Installing dependencies...');

  if (!existsSync(resolve(ROOT, 'node_modules'))) {
    run('npm install', { stdio: 'inherit' });
    printSuccess('Dependencies installed');
  } else {
    printSuccess('Dependencies already installed');
  }

  // ── Done ───────────────────────────────────────────────────────────────────

  console.log('\n\x1b[32m\x1b[1m✅ Setup complete!\x1b[0m\n');
  console.log('  Start the dev server:');
  console.log('    \x1b[36mnpm run dev\x1b[0m\n');
  console.log(`  Open: \x1b[36mhttp://localhost:3000\x1b[0m\n`);

  if (!envVars.FIREBASE_CLIENT_EMAIL || !envVars.FIREBASE_PRIVATE_KEY) {
    console.log('  \x1b[33m⚠ Remember to add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY');
    console.log('    to .env.local for admin password verification to work.\x1b[0m\n');
  }

  rl.close();
}

function writeEnvFile(vars) {
  const lines = [
    '# Firebase client SDK',
    `NEXT_PUBLIC_FIREBASE_API_KEY=${vars.NEXT_PUBLIC_FIREBASE_API_KEY || ''}`,
    `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${vars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}`,
    `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${vars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}`,
    `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${vars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}`,
    `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${vars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}`,
    `NEXT_PUBLIC_FIREBASE_APP_ID=${vars.NEXT_PUBLIC_FIREBASE_APP_ID || ''}`,
    '',
    '# Firebase Admin SDK (for admin password verification)',
    `FIREBASE_CLIENT_EMAIL=${vars.FIREBASE_CLIENT_EMAIL || ''}`,
    `FIREBASE_PRIVATE_KEY=${vars.FIREBASE_PRIVATE_KEY || ''}`,
  ];
  writeFileSync(ENV_PATH, lines.join('\n') + '\n');
  printSuccess(`.env.local written`);
}

main().catch((e) => {
  console.error('\n  ✖ Setup failed:', e.message);
  process.exit(1);
});
