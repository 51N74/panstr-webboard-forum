/**
 * Test utilities for Phase 1 Week 1-2 NIP Enhancements
 *
 * Run these tests in the browser console or Node.js environment
 */

// Import functions (adjust paths as needed for your environment)
// import {
//   parseThread,
//   optimizeThreadStructure,
//   createZapRequest,
//   verifyZapReceipt,
//   createZapGoal,
//   calculateZapGoalProgress,
//   getRelayList,
//   testRelayHealth,
//   getOptimalRelays
// } from '../lib/nostrClient';

const TestSuite = {
  /**
   * Test Enhanced NIP-10 Threading
   */
  async testNIP10Threading() {
    console.log('🧪 Testing Enhanced NIP-10 Threading...');

    // Mock events with proper NIP-10 markers
    const mockEvents = [
      {
        id: 'root-event',
        pubkey: 'root-pubkey',
        created_at: Math.floor(Date.now() / 1000) - 3600,
        kind: 1,
        content: 'This is a root post',
        tags: []
      },
      {
        id: 'reply-event',
        pubkey: 'reply-pubkey',
        created_at: Math.floor(Date.now() / 1000) - 1800,
        kind: 1,
        content: 'This is a reply',
        tags: [
          ['e', 'root-event', '', 'reply'],
          ['p', 'root-pubkey']
        ]
      },
      {
        id: 'nested-reply',
        pubkey: 'nested-pubkey',
        created_at: Math.floor(Date.now() / 1000) - 900,
        kind: 1,
        content: 'This is a nested reply',
        tags: [
          ['e', 'root-event', '', 'root'],
          ['e', 'reply-event', '', 'reply'],
          ['p', 'root-pubkey'],
          ['p', 'reply-pubkey']
        ]
      },
      {
        id: 'mention-event',
        pubkey: 'mention-pubkey',
        created_at: Math.floor(Date.now() / 1000) - 600,
        kind: 1,
        content: 'This mentions other events',
        tags: [
          ['e', 'root-event', '', 'mention'],
          ['e', 'reply-event', '', 'mention'],
          ['p', 'root-pubkey']
        ]
      }
    ];

    const results = {
      passed: 0,
      failed: 0,
      tests: []
    };

    try {
      // Test 1: Basic thread parsing
      const rootParsed = parseThread(mockEvents[0]);
      results.tests.push({
        name: 'Root event parsing',
        passed: rootParsed.root === null && rootParsed.reply === null,
        expected: 'No root or reply for root event',
        actual: `Root: ${rootParsed.root}, Reply: ${rootParsed.reply}`
      });

      // Test 2: Reply parsing
      const replyParsed = parseThread(mockEvents[1]);
      results.tests.push({
        name: 'Reply event parsing',
        passed: replyParsed.root === null && replyParsed.reply === 'root-event',
        expected: 'Reply points to root event',
        actual: `Reply: ${replyParsed.reply}`
      });

      // Test 3: Thread depth calculation
      const nestedParsed = parseThread(mockEvents[2]);
      results.tests.push({
        name: 'Thread depth calculation',
        passed: nestedParsed.depth >= 1,
        expected: 'Nested reply should have depth >= 1',
        actual: `Depth: ${nestedParsed.depth}`
      });

      // Test 4: Mention parsing
      const mentionParsed = parseThread(mockEvents[3]);
      results.tests.push({
        name: 'Mention parsing',
        passed: mentionParsed.mentions.length >= 2,
        expected: 'Should parse multiple mentions',
        actual: `Mentions: ${mentionParsed.mentions.length}`
      });

      // Test 5: Thread optimization
      const optimized = optimizeThreadStructure(mockEvents);
      results.tests.push({
        name: 'Thread structure optimization',
        passed: optimized.length >= 1,
        expected: 'Should create optimized thread structure',
        actual: `Optimized threads: ${optimized.length}`
      });

      // Calculate results
      results.passed = results.tests.filter(t => t.passed).length;
      results.failed = results.tests.filter(t => !t.passed).length;

      console.log('✅ NIP-10 Threading Test Results:');
      console.table(results.tests);

    } catch (error) {
      console.error('❌ NIP-10 Threading Test Error:', error);
      results.failed++;
    }

    return results;
  },

  /**
   * Test Enhanced NIP-57 Zaps
   */
  async testNIP57Zaps() {
    console.log('⚡ Testing Enhanced NIP-57 Zaps...');

    const results = {
      passed: 0,
      failed: 0,
      tests: []
    };

    try {
      // Test 1: Basic zap request creation
      const basicZap = createZapRequest(
        1000, // amount in sats
        'recipient-pubkey',
        'event-id',
        ['wss://relay.damus.io'],
        'Test zap message'
      );

      results.tests.push({
        name: 'Basic zap request creation',
        passed: basicZap.kind === 9734 && basicZap.tags.find(t => t[0] === 'p'),
        expected: 'Should create valid zap request',
        actual: `Kind: ${basicZap.kind}, Tags: ${basicZap.tags.length}`
      });

      // Test 2: Zap request with splits
      const splitZap = createZapRequest(
        1000,
        'recipient-pubkey',
        'event-id',
        ['wss://relay.damus.io'],
        'Split zap test',
        {
          splits: [
            { pubkey: 'split-pubkey-1', percentage: 30 },
            { pubkey: 'split-pubkey-2', percentage: 70 }
          ]
        }
      );

      const splitTags = splitZap.tags.filter(t => t[0] === 'zap_split');
      results.tests.push({
        name: 'Zap with splits',
        passed: splitTags.length === 2,
        expected: 'Should create zap with 2 splits',
        actual: `Split tags: ${splitTags.length}`
      });

      // Test 3: Zap goal creation
      const goal = createZapGoal(
        'creator-pubkey',
        ['wss://relay.damus.io'],
        100000, // 1 BTC in sats
        'Funding goal for project',
        { image: 'https://example.com/image.jpg' }
      );

      results.tests.push({
        name: 'Zap goal creation',
        passed: goal.kind === 9041 && goal.tags.find(t => t[0] === 'amount'),
        expected: 'Should create valid zap goal',
        actual: `Kind: ${goal.kind}, Amount tag present: ${!!goal.tags.find(t => t[0] === 'amount')}`
      });

      // Test 4: Zap goal progress calculation
      const mockGoal = {
        id: 'goal-id',
        tags: [
          ['p', 'creator-pubkey'],
          ['amount', '100000'],
          ['d', 'goal-identifier']
        ]
      };

      const mockZaps = [
        {
          tags: [
            ['bolt11', 'bolt11-invoice-1'],
            ['description', JSON.stringify({
              kind: 9734,
              tags: [['p', 'creator-pubkey'], ['e', 'goal-id']],
              content: 'First zap'
            })]
          ]
        },
        {
          tags: [
            ['bolt11', 'bolt11-invoice-2'],
            ['description', JSON.stringify({
              kind: 9734,
              tags: [['p', 'creator-pubkey'], ['e', 'goal-id']],
              content: 'Second zap'
            })]
          ]
        }
      ];

      const progress = calculateZapGoalProgress(mockGoal, mockZaps);
      results.tests.push({
        name: 'Zap goal progress calculation',
        passed: progress.zapperCount >= 1,
        expected: 'Should calculate progress from zaps',
        actual: `Zappers: ${progress.zapperCount}, Percentage: ${progress.percentage}%`
      });

      // Calculate results
      results.passed = results.tests.filter(t => t.passed).length;
      results.failed = results.tests.filter(t => !t.passed).length;

      console.log('✅ NIP-57 Zaps Test Results:');
      console.table(results.tests);

    } catch (error) {
      console.error('❌ NIP-57 Zaps Test Error:', error);
      results.failed++;
    }

    return results;
  },

  /**
   * Test NIP-65 Relay Management
   */
  async testNIP65RelayManagement() {
    console.log('🔌 Testing NIP-65 Relay Management...');

    const results = {
      passed: 0,
      failed: 0,
      tests: []
    };

    try {
      // Test 1: Relay list event creation
      const relayListEvent = createRelayListEvent(
        ['wss://relay1.example.com'],
        ['wss://relay2.example.com'],
        ['wss://relay3.example.com']
      );

      const readTags = relayListEvent.tags.filter(t => t[0] === 'r' && t[2] === 'read');
      const writeTags = relayListEvent.tags.filter(t => t[0] === 'r' && t[2] === 'write');
      const bothTags = relayListEvent.tags.filter(t => t[0] === 'r' && t[2] === 'both');

      results.tests.push({
        name: 'Relay list event creation',
        passed: relayListEvent.kind === 10002 && readTags.length === 1,
        expected: 'Should create NIP-65 relay list (kind:10002)',
        actual: `Kind: ${relayListEvent.kind}, Read tags: ${readTags.length}`
      });

      // Test 2: Relay health testing (mock)
      const mockHealthResult = {
        url: 'wss://relay.example.com',
        connected: true,
        latency: 250,
        error: null,
        supportedKinds: [1, 2, 3, 9734, 9735],
        information: { name: 'Test Relay', supported_nips: [1, 57] }
      };

      const scored = scoreRelays([mockHealthResult]);
      results.tests.push({
        name: 'Relay health scoring',
        passed: scored[0].score > 0 && scored[0].score <= 100,
        expected: 'Should score relay health between 0-100',
        actual: `Score: ${scored[0].score}/100`
      });

      // Test 3: Optimal relay selection (mock)
      const mockOptimal = await getOptimalRelays(
        'test-pubkey',
        'read',
        3
      );

      results.tests.push({
        name: 'Optimal relay selection',
        passed: Array.isArray(mockOptimal) && mockOptimal.length <= 3,
        expected: 'Should return optimal relays array',
        actual: `Relays returned: ${mockOptimal.length}`
      });

      // Calculate results
      results.passed = results.tests.filter(t => t.passed).length;
      results.failed = results.tests.filter(t => !t.passed).length;

      console.log('✅ NIP-65 Relay Management Test Results:');
      console.table(results.tests);

    } catch (error) {
      console.error('❌ NIP-65 Relay Management Test Error:', error);
      results.failed++;
    }

    return results;
  },

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Running Phase 1 Week 1-2 Enhancement Tests...\n');

    const startTime = Date.now();
    const results = {
      threading: null,
      zaps: null,
      relay: null,
      summary: { totalPassed: 0, totalFailed: 0, totalTime: 0 }
    };

    try {
      // Run individual test suites
      results.threading = await this.testNIP10Threading();
      console.log('\n');

      results.zaps = await this.testNIP57Zaps();
      console.log('\n');

      results.relay = await this.testNIP65RelayManagement();
      console.log('\n');

      // Calculate summary
      results.summary.totalPassed =
        (results.threading?.passed || 0) +
        (results.zaps?.passed || 0) +
        (results.relay?.passed || 0);

      results.summary.totalFailed =
        (results.threading?.failed || 0) +
        (results.zaps?.failed || 0) +
        (results.relay?.failed || 0);

      results.summary.totalTime = Date.now() - startTime;

      // Display summary
      console.log('📊 Test Summary:');
      console.log('='.repeat(50));
      console.log(`✅ Passed: ${results.summary.totalPassed}`);
      console.log(`❌ Failed: ${results.summary.totalFailed}`);
      console.log(`⏱️  Time: ${results.summary.totalTime}ms`);
      console.log(`📈 Success Rate: ${((results.summary.totalPassed / (results.summary.totalPassed + results.summary.totalFailed)) * 100).toFixed(1)}%`);

      if (results.summary.totalFailed === 0) {
        console.log('\n🎉 All tests passed! Phase 1 Week 1-2 enhancements are working correctly.');
      } else {
        console.log('\n⚠️  Some tests failed. Please review the results above.');
      }

    } catch (error) {
      console.error('❌ Test suite error:', error);
      results.summary.totalFailed++;
    }

    return results;
  },

  /**
   * Performance benchmark
   */
  async benchmarkPerformance() {
    console.log('🏃‍♂️ Running Performance Benchmarks...');

    const benchmarks = [];

    // Benchmark thread parsing
    const threadEvents = Array.from({ length: 1000 }, (_, i) => ({
      id: `event-${i}`,
      pubkey: `pubkey-${i}`,
      created_at: Math.floor(Date.now() / 1000) - i,
      kind: 1,
      content: `Event ${i} content`,
      tags: i > 0 ? [['e', `event-${i-1}`, '', 'reply']] : []
    }));

    const threadStart = Date.now();
    threadEvents.forEach(event => parseThread(event));
    const threadTime = Date.now() - threadStart;

    benchmarks.push({
      name: 'Thread Parsing (1000 events)',
      time: threadTime,
      eventsPerSecond: Math.round(1000 / (threadTime / 1000))
    });

    // Benchmark zap request creation
    const zapStart = Date.now();
    for (let i = 0; i < 1000; i++) {
      createZapRequest(
        1000 + i,
        `recipient-${i}`,
        `event-${i}`,
        ['wss://relay.example.com'],
        `Message ${i}`
      );
    }
    const zapTime = Date.now() - zapStart;

    benchmarks.push({
      name: 'Zap Request Creation (1000 requests)',
      time: zapTime,
      requestsPerSecond: Math.round(1000 / (zapTime / 1000))
    });

    console.table(benchmarks);
    return benchmarks;
  }
};

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestSuite;
} else if (typeof window !== 'undefined') {
  window.TestSuite = TestSuite;
}

// Auto-run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  TestSuite.runAllTests();
  TestSuite.benchmarkPerformance();
}
```

## 📋 How to Use This Test Suite

### **Browser Console Testing:**
1. Open your app at `http://localhost:3000/enhanced-demo`
2. Open browser console (F12)
3. Paste and run:
```javascript
// Run all tests
await TestSuite.runAllTests();

// Run individual tests
await TestSuite.testNIP10Threading();
await TestSuite.testNIP57Zaps();
await TestSuite.testNIP65RelayManagement();

// Run performance benchmarks
await TestSuite.benchmarkPerformance();
```

### **Node.js Testing:**
```bash
cd /Users/jptns/Coding/panstr-webboard-forum
node app/test/enhanced-features-test.js
```

### **Manual Testing Checklist:**
- [ ] **Threading**: Create threads with different depths
- [ ] **Zaps**: Send zaps with splits and create goals
- [ ] **Relays**: Test health monitoring and discovery
- [ ] **Performance**: Test with large datasets
- [ ] **Error Handling**: Test with invalid data

This test suite will validate that all Phase 1 Week 1-2 enhancements are working correctly!
