const { generateSecretKey, getPublicKey, finalizeEvent } = require('nostr-tools/pure');
const { Relay } = require('nostr-tools/relay');

// Configuration
const TEST_TAG = "firstTest";
const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band'
];
const ROOMS = ['nostr', 'dev', 'webboard', 'crypto', 'gaming'];
const NUM_ACCOUNTS = 5;
const NUM_INTERACTIONS = 10;

// Helper for delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runSimulation() {
  console.log("🚀 Starting Panstr Nostr Simulation...");

  // 1. Generate 5 unique accounts
  const accounts = Array.from({ length: NUM_ACCOUNTS }, () => {
    const sk = generateSecretKey();
    const pk = getPublicKey(sk);
    return { sk, pk };
  });

  console.log(`✅ Generated ${NUM_ACCOUNTS} test accounts.`);
  accounts.forEach((acc, i) => console.log(`   Account ${i + 1}: ${acc.pk.substring(0, 8)}...`));

  // Connect to relays
  const connectedRelays = [];
  for (const url of RELAYS) {
    try {
      const relay = await Relay.connect(url);
      connectedRelays.push(relay);
      console.log(`📡 Connected to ${url}`);
    } catch (e) {
      console.error(`❌ Failed to connect to ${url}`);
    }
  }

  if (connectedRelays.length === 0) {
    console.error("Critical: No relays available. Exiting.");
    process.exit(1);
  }

  // Tracking threads to reply to
  const threads = {}; // { room: { rootEventId: lastReplyId } }

  // 2. Interaction Loop
  for (let i = 0; i < NUM_INTERACTIONS; i++) {
    const accountIndex = i % NUM_ACCOUNTS;
    const account = accounts[accountIndex];
    const room = ROOMS[i % ROOMS.length];
    
    let event;
    let isReply = false;

    // Decide if we create a new thread or reply to an existing one in this room
    if (!threads[room] || Math.random() > 0.7) {
      // Create a Root Thread (Kind 1)
      const content = `[Root Thread] Hello ${room} community! Topic: #${i + 1} from account ${accountIndex + 1}`;
      event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["t", TEST_TAG],
          ["t", room],
          ["p", account.pk]
        ],
        content: content,
      };
      console.log(`📝 Creating new thread in #${room}...`);
    } else {
      // Create a Reply (Kind 1 - NIP-10)
      isReply = true;
      const rootId = threads[room].rootId;
      const parentId = threads[room].lastId;
      const content = `Replying to #${room} thread. Interesting point from account ${accountIndex + 1}!`;
      
      event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["t", TEST_TAG],
          ["t", room],
          ["e", rootId, "", "root"],
          ["e", parentId, "", "reply"],
          ["p", account.pk]
        ],
        content: content,
      };
      console.log(`💬 Replying to thread ${rootId.substring(0, 8)} in #${room}...`);
    }

    // Sign Event
    const signedEvent = finalizeEvent(event, account.sk);

    // Broadcast
    for (const relay of connectedRelays) {
      try {
        await relay.publish(signedEvent);
      } catch (e) {
        console.error(`Failed to publish to ${relay.url}`);
      }
    }

    // Track for next replies
    if (!isReply) {
      threads[room] = { rootId: signedEvent.id, lastId: signedEvent.id };
    } else {
      threads[room].lastId = signedEvent.id;
    }

    console.log(`   ✅ Sent: [ID: ${signedEvent.id.substring(0, 8)}] [Pub: ${account.pk.substring(0, 8)}]`);
    console.log(`   Content: "${signedEvent.content}"`);

    // Randomized delay 5-10s
    if (i < NUM_INTERACTIONS - 1) {
      const waitTime = Math.floor(Math.random() * 5000) + 5000;
      console.log(`⏳ Waiting ${waitTime/1000}s...\n`);
      await sleep(waitTime);
    }
  }

  console.log("\n🏁 Simulation complete. All events broadcasted successfully!");
  process.exit(0);
}

runSimulation().catch(err => {
  console.error(err);
  process.exit(1);
});
