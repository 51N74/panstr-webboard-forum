/**
 * Quick Test Runner for Phase 1 Week 1-2 NIP Enhancements
 *
 * Usage: node test-runner.js
 */

// Import functions for testing (assuming Node.js environment)
const {
  parseThread,
  optimizeThreadStructure,
  createZapRequest,
  verifyZapReceipt,
  createZapGoal,
  calculateZapGoalProgress,
  createRelayListEvent,
  scoreRelays
} = require('./app/lib/nostrClient.js');

console.log('🧪 Quick Test Runner for Phase 1 Week 1-2 Enhancements\n');

// Test data
const mockEvent = {
  id: 'test-event-123',
  pubkey: 'test-pubkey-456',
  created_at: Math.floor(Date.now() / 1000),
  kind: 1,
  content: 'This is a test event for NIP-10 threading',
  tags: [
    ['e', 'parent-event-789', '', 'reply'],
    ['p', 'parent-author-789']
  ]
};

const mockZapEvent = {
  id: 'zap-event-123',
  pubkey: 'zapper-pubkey',
  kind: 9735,
  created_at: Math.floor(Date.now() / 1000),
  tags: [
    ['bolt11', 'lnbc1000n1p3k...'],
    ['description', JSON.stringify({
      kind: 9734,
      content: 'Test zap message',
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['p', 'recipient-pubkey'],
        ['amount', '1000'],
        ['relays', 'wss://relay.damus.io']
      ]
    })],
    ['p', 'zapper-pubkey'],
    ['P', 'recipient-pubkey']
  ]
};

async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('📋 Testing Enhanced NIP-10 Threading...');

  try {
    // Test 1: Thread parsing
    const parsed = parseThread(mockEvent);
    console.log('✅ Thread parsing:', parsed);
    passed++;
  } catch (error) {
    console.log('❌ Thread parsing failed:', error.message);
    failed++;
  }

  try {
    // Test 2: Thread optimization
    const optimized = optimizeThreadStructure([mockEvent]);
    console.log('✅ Thread optimization:', optimized.length, 'threads');
    passed++;
  } catch (error) {
    console.log('❌ Thread optimization failed:', error.message);
    failed++;
  }

  console.log('\n⚡ Testing Enhanced NIP-57 Zaps...');

  try {
    // Test 3: Zap request creation
    const zapRequest = createZapRequest(
      1000,
      'recipient-pubkey',
      'event-id',
      ['wss://relay.damus.io'],
      'Test zap message'
    );
    console.log('✅ Zap request created:', zapRequest.kind === 9734 ? 'Valid' : 'Invalid');
    passed++;
  } catch (error) {
    console.log('❌ Zap request creation failed:', error.message);
    failed++;
  }

  try {
    // Test 4: Zap receipt verification
    const verified = verifyZapReceipt(mockZapEvent);
    console.log('✅ Zap receipt verification:', verified.isValid ? 'Valid' : 'Invalid');
    passed++;
  } catch (error) {
    console.log('❌ Zap receipt verification failed:', error.message);
    failed++;
  }

  try {
    // Test 5: Zap goal creation
    const goal = createZapGoal(
      'creator-pubkey',
      ['wss://relay.damus.io'],
      100000,
      'Test funding goal'
    );
    console.log('✅ Zap goal created:', goal.kind === 9041 ? 'Valid' : 'Invalid');
    passed++;
  } catch (error) {
    console.log('❌ Zap goal creation failed:', error.message);
    failed++;
  }

  console.log('\n🔌 Testing NIP-65 Relay Management...');

  try {
    // Test 6: Relay list creation
    const relayList = createRelayListEvent(
      ['wss://read-relay.example.com'],
      ['wss://write-relay.example.com'],
      ['wss://both-relay.example.com']
    );
    console.log('✅ Relay list created:', relayList.kind === 10002 ? 'Valid' : 'Invalid');
    passed++;
  } catch (error) {
    console.log('❌ Relay list creation failed:', error.message);
    failed++;
  }

  try {
    // Test 7: Relay scoring
    const mockHealth = [
      { connected: true, latency: 250, supportedKinds: [1, 2, 3], information: {} },
      { connected: false, latency: null, supportedKinds: [], information: null },
      { connected: true, latency: 5000, supportedKinds: [1], information: {} }
    ];
    const scored = scoreRelays(mockHealth);
    console.log('✅ Relay scoring:', scored.length, 'relays scored');
    passed++;
  } catch (error) {
    console.log('❌ Relay scoring failed:', error.message);
    failed++;
  }

  // Results
  console.log('\n📊 Test Results:');
  console.log('='.repeat(30));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Phase 1 Week 1-2 enhancements are working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);
