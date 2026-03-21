/**
 * SIMPLE DEBUG: Check relay events without complex imports
 */

// Define relays directly since DEFAULT_RELAYS isn't exported
const RELAYS = [
  "wss://relay.damus.io",
  "wss://fenrir-s.notoshi.win",
  "wss://relayrs.notoshi.win",
  "wss://relay.siamdev.cc",
  "wss://nfrelay.app",
  "wss://nos.lol",
  "wss://relay.notoshi.win",
];

console.log('🔍 DEBUGGING RELAY EVENTS');
console.log('='.repeat(50));

async function debugRelays() {
  try {
    // Initialize pool with direct relays
    console.log('\n📡 Initializing pool...');

    // We'll use a simple approach - check if browser extension is available
    if (typeof window !== 'undefined' && window.nostr) {
      console.log('🔌 Browser extension detected');

      // Try to get pubkey
      const pubkey = await window.nostr.getPublicKey();
      console.log(`👤 Pubkey: ${pubkey?.substring(0, 16)}...`);

      // Try to query events through extension
      console.log('\n📋 Querying through browser extension...');
      try {
        const events = await window.nostr.listEvents([
          {
            kinds: [30023],
            "#t": ["forum"],
            limit: 20
          }
        ]);
        console.log(`Found ${events.length} threads through extension:`);

        events.forEach((event, index) => {
          const title = event.tags?.find(t => t[0] === 'title')?.[1] || 'No title';
          const board = event.tags?.find(t => t[0] === 'board')?.[1] || 'No board';
          console.log(`\n${index + 1}. "${title}" (Board: ${board})`);
          console.log(`   ID: ${event.id}`);
        });

        // Look for test threads
        const testThreads = events.filter(event => {
          const title = event.tags?.find(t => t[0] === 'title')?.[1] || '';
          return title.includes('TEST') || title.includes('Full Thread Flow');
        });

        console.log(`\n🎯 Found ${testThreads.length} test threads:`);
        testThreads.forEach((event, index) => {
          const title = event.tags?.find(t => t[0] === 'title')?.[1] || 'No title';
          console.log(`\n${index + 1}. "${title}"`);
          console.log(`   ID: ${event.id}`);
          console.log(`   Tags: ${JSON.stringify(event.tags, null, 2)}`);
        });

      } catch (extError) {
        console.error('❌ Extension query failed:', extError);
      }

    } else {
      console.log('🌐 No browser extension detected');
      console.log('Please ensure you have a Nostr extension installed and connected');
    }

    // Check localStorage for authentication
    console.log('\n🔐 Checking authentication status...');
    if (typeof localStorage !== 'undefined') {
      const privateKey = localStorage.getItem('nostr_private_key');
      if (privateKey) {
        console.log('✅ Private key found in localStorage');
        console.log(`Key length: ${privateKey.length} characters`);
      } else {
        console.log('❌ No private key found in localStorage');
        console.log('You need to connect your Nostr account first');
      }

      // Check for encrypted keys
      let encryptedKeys = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('encrypted_key_')) {
          encryptedKeys++;
        }
      }
      console.log(`🔒 Found ${encryptedKeys} encrypted keys in storage`);
    }

    console.log('\n💡 MANUAL DEBUGGING STEPS:');
    console.log('1. Open browser console (F12) on the forum page');
    console.log('2. Go to: http://localhost:3000/room/nostr-cafe');
    console.log('3. Check Network tab for XHR requests');
    console.log('4. Look for WebSocket connections to relays');
    console.log('5. Try creating a simple test thread');
    console.log('6. Check console for any errors');
    console.log('7. After publishing, wait 30 seconds and refresh');

    console.log('\n🧪 COMMON ISSUES:');
    console.log('• Nostr extension not connected');
    console.log('• Private key not in localStorage');
    console.log('• WebSocket connection failures');
    console.log('• Event not accepted by relays');
    console.log('• UI filtering not working correctly');
    console.log('• Relay propagation delays');

    return {
      extensionDetected: typeof window !== 'undefined' && !!window.nostr,
      hasPrivateKey: typeof localStorage !== 'undefined' && !!localStorage.getItem('nostr_private_key'),
      encryptedKeysCount: typeof localStorage !== 'undefined' ?
        Array.from({length: localStorage.length}, (_, i) => {
          const key = localStorage.key(i);
          return key && key.startsWith('encrypted_key_') ? 1 : 0;
        }).reduce((a, b) => a + b, 0) : 0
    };

  } catch (error) {
    console.error('❌ Debug script failed:', error);
    return { error: error.message };
  }
}

// Simple test in browser
if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser environment');
  debugRelays();
} else {
  console.log('🖥️ Running in Node.js environment');
  console.log('This script is designed for browser debugging');
  console.log('Open http://localhost:3000 and run this in browser console');
}
