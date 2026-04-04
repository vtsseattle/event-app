/**
 * Event App — Load Test Script
 * Simulates N concurrent viewers sending reactions and shoutouts.
 * Uses Firebase Admin SDK (bypasses security rules) for realistic multi-viewer simulation.
 *
 * Setup:
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Click "Generate new private key" → downloads a JSON file
 *   3. Save it as scripts/service-account.json (gitignored)
 *
 * Usage:
 *   node scripts/load-test.mjs              # 200 viewers (default)
 *   node scripts/load-test.mjs 50           # 50 viewers
 *   node scripts/load-test.mjs 200 60       # 200 viewers for 60 seconds
 */

import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Firebase Admin SDK (CommonJS module)
const admin = require('firebase-admin');

// --- Load service account ---
const SA_PATH = 'scripts/service-account.json';
if (!existsSync(SA_PATH)) {
  console.error(`\n❌ Missing ${SA_PATH}`);
  console.error('\nSetup:');
  console.error('  1. Go to Firebase Console → Project Settings → Service Accounts');
  console.error('  2. Click "Generate new private key"');
  console.error(`  3. Save the downloaded JSON as ${SA_PATH}\n`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const EVENT_ID = 'my-event';
const VIEWER_COUNT = parseInt(process.argv[2] || '200', 10);
const DURATION_SEC = parseInt(process.argv[3] || '45', 10);
const EMOJIS = ['👏', '❤️', '🔥', '🎉', '🪷', '🙏'];
const NAMES = [
  'Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Meera', 'Arjun', 'Kavya',
  'Sanjay', 'Divya', 'Raj', 'Lakshmi', 'Kiran', 'Neha', 'Amit', 'Pooja',
  'Ravi', 'Sunita', 'Deepak', 'Anjali', 'Mohan', 'Sneha', 'Arun', 'Swati',
  'Nikhil', 'Rashmi', 'Suresh', 'Geeta', 'Manish', 'Ritika',
];
const SHOUTOUT_MESSAGES = [
  'Amazing performance! 🎶',
  'This event is incredible!',    
  'So proud of our community!',
  'What a beautiful evening ✨',
  'Love the energy in this room!',
  'Thank you volunteers!',
  'Best gala ever! 🎉',
  'The dancers were phenomenal!',
  'Proud to support this cause 💛',
  'Jai Ho! 🙏',
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomName() {
  return `${randomItem(NAMES)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}.`;
}

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

// --- Stats ---
const stats = { joined: 0, reactions: 0, shoutouts: 0, errors: 0 };

function printStats() {
  process.stdout.write(
    `\r👥 ${stats.joined}/${VIEWER_COUNT} joined | 🎉 ${stats.reactions} reactions | 💬 ${stats.shoutouts} shoutouts | ❌ ${stats.errors} errors   `
  );
}

// --- Main ---
async function main() {
  console.log(`\n🚀 Event Load Test — ${VIEWER_COUNT} viewers for ${DURATION_SEC}s\n`);
  console.log(`Firebase project: ${serviceAccount.project_id}`);
  console.log(`Event: ${EVENT_ID}\n`);

  const eventRef = db.collection('events').doc(EVENT_ID);

  // Create viewer docs (staggered joins)
  const viewers = [];
  const joinWindow = Math.min(10000, VIEWER_COUNT * 50);
  console.log(`Joining ${VIEWER_COUNT} viewers over ${(joinWindow / 1000).toFixed(0)}s...\n`);

  const joinPromises = [];
  for (let i = 0; i < VIEWER_COUNT; i++) {
    const delay = (i / VIEWER_COUNT) * joinWindow;
    joinPromises.push(
      new Promise((resolve) => {
        setTimeout(async () => {
          const viewerId = `loadtest-${i}-${Date.now()}`;
          const name = randomName();
          try {
            await eventRef.collection('viewers').doc(viewerId).set({
              displayName: name,
              initials: initials(name),
              joinedAt: admin.firestore.FieldValue.serverTimestamp(),
              lastActive: admin.firestore.FieldValue.serverTimestamp(),
              isOnline: true,
            });
            viewers.push({ uid: viewerId, name });
            stats.joined++;
            printStats();
          } catch {
            stats.errors++;
            printStats();
          }
          resolve();
        }, delay);
      })
    );
  }

  await Promise.all(joinPromises);
  console.log(`\n\n✅ ${stats.joined} viewers joined. Sending activity for ${DURATION_SEC}s...\n`);

  // Send reactions and shoutouts from random viewers
  const intervals = [];

  // Reactions: ~25-50 per second across all viewers
  for (let i = 0; i < 20; i++) {
    intervals.push(
      setInterval(async () => {
        if (viewers.length === 0) return;
        const viewer = randomItem(viewers);
        try {
          await eventRef.collection('reactions').add({
            emoji: randomItem(EMOJIS),
            viewerId: viewer.uid,
            programId: 'load-test',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          stats.reactions++;
          printStats();
        } catch {
          stats.errors++;
        }
      }, 400 + Math.random() * 800)
    );
  }

  // Shoutouts: ~1-2 per second
  intervals.push(
    setInterval(async () => {
      if (viewers.length === 0) return;
      const viewer = randomItem(viewers);
      try {
        await eventRef.collection('shoutouts').add({
          text: randomItem(SHOUTOUT_MESSAGES),
          viewerId: viewer.uid,
          displayName: viewer.name,
          upvotes: 0,
          upvotedBy: [],
          status: 'visible',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        stats.shoutouts++;
        printStats();
      } catch {
        stats.errors++;
      }
    }, 500 + Math.random() * 1000)
  );

  // Run for the specified duration
  await new Promise((resolve) => setTimeout(resolve, DURATION_SEC * 1000));

  // Cleanup
  console.log('\n\n🛑 Stopping...');
  intervals.forEach((id) => clearInterval(id));

  // Mark all viewers offline
  console.log('Marking viewers offline...');
  const batch = db.batch();
  for (const v of viewers) {
    batch.update(eventRef.collection('viewers').doc(v.uid), { isOnline: false });
    // Firestore batch limit is 500
    if (viewers.indexOf(v) % 499 === 498) {
      await batch.commit();
    }
  }
  await batch.commit();

  console.log('\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Final Stats:');
  console.log(`   👥 Viewers joined:  ${stats.joined}`);
  console.log(`   🎉 Reactions sent:  ${stats.reactions}`);
  console.log(`   💬 Shoutouts sent:  ${stats.shoutouts}`);
  console.log(`   ❌ Errors:          ${stats.errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n💡 Use the admin Reset Data page to clean up test data.');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
