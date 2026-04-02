import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { Relay } from 'nostr-tools/relay';

const TEST_TAG = "firstTest";
const NUM_ACCOUNTS = 5;
const NUM_INTERACTIONS = 5;
const RELAYS = [
  "wss://relay.damus.io",
  "wss://nfrelay.app",
  "wss://relay.snort.social",
  "wss://nos.lol"
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ROOMS = [
  { id: 'general', category: 'social-lifestyle', tags: ['general'] },
  { id: 'nostr', category: 'nostr-builders', tags: ['nostr'] },
  { id: 'bitcoin', category: 'bitcoin-layer', tags: ['bitcoin'] },
  { id: 'food-dining', category: 'social-lifestyle', tags: ['food'] }
];

async function runSimulation() {
  console.log("🚀 Starting FINAL Panstr Verification Run...");

  const accounts = Array.from({ length: NUM_ACCOUNTS }, (v, i) => {
    const sk = generateSecretKey();
    const pk = getPublicKey(sk);
    return { sk, pk, name: `PanstrChecker_${i+1}` };
  });

  const connectedRelays = [];
  for (const url of RELAYS) {
    try {
      const relay = await Relay.connect(url);
      connectedRelays.push(relay);
      console.log(`📡 Connected to ${url}`);
    } catch (e) {}
  }

  if (connectedRelays.length === 0) {
    console.error("Critical: No relays.");
    process.exit(1);
  }

  console.log("\n📝 Publishing 5 verified threads to 'general'...");
  
  for (let i = 0; i < NUM_INTERACTIONS; i++) {
    const acc = accounts[i % NUM_ACCOUNTS];
    const room = ROOMS[0]; // Strict focus on 'general'
    const now = Math.floor(Date.now() / 1000);
    const threadId = `verif-${Date.now()}`;

    const event = {
      kind: 30023,
      created_at: now,
      content: `### Panstr Verification Thread\n\nThis post is strictly tagged for the **${room.id}** room.\n\nVisible ID: ${TEST_TAG}\n\nTime: ${new Date().toISOString()}`,
      tags: [
        ["d", threadId],
        ["title", `VERIFIED: General Thread #${i + 1}`],
        ["published_at", String(now)],
        ["room", room.id],
        ["category", room.category],
        ["t", room.id],
        ["t", TEST_TAG],
        ["t", "forum"]
      ],
    };

    const signed = finalizeEvent(event, acc.sk);
    let ok = 0;
    for (const r of connectedRelays) {
      try {
        await r.publish(signed);
        ok++;
      } catch (e) {}
    }

    console.log(`   ✅ [${i+1}/5] ID: ${signed.id.substring(0, 8)} sent to ${ok} relays.`);
    if (i < NUM_INTERACTIONS - 1) await sleep(4000);
  }

  console.log("\n🏁 Done. Please check the 'General' room now.");
  for (const r of connectedRelays) r.close();
  process.exit(0);
}

runSimulation();
