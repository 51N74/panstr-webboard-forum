/**
 * PANSTR FORUM - MULTI-ROOM QA TEST SUITE
 * 
 * Simulates real user interactions across all rooms using Nostr Protocol
 * 
 * Features:
 * - Generate 3 fake accounts with unique personas
 * - Create threads in all 13 rooms
 * - Simulate cross-interactions and replies
 * - Verify Nostr event signatures and metadata
 * - Comprehensive test reporting
 * 
 * Usage: node test/multi-room-qa-test.js
 */

const {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  verifyEvent,
  getEventHash,
} = require('nostr-tools/pure');
const { SimplePool } = require('nostr-tools/pool');
const nip19 = require('nostr-tools/nip19');
const fs = require('fs');
const path = require('path');

// Utility functions (from nostr-tools/pure to avoid import issues)
function bytesToHex(bytes) {
  if (!bytes || !(bytes instanceof Uint8Array)) {
    throw new Error('Uint8Array expected');
  }
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex) {
  if (typeof hex !== 'string') {
    throw new Error('Hex string expected');
  }
  return new Uint8Array(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}

// Import room configuration
const { getAllRooms, getRoomTags } = require('../app/data/boardsConfig');

// Test Configuration
const TEST_CONFIG = {
  relays: [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.nostr.band',
    'wss://fenrir-s.notoshi.win',
    'wss://relay.siamdev.cc',
  ],
  publishTimeout: 15000,
  subscriptionTimeout: 10000,
  testRunId: `qa-test-${Date.now()}`,
};

// Fake Account Personas
const PERSONAS = [
  {
    id: 'tester-001',
    name: 'NostrNinja_TH',
    bio: '🥷 Nostr enthusiast | Bitcoin maximalist | Building the decentralized future in Thailand | ⚡ Lightning Network advocate',
    picture: 'https://i.pravatar.cc/150?img=11',
    nip05: 'ninja@nostr.com',
    displayName: 'Nostr Ninja',
    roomPreferences: ['nostr-cafe', 'bitcoin-talk', 'developers-den'],
  },
  {
    id: 'tester-002',
    name: 'CryptoTraveler',
    bio: '✈️ Digital nomad exploring Thailand | 🍜 Food lover | 📡 Running a Nostr relay | Decentralization advocate',
    picture: 'https://i.pravatar.cc/150?img=5',
    nip05: 'traveler@damus.io',
    displayName: 'Crypto Traveler',
    roomPreferences: ['travel-diaries', 'foodie-thailand', 'relay-station'],
  },
  {
    id: 'tester-003',
    name: 'PrivacyWarrior',
    bio: '🔒 Privacy is a human right | 🛡️ Security researcher | 🌐 Decentralized identity | Fighting censorship',
    picture: 'https://i.pravatar.cc/150?img=8',
    nip05: 'warrior@primal.net',
    displayName: 'Privacy Warrior',
    roomPreferences: ['freedom-of-speech', 'decentralized-life', 'zap-zone'],
  },
];

// Test content templates for each room
const CONTENT_TEMPLATES = {
  'foodie-thailand': {
    titles: [
      'Best street food spots in Bangkok?',
      'Hidden gem restaurants in Chiang Mai',
      'Authentic Isaan food recommendations',
    ],
    contents: [
      `I've been exploring Bangkok's street food scene and found some amazing spots! 

**Top picks:**
1. Jay Fai - Crab omelette is legendary
2. Thip Samai - Best pad thai in town
3. Krua Apsorn - Royal Thai cuisine

What are your favorite street food stalls? Drop recommendations below! 🍜

#street-food #bangkok-food #thai-food`,
      `Just discovered this incredible restaurant in Chiang Mai's old city. The khao soi is absolutely authentic!

**Restaurant:** Khan Toke Palace
**Must try:** Khao Soi, Sai Oua (Northern sausage)
**Price:** Very reasonable

Anyone been here? What did you order? 🍛

#chiangmai-food #restaurant #review`,
    ],
  },
  'travel-diaries': {
    titles: [
      'Solo travel in Southern Thailand - Safety tips?',
      'Best islands for digital nomads',
      'Backpacking Thailand on a budget',
    ],
    contents: [
      `Planning a solo trip to Krabi and Koh Lanta next month. Any safety tips for solo travelers?

**My itinerary:**
- Bangkok (2 days)
- Krabi (3 days)
- Koh Lanta (4 days)
- Koh Phi Phi (2 days)

Looking for advice on:
- Transportation between islands
- Safe areas to stay
- Must-visit spots

Thanks in advance! ✈️

#solo-travel #thailand-travel #travel-tips`,
    ],
  },
  'chill-chat': {
    titles: [
      'What got you into Nostr?',
      'Daily check-in thread',
      'Random thoughts on decentralization',
    ],
    contents: [
      `Curious to hear everyone's Nostr journey! 

For me, it started with:
1. Frustration with Twitter censorship
2. Discovery of Bitcoin Lightning Network
3. Love for open protocols

Now I'm completely hooked on the decentralized social media vision.

What's your story? 👇

#nostr #decentralization #social-media`,
    ],
  },
  'pet-lovers': {
    titles: [
      'Best vet clinics in Bangkok?',
      'Adopting a dog in Thailand - Process?',
      'Pet-friendly cafes and parks',
    ],
    contents: [
      `Looking for recommendations for a good vet clinic in Bangkok (Sukhumvit area preferred).

My dog has been having some skin issues and I want to find a reliable vet who speaks English.

**Requirements:**
- English-speaking staff
- Modern equipment
- Emergency services available

Please share your experiences! 🐕

#pet-care #dogs #bangkok #vet-advice`,
    ],
  },
  'nostr-cafe': {
    titles: [
      'NIP-86 Relay Management - Discussion',
      'Best Nostr clients for beginners?',
      'Nostr adoption in Thailand',
    ],
    contents: [
      `Let's discuss the new NIP-86 Relay Management API! 

This is a game-changer for:
- Enterprise relay administration
- Multi-tenant support
- Advanced rate limiting
- Compliance and audit logging

Has anyone implemented this yet? Would love to hear about your experience.

#nostr-dev #nips #relays #protocol`,
    ],
  },
  'bitcoin-talk': {
    titles: [
      'Lightning Network adoption in Thailand',
      'Self-custody best practices',
      'Bitcoin mining with solar power',
    ],
    contents: [
      `Exciting to see more Thai businesses accepting Lightning payments!

**Spots I've found:**
- Coffee shops in Bangkok
- Co-working spaces
- Some restaurants in tourist areas

Are you using Lightning in Thailand? Where have you spent sats? ⚡

#bitcoin #lightning-network #bitcoin-thailand #sats`,
    ],
  },
  'crypto-corner': {
    titles: [
      'DeFi yields in 2026 - Still worth it?',
      'Ethereum vs Bitcoin - My take',
      'NFT utility beyond art',
    ],
    contents: [
      `With the current market conditions, let's discuss DeFi yields.

**My strategy:**
- Conservative: Stablecoin lending (5-10%)
- Moderate: LP positions on established pairs
- Aggressive: New protocol farming (high risk)

What's your DeFi approach? Share your yield farming strategies!

#defi #crypto #yield-farming #ethereum`,
    ],
  },
  'tech-hub-thailand': {
    titles: [
      'Thai startup ecosystem in 2026',
      'Tech jobs in Bangkok - Market update',
      'Government digital initiatives',
    ],
    contents: [
      `The Thai tech scene is booming! Let's discuss the latest developments.

**Hot sectors:**
- Fintech and blockchain
- E-commerce platforms
- Travel tech
- AgriTech

Anyone working at a Thai startup? Share your experience!

#thailand-tech #thai-startups #tech-jobs #innovation`,
    ],
  },
  'developers-den': {
    titles: [
      'JavaScript frameworks in 2026',
      'Building with nostr-tools v2',
      'Code review: Best practices',
    ],
    contents: [
      `Let's talk about the current state of JavaScript frameworks.

**My observations:**
- Next.js 14 with App Router is dominant
- React Server Components gaining traction
- Build tools getting faster (Vite, Turbopack)

What's your stack in 2026? Any interesting projects to share?

#javascript #web-dev #programming #react`,
    ],
  },
  'relay-station': {
    titles: [
      'Running a profitable relay in 2026',
      'Database optimization for high-traffic relays',
      'NIP-05 verification setup guide',
    ],
    contents: [
      `For those running paid relays, let's discuss monetization strategies.

**Revenue models:**
- Subscription tiers
- API access fees
- Premium features
- Donations/zaps

**Costs to consider:**
- Server infrastructure
- Database hosting
- Bandwidth
- Maintenance time

What's working for you? 📡

#relay-setup #paid-relays #nostr-infrastructure`,
    ],
  },
  'zap-zone': {
    titles: [
      'Zap split configuration tutorial',
      'Best Lightning wallets for zapping',
      'Lightning address setup guide',
    ],
    contents: [
      `Zap splits are amazing for content creators! Here's how to set them up.

**Step-by-step:**
1. Generate your Lightning address
2. Configure zap split recipients
3. Add to your Nostr profile
4. Start receiving zaps!

**My split:**
- 70% to me
- 20% to my relay
- 10% to Nostr development

How do you split your zaps? ⚡

#zaps #lightning #zap-split #bitcoin-payments`,
    ],
  },
  'freedom-of-speech': {
    titles: [
      'Censorship resistance in practice',
      'Privacy tools for activists',
      'Encryption basics everyone should know',
    ],
    contents: [
      `Censorship resistance isn't just theoretical - it's a necessity.

**Why it matters:**
- Protecting dissent
- Preserving history
- Enabling free discourse
- Preventing deplatforming

**Tools I use:**
- Nostr for social media
- Tor for browsing
- Signal for messaging
- Bitcoin for payments

What's in your censorship resistance toolkit? 🔒

#censorship-resistance #privacy #free-speech #encryption`,
    ],
  },
  'decentralized-life': {
    titles: [
      'Living as a digital nomad with Bitcoin',
      'Self-sovereign identity setup',
      'Off-grid living with tech',
    ],
    contents: [
      `Embracing the decentralized lifestyle has changed everything for me.

**My setup:**
- Income: Bitcoin + remote work
- Identity: Self-sovereign (DIDs)
- Communication: Encrypted, decentralized
- Banking: Self-custody only

**Benefits:**
- Location independence
- Financial sovereignty
- Censorship resistance
- Privacy preservation

Who else is living the decentralized life? Share your journey! 🌐

#self-sovereignty #digital-nomad #decentralized-identity #crypto-living`,
    ],
  },
};

// Reply templates for cross-interactions
const REPLY_TEMPLATES = [
  'Great post! I totally agree with your points. 🙌',
  'Thanks for sharing this! Very insightful.',
  'I had a similar experience. Would love to discuss more.',
  'This is exactly what I was looking for. Bookmarked!',
  'Interesting perspective! Have you considered...?',
  'Adding this to my list. Thanks for the recommendations!',
  'Count me in! Let\'s connect and collaborate.',
  'Well researched! Do you have any sources to share?',
];

class MultiRoomQATest {
  constructor() {
    this.accounts = [];
    this.pool = null;
    this.testResults = [];
    this.createdEvents = [];
    this.interactions = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info', data = null) {
    const timestamp = new Date().toISOString();
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const logEntry = {
      timestamp,
      elapsed: `${elapsed}s`,
      type,
      message,
      data,
    };
    
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪',
      nostr: '⚡',
    }[type] || '•';

    console.log(`[${elapsed}s] ${emoji} [${type.toUpperCase()}] ${message}`);
    if (data) {
      console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
    }
    
    this.testResults.push(logEntry);
  }

  /**
   * Generate fake accounts with Nostr keypairs
   */
  generateAccounts() {
    this.log('Generating fake accounts with Nostr keypairs...', 'test');
    
    PERSONAS.forEach((persona) => {
      const privateKey = generateSecretKey(); // Uint8Array
      const publicKey = getPublicKey(privateKey); // Returns hex string in newer versions
      
      // Convert publicKey to hex if it's Uint8Array
      const publicKeyHex = typeof publicKey === 'string' ? publicKey : bytesToHex(publicKey);
      
      this.accounts.push({
        ...persona,
        privateKey: bytesToHex(privateKey),
        publicKey: publicKeyHex,
        createdAt: Math.floor(Date.now() / 1000),
      });
      
      this.log(
        `Created account: ${persona.name} (${persona.displayName})`,
        'success',
        {
          pubkey: publicKeyHex.slice(0, 16) + '...',
          npub: this.formatNpub(publicKeyHex),
        }
      );
    });

    this.log(`Generated ${this.accounts.length} test accounts`, 'success');
  }

  /**
   * Create profile metadata events (Kind 0)
   */
  async createProfileEvents() {
    this.log('Creating profile metadata events (Kind 0)...', 'nostr');
    
    for (const account of this.accounts) {
      try {
        const profileEvent = finalizeEvent(
          {
            kind: 0,
            created_at: account.createdAt,
            content: JSON.stringify({
              name: account.name,
              display_name: account.displayName,
              about: account.bio,
              picture: account.picture,
              nip05: account.nip05,
              website: 'https://panstr.com',
            }),
            tags: [],
          },
          hexToBytes(account.privateKey)
        );

        // Verify the event
        const isValid = verifyEvent(profileEvent);
        if (!isValid) {
          throw new Error('Profile event signature invalid');
        }

        account.profileEvent = profileEvent;
        this.createdEvents.push({
          type: 'profile',
          account: account.id,
          event: profileEvent,
        });

        this.log(
          `Profile created for ${account.name}`,
          'success',
          {
            event_id: profileEvent.id.slice(0, 16) + '...',
            signature: profileEvent.sig.slice(0, 16) + '...',
          }
        );
      } catch (error) {
        this.log(`Failed to create profile for ${account.name}: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Initialize connection to relay pool
   */
  async initializePool() {
    this.log('Initializing relay pool...', 'nostr');
    
    this.pool = new SimplePool({
      enablePing: true,
      enableReconnect: true,
    });

    // Connect to relays
    const connections = await Promise.all(
      TEST_CONFIG.relays.map(async (relayUrl) => {
        try {
          const relay = await this.pool.ensureRelay(relayUrl, {
            connectionTimeout: 5000,
          });
          return { url: relayUrl, status: 'connected', relay };
        } catch (error) {
          return { url: relayUrl, status: 'failed', error: error.message };
        }
      })
    );

    const connected = connections.filter((c) => c.status === 'connected');
    const failed = connections.filter((c) => c.status === 'failed');

    this.log(
      `Connected to ${connected.length}/${TEST_CONFIG.relays.length} relays`,
      connected.length > 0 ? 'success' : 'error'
    );

    if (failed.length > 0) {
      this.log(
        `Failed to connect: ${failed.map((f) => f.url).join(', ')}`,
        'warning'
      );
    }

    return connected.length > 0;
  }

  /**
   * Publish events to relays
   */
  async publishEvent(event, account) {
    try {
      const publishPromises = this.pool.publish(TEST_CONFIG.relays, event);
      
      const results = await Promise.allSettled(
        publishPromises.map((p) => p.catch((e) => ({ status: 'failed', error: e.message })))
      );

      const success = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected' || r.value?.status === 'failed').length;

      return {
        success: success > 0,
        publishedTo: success,
        failedTo: failed,
        event,
      };
    } catch (error) {
      this.log(`Publish failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Create test threads in all rooms
   */
  async createThreadsInAllRooms() {
    this.log('\n📝 Creating threads in all rooms...', 'test');
    
    const allRooms = getAllRooms();
    this.log(`Found ${allRooms.length} rooms to test`, 'info');

    for (const room of allRooms) {
      const template = CONTENT_TEMPLATES[room.id];
      if (!template) {
        this.log(`No template for room: ${room.id}`, 'warning');
        continue;
      }

      // Select a random account to post
      const account = this.accounts[Math.floor(Math.random() * this.accounts.length)];
      const title = template.titles[Math.floor(Math.random() * template.titles.length)];
      const content = template.contents[Math.floor(Math.random() * template.contents.length)];

      try {
        // Create Kind 30023 event (long-form content)
        const threadEvent = finalizeEvent(
          {
            kind: 30023,
            created_at: Math.floor(Date.now() / 1000),
            content: content,
            tags: [
              ['d', title.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
              ['title', title],
              ['t', room.tags[0]], // Primary tag
              ['t', room.tags[1]], // Secondary tag
              ['room', room.id],
              ['category', room.category],
              ['published_at', Math.floor(Date.now() / 1000).toString()],
            ],
          },
          hexToBytes(account.privateKey)
        );

        // Verify signature
        const isValid = verifyEvent(threadEvent);
        if (!isValid) {
          throw new Error('Thread event signature invalid');
        }

        // Publish to relays
        const publishResult = await this.publishEvent(threadEvent, account);

        if (publishResult.success) {
          this.log(
            `Thread created in ${room.name} by ${account.name}`,
            'success',
            {
              event_id: threadEvent.id.slice(0, 16) + '...',
              title: title.slice(0, 40) + '...',
            }
          );

          this.createdEvents.push({
            type: 'thread',
            room: room.id,
            account: account.id,
            event: threadEvent,
            title,
          });
        } else {
          this.log(
            `Failed to publish thread in ${room.name}`,
            'error',
            publishResult
          );
        }
      } catch (error) {
        this.log(`Error creating thread in ${room.name}: ${error.message}`, 'error');
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    this.log(`Created ${this.createdEvents.filter((e) => e.type === 'thread').length} threads`, 'success');
  }

  /**
   * Simulate cross-interactions between accounts
   */
  async simulateCrossInteractions() {
    this.log('\n💬 Simulating cross-interactions...', 'test');

    const threads = this.createdEvents.filter((e) => e.type === 'thread');
    
    for (const thread of threads) {
      // 50% chance of interaction
      if (Math.random() > 0.5) continue;

      // Select a different account to reply
      const otherAccounts = this.accounts.filter((a) => a.id !== thread.account);
      const replyAccount = otherAccounts[Math.floor(Math.random() * otherAccounts.length)];
      const replyContent = REPLY_TEMPLATES[Math.floor(Math.random() * REPLY_TEMPLATES.length)];

      try {
        // Create Kind 1 reply event
        const replyEvent = finalizeEvent(
          {
            kind: 1,
            created_at: Math.floor(Date.now() / 1000),
            content: replyContent,
            tags: [
              ['e', thread.event.id, '', 'reply'], // NIP-10 reply marker
              ['p', thread.event.pubkey], // Mention original author
              ['room', thread.room],
            ],
          },
          hexToBytes(replyAccount.privateKey)
        );

        // Verify signature
        const isValid = verifyEvent(replyEvent);
        if (!isValid) {
          throw new Error('Reply event signature invalid');
        }

        // Publish
        const publishResult = await this.publishEvent(replyEvent, replyAccount);

        if (publishResult.success) {
          this.log(
            `${replyAccount.name} replied to ${thread.account}'s thread in ${thread.room}`,
            'success',
            {
              event_id: replyEvent.id.slice(0, 16) + '...',
              reply: replyContent.slice(0, 40) + '...',
            }
          );

          this.interactions.push({
            type: 'reply',
            thread,
            replyAccount: replyAccount.id,
            event: replyEvent,
          });

          this.createdEvents.push({
            type: 'reply',
            room: thread.room,
            account: replyAccount.id,
            event: replyEvent,
            parentThread: thread.event.id,
          });
        }
      } catch (error) {
        this.log(`Error creating reply: ${error.message}`, 'error');
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    this.log(`Created ${this.interactions.length} interactions`, 'success');
  }

  /**
   * Create reaction events (Kind 7)
   */
  async createReactions() {
    this.log('\n⚡ Creating reactions (Kind 7)...', 'nostr');

    const threads = this.createdEvents.filter((e) => e.type === 'thread');
    
    for (const thread of threads) {
      // 30% chance of reaction
      if (Math.random() > 0.3) continue;

      const reactor = this.accounts[Math.floor(Math.random() * this.accounts.length)];

      try {
        const reactionEvent = finalizeEvent(
          {
            kind: 7,
            created_at: Math.floor(Date.now() / 1000),
            content: '+', // Like
            tags: [
              ['e', thread.event.id],
              ['p', thread.event.pubkey],
              ['k', '30023'],
            ],
          },
          hexToBytes(reactor.privateKey)
        );

        const isValid = verifyEvent(reactionEvent);
        if (!isValid) {
          throw new Error('Reaction event signature invalid');
        }

        const publishResult = await this.publishEvent(reactionEvent, reactor);

        if (publishResult.success) {
          this.log(
            `${reactor.name} reacted to thread in ${thread.room}`,
            'success',
            { event_id: reactionEvent.id.slice(0, 16) + '...' }
          );

          this.interactions.push({
            type: 'reaction',
            thread,
            reactor: reactor.id,
            event: reactionEvent,
          });
        }
      } catch (error) {
        this.log(`Error creating reaction: ${error.message}`, 'error');
      }
    }

    this.log(`Created ${this.interactions.filter((i) => i.type === 'reaction').length} reactions`, 'success');
  }

  /**
   * Verify all created events
   */
  verifyAllEvents() {
    this.log('\n🔍 Verifying all event signatures...', 'test');

    let validCount = 0;
    let invalidCount = 0;

    for (const eventData of this.createdEvents) {
      const event = eventData.event;
      const isValid = verifyEvent(event);

      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
        this.log(
          `Invalid signature detected!`,
          'error',
          {
            event_id: event.id,
            kind: event.kind,
            account: eventData.account,
          }
        );
      }
    }

    this.log(
      `Signature verification: ${validCount} valid, ${invalidCount} invalid`,
      invalidCount === 0 ? 'success' : 'error'
    );

    return { valid: validCount, invalid: invalidCount, allValid: invalidCount === 0 };
  }

  /**
   * Verify room-specific tags
   */
  verifyRoomTags() {
    this.log('\n🏷️  Verifying room-specific tag compliance...', 'test');

    let compliantCount = 0;
    let nonCompliantCount = 0;

    for (const eventData of this.createdEvents.filter((e) => e.type === 'thread')) {
      const event = eventData.event;
      const room = eventData.room;
      const roomTags = getRoomTags(room);

      const eventTags = event.tags
        .filter((tag) => tag[0] === 't')
        .map((tag) => tag[1]);

      const allValid = eventTags.every((tag) => roomTags.includes(tag));

      if (allValid) {
        compliantCount++;
      } else {
        nonCompliantCount++;
        this.log(
          `Tag compliance issue in ${room}`,
          'warning',
          {
            event_id: event.id.slice(0, 16) + '...',
            tags: eventTags,
            validTags: roomTags,
          }
        );
      }
    }

    this.log(
      `Tag compliance: ${compliantCount} compliant, ${nonCompliantCount} non-compliant`,
      nonCompliantCount === 0 ? 'success' : 'warning'
    );

    return { compliant: compliantCount, nonCompliant: nonCompliantCount };
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    this.log('\n📊 Generating test report...', 'info');

    const report = {
      testRunId: TEST_CONFIG.testRunId,
      timestamp: new Date().toISOString(),
      duration: ((Date.now() - this.startTime) / 1000).toFixed(2) + 's',
      summary: {
        totalAccounts: this.accounts.length,
        totalEvents: this.createdEvents.length,
        totalInteractions: this.interactions.length,
        threadsCreated: this.createdEvents.filter((e) => e.type === 'thread').length,
        repliesCreated: this.createdEvents.filter((e) => e.type === 'reply').length,
        reactionsCreated: this.interactions.filter((i) => i.type === 'reaction').length,
        roomsTested: [...new Set(this.createdEvents.map((e) => e.room))].length,
      },
      accounts: this.accounts.map((a) => ({
        id: a.id,
        name: a.name,
        displayName: a.displayName,
        npub: this.formatNpub(a.publicKey),
        eventsCreated: this.createdEvents.filter((e) => e.account === a.id).length,
      })),
      events: this.createdEvents.map((e) => ({
        type: e.type,
        room: e.room,
        account: e.account,
        eventId: e.event.id,
        kind: e.event.kind,
        timestamp: e.event.created_at,
      })),
      interactions: this.interactions.map((i) => ({
        type: i.type,
        thread: i.thread.event.id,
        account: i.type === 'reply' ? i.replyAccount : i.reactor,
        eventId: i.event.id,
      })),
      verification: {
        signatures: this.verifyAllEvents(),
        tagCompliance: this.verifyRoomTags(),
      },
      logs: this.testResults,
    };

    // Save JSON report
    const reportDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `${TEST_CONFIG.testRunId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Report saved to: ${reportPath}`, 'success');

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(reportDir, `${TEST_CONFIG.testRunId}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    this.log(`HTML report saved to: ${htmlPath}`, 'success');

    return report;
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(report) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panstr QA Test Report - ${report.testRunId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; }
        .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.8; font-size: 1.1em; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 40px; background: #f8f9fa; }
        .stat-card { background: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2.5em; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; margin-top: 8px; font-size: 0.95em; }
        .section { padding: 40px; border-bottom: 1px solid #eee; }
        .section h2 { font-size: 1.8em; margin-bottom: 25px; color: #1a1a2e; }
        .account-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .account-card { background: #f8f9fa; padding: 20px; border-radius: 12px; border-left: 4px solid #667eea; }
        .account-name { font-weight: bold; font-size: 1.2em; }
        .account-npub { font-family: monospace; font-size: 0.85em; color: #666; background: #eee; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 8px; }
        .event-list { max-height: 400px; overflow-y: auto; }
        .event-item { padding: 15px; margin: 10px 0; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #4caf50; }
        .event-item.reply { border-left-color: #2196f3; }
        .event-item.reaction { border-left-color: #ff9800; }
        .event-meta { font-size: 0.85em; color: #666; margin-top: 8px; }
        .verification-box { padding: 20px; background: #e8f5e9; border-radius: 8px; margin: 20px 0; }
        .verification-box.error { background: #ffebee; }
        .log-list { max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 0.85em; background: #1a1a2e; color: #4caf50; padding: 20px; border-radius: 8px; }
        .log-entry { margin: 5px 0; }
        .log-entry.error { color: #f44336; }
        .log-entry.warning { color: #ff9800; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: bold; margin: 5px; }
        .badge-success { background: #4caf50; color: white; }
        .badge-error { background: #f44336; color: white; }
        .badge-warning { background: #ff9800; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌏 Panstr Forum - QA Test Report</h1>
            <p>Multi-Room Interaction Test Suite</p>
            <p style="margin-top: 15px; opacity: 0.6;">Test Run: ${report.testRunId}</p>
            <p>Duration: ${report.duration} | ${new Date(report.timestamp).toLocaleString()}</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${report.summary.totalAccounts}</div>
                <div class="stat-label">Test Accounts</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.threadsCreated}</div>
                <div class="stat-label">Threads Created</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.repliesCreated}</div>
                <div class="stat-label">Replies Posted</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.reactionsCreated}</div>
                <div class="stat-label">Reactions</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.roomsTested}</div>
                <div class="stat-label">Rooms Tested</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.totalEvents}</div>
                <div class="stat-label">Total Events</div>
            </div>
        </div>

        <div class="section">
            <h2>✅ Verification Results</h2>
            <div class="verification-box ${report.verification.signatures.allValid ? '' : 'error'}">
                <h3>Signature Verification</h3>
                <p>Valid: ${report.verification.signatures.valid} | Invalid: ${report.verification.signatures.invalid}</p>
                <span class="badge ${report.verification.signatures.allValid ? 'badge-success' : 'badge-error'}">
                  ${report.verification.signatures.allValid ? 'ALL VALID' : 'ISSUES FOUND'}
                </span>
            </div>
            <div class="verification-box">
                <h3>Tag Compliance</h3>
                <p>Compliant: ${report.verification.tagCompliance.compliant} | Non-compliant: ${report.verification.tagCompliance.nonCompliant}</p>
                <span class="badge ${report.verification.tagCompliance.nonCompliant === 0 ? 'badge-success' : 'badge-warning'}">
                  ${report.verification.tagCompliance.nonCompliant === 0 ? 'FULLY COMPLIANT' : 'REVIEW NEEDED'}
                </span>
            </div>
        </div>

        <div class="section">
            <h2>👥 Test Accounts</h2>
            <div class="account-grid">
                ${report.accounts.map(acc => `
                    <div class="account-card">
                        <div class="account-name">${acc.name}</div>
                        <div style="color: #666; margin-top: 5px;">${acc.displayName}</div>
                        <div class="account-npub">npub1...${acc.npub.slice(-12)}</div>
                        <div style="margin-top: 12px; font-size: 0.9em;">Events: ${acc.eventsCreated}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>⚡ Events Created</h2>
            <div class="event-list">
                ${report.events.slice(0, 50).map(e => `
                    <div class="event-item ${e.type}">
                        <strong>${e.type.toUpperCase()}</strong> - Kind ${e.kind}
                        <div class="event-meta">
                            Room: ${e.room} | Account: ${e.account} | ID: ${e.eventId.slice(0, 16)}...
                        </div>
                    </div>
                `).join('')}
                ${report.events.length > 50 ? `<div style="text-align: center; padding: 20px; color: #666;">... and ${report.events.length - 50} more events</div>` : ''}
            </div>
        </div>

        <div class="section">
            <h2>📋 Test Logs</h2>
            <div class="log-list">
                ${report.logs.slice(-100).map(log => `
                    <div class="log-entry ${log.type === 'error' ? 'error' : log.type === 'warning' ? 'warning' : ''}">
                        [${log.elapsed}] ${log.message}
                    </div>
                `).join('')}
            </div>
        </div>

        <div style="text-align: center; padding: 30px; background: #f8f9fa; color: #666; font-size: 0.9em;">
            Generated by Panstr Multi-Room QA Test Suite
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Format public key as npub
   */
  formatNpub(pubkeyHex) {
    try {
      return nip19.npubEncode(pubkeyHex);
    } catch (error) {
      return `npub1${pubkeyHex.slice(0, 38)}`;
    }
  }

  /**
   * Run complete test suite
   */
  async runTestSuite() {
    console.log('\n' + '='.repeat(70));
    console.log('🌏 PANSTR FORUM - MULTI-ROOM QA TEST SUITE');
    console.log('='.repeat(70) + '\n');

    try {
      // Step 1: Generate accounts
      this.generateAccounts();

      // Step 2: Create profile events
      await this.createProfileEvents();

      // Step 3: Initialize relay pool
      const poolReady = await this.initializePool();
      if (!poolReady) {
        throw new Error('Failed to connect to any relays');
      }

      // Step 4: Create threads in all rooms
      await this.createThreadsInAllRooms();

      // Step 5: Simulate cross-interactions
      await this.simulateCrossInteractions();

      // Step 6: Create reactions
      await this.createReactions();

      // Step 7: Verify all events
      const verification = this.verifyAllEvents();

      // Step 8: Verify tag compliance
      const tagCompliance = this.verifyRoomTags();

      // Step 9: Generate report
      const report = this.generateReport();

      // Final summary
      console.log('\n' + '='.repeat(70));
      console.log('📊 TEST SUMMARY');
      console.log('='.repeat(70));
      console.log(`✅ Test Accounts: ${report.summary.totalAccounts}`);
      console.log(`✅ Threads Created: ${report.summary.threadsCreated}`);
      console.log(`✅ Replies Posted: ${report.summary.repliesCreated}`);
      console.log(`✅ Reactions: ${report.summary.reactionsCreated}`);
      console.log(`✅ Rooms Tested: ${report.summary.roomsTested}/${getAllRooms().length}`);
      console.log(`✅ Signature Verification: ${verification.allValid ? 'PASSED' : 'FAILED'}`);
      console.log(`✅ Tag Compliance: ${tagCompliance.nonCompliant === 0 ? 'PASSED' : 'REVIEW NEEDED'}`);
      console.log(`⏱️  Total Duration: ${report.duration}`);
      console.log('='.repeat(70) + '\n');

      return {
        success: verification.allValid && tagCompliance.nonCompliant === 0,
        report,
      };
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      console.error(error);
      return { success: false, error: error.message };
    } finally {
      // Cleanup - close pool connections safely
      try {
        if (this.pool && typeof this.pool.close === 'function') {
          this.pool.close();
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

// Run the test
async function main() {
  const tester = new MultiRoomQATest();
  const result = await tester.runTestSuite();
  
  process.exit(result.success ? 0 : 1);
}

// Export for module use
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MultiRoomQATest, TEST_CONFIG, PERSONAS };
