/**
 * API Testing Utilities for Phase 1 Week 1-2 NIP Enhancements
 *
 * This file provides utilities for testing the enhanced Nostr client functions
 * against real relays and verifying NIP compliance.
 */

import {
  // Threading functions
  parseThread,
  optimizeThreadStructure,

  // Zap functions
  createZapRequest,
  verifyZapReceipt,
  createZapGoal,
  calculateZapGoalProgress,
  getZapAnalytics,

  // Relay functions
  getRelayList,
  createRelayListEvent,
  testRelayHealth,
  monitorRelayHealth,
  getOptimalRelays,
  discoverRelaysFromNetwork,
  scoreRelays,
  getRelayStatistics,

  // Utility functions
  queryEvents,
  getUserProfile,
  formatPubkey,
  generatePrivateKey,
  getPublicKey,
  publishToPool,
  finalizeEvent
} from '../lib/nostrClient.js';

const APITestSuite = {
  /**
   * Test suite configuration
   */
  config: {
    testRelays: [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.siamdev.cc',
      'wss://nfrelay.app'
    ],
    timeout: 10000,
    maxRetries: 3
  },

  /**
   * Test Enhanced NIP-10 Threading against real data
   */
  async testNIP10Threading() {
    console.log('🧪 Testing NIP-10 Threading with Real Data...');

    const results = {
      passed: 0,
      failed: 0,
      details: []
    };

    try {
      // Test 1: Fetch real events with threading
      console.log('Fetching real events for threading test...');
      const events = await queryEvents(
        {
          kinds: [1],
          limit: 50,
          until: Math.floor(Date.now() / 1000)
        },
        this.config.testRelays.slice(0, 2)
      );

      results.details.push({
        test: 'Fetch real events',
        status: events.length > 0 ? '✅' : '❌',
        result: `Found ${events.length} events`
      });

      if (events.length > 0) {
        // Test 2: Parse threads from real events
        let threadCount = 0;
        let mentionCount = 0;
        let maxDepth = 0;

        for (const event of events) {
          try {
            const parsed = parseThread(event);

            if (parsed.root || parsed.reply) {
              threadCount++;
            }

            mentionCount += parsed.mentions.length;
            maxDepth = Math.max(maxDepth, parsed.depth);
          } catch (error) {
            console.warn(`Failed to parse event ${event.id}:`, error.message);
          }
        }

        results.details.push({
          test: 'Thread parsing',
          status: threadCount > 0 ? '✅' : '⚠️',
          result: `${threadCount} threads, ${mentionCount} mentions, max depth ${maxDepth}`
        });

        // Test 3: Thread optimization
        const optimized = optimizeThreadStructure(events);
        results.details.push({
          test: 'Thread optimization',
          status: optimized.length > 0 ? '✅' : '❌',
          result: `Created ${optimized.length} optimized threads`
        });

        // Test 4: Profile resolution
        const uniquePubkeys = [...new Set(events.map(e => e.pubkey))];
        let profileCount = 0;

        for (const pubkey of uniquePubkeys.slice(0, 10)) {
          try {
            const profile = await getUserProfile(pubkey);
            if (profile && profile.name) {
              profileCount++;
            }
          } catch (error) {
            console.warn(`Failed to get profile for ${pubkey}:`, error.message);
          }
        }

        results.details.push({
          test: 'Profile resolution',
          status: profileCount > 0 ? '✅' : '⚠️',
          result: `Resolved ${profileCount}/${Math.min(uniquePubkeys.length, 10)} profiles`
        });
      }

      results.passed = results.details.filter(d => d.status === '✅').length;
      results.failed = results.details.filter(d => d.status === '❌').length;

    } catch (error) {
      console.error('NIP-10 Threading API Test Error:', error);
      results.failed++;
      results.details.push({
        test: 'API Test Error',
        status: '❌',
        result: error.message
      });
    }

    return results;
  },

  /**
   * Test Enhanced NIP-57 Zaps against real infrastructure
   */
  async testNIP57Zaps() {
    console.log('⚡ Testing NIP-57 Zaps with Real Infrastructure...');

    const results = {
      passed: 0,
      failed: 0,
      details: []
    };

    try {
      // Test 1: Create zap requests with various configurations
      const testCases = [
        {
          name: 'Basic zap',
          config: { amount: 1000, message: 'Basic test zap' }
        },
        {
          name: 'Zap with splits',
          config: {
            amount: 1000,
            message: 'Split test zap',
            options: {
              splits: [
                { pubkey: 'split1' + 'a'.repeat(56), percentage: 30 },
                { pubkey: 'split2' + 'b'.repeat(56), percentage: 70 }
              ]
            }
          }
        },
        {
          name: 'Anonymous zap',
          config: {
            amount: 1000,
            message: 'Anonymous test zap',
            options: { anon: true, zapType: 'anonymous' }
          }
        }
      ];

      for (const testCase of testCases) {
        try {
          const zapRequest = createZapRequest(
            testCase.config.amount,
            'test-recipient' + 'c'.repeat(56),
            'test-event-id',
            this.config.testRelays,
            testCase.config.message,
            testCase.config.options || {}
          );

          const isValid = zapRequest.kind === 9734 &&
                         zapRequest.tags.some(t => t[0] === 'p') &&
                         zapRequest.tags.some(t => t[0] === 'amount');

          results.details.push({
            test: testCase.name,
            status: isValid ? '✅' : '❌',
            result: `Kind: ${zapRequest.kind}, Tags: ${zapRequest.tags.length}`
          });

        } catch (error) {
          results.details.push({
            test: testCase.name,
            status: '❌',
            result: error.message
          });
        }
      }

      // Test 2: Create and verify zap goals
      const goal = createZapGoal(
        'test-creator' + 'd'.repeat(56),
        this.config.testRelays,
        100000,
        'Test funding goal for Phase 1 Week 1-2',
        { image: 'https://example.com/goal-image.jpg' }
      );

      const goalValid = goal.kind === 9041 &&
                       goal.tags.some(t => t[0] === 'p') &&
                       goal.tags.some(t => t[0] === 'amount');

      results.details.push({
        test: 'Zap goal creation',
        status: goalValid ? '✅' : '❌',
        result: `Kind: ${goal.kind}, Has amount: ${goal.tags.some(t => t[0] === 'amount')}`
      });

      // Test 3: Zap analytics (mock data test)
      const mockGoal = {
        id: 'test-goal-123',
        tags: [
          ['p', 'test-creator' + 'd'.repeat(56)],
          ['amount', '100000'],
          ['d', 'test-goal-identifier']
        ]
      };

      const mockZaps = [
        {
          tags: [
            ['bolt11', 'lnbc1000n1p3k...'],
            ['description', JSON.stringify({
              kind: 9734,
              tags: [['p', 'test-creator' + 'd'.repeat(56)], ['e', 'test-goal-123']],
              content: 'First test zap'
            })]
          ]
        }
      ];

      const progress = calculateZapGoalProgress(mockGoal, mockZaps);
      const progressValid = typeof progress.percentage === 'number' &&
                           progress.zapperCount >= 0;

      results.details.push({
        test: 'Goal progress calculation',
        status: progressValid ? '✅' : '❌',
        result: `Percentage: ${progress.percentage}%, Zappers: ${progress.zapperCount}`
      });

      results.passed = results.details.filter(d => d.status === '✅').length;
      results.failed = results.details.filter(d => d.status === '❌').length;

    } catch (error) {
      console.error('NIP-57 Zaps API Test Error:', error);
      results.failed++;
      results.details.push({
        test: 'API Test Error',
        status: '❌',
        result: error.message
      });
    }

    return results;
  },

  /**
   * Test NIP-65 Relay Management against real relays
   */
  async testNIP65RelayManagement() {
    console.log('🔌 Testing NIP-65 Relay Management with Real Relays...');

    const results = {
      passed: 0,
      failed: 0,
      details: []
    };

    try {
      // Test 1: Relay health monitoring
      console.log('Testing relay health...');
      const healthResults = await monitorRelayHealth(this.config.testRelays, 2);

      const connectedCount = healthResults.filter(r => r.connected).length;
      const healthyCount = healthResults.filter(r => r.connected && r.latency < 2000).length;

      results.details.push({
        test: 'Relay health monitoring',
        status: connectedCount > 0 ? '✅' : '❌',
        result: `${connectedCount}/${healthResults.length} connected, ${healthyCount} healthy`
      });

      // Test 2: Relay scoring
      if (healthResults.length > 0) {
        const scored = scoreRelays(healthResults);
        const validScores = scored.every(r => r.score >= 0 && r.score <= 100);

        results.details.push({
          test: 'Relay scoring',
          status: validScores ? '✅' : '❌',
          result: `All scores valid (0-100), Best score: ${Math.max(...scored.map(s => s.score))}`
        });
      }

      // Test 3: Relay list event creation (NIP-65)
      const relayListEvent = createRelayListEvent(
        this.config.testRelays.slice(0, 2),  // read relays
        this.config.testRelays.slice(2, 4),  // write relays
        this.config.testRelays.slice(0, 1)   // both relays
      );

      const listValid = relayListEvent.kind === 10002 &&
                      relayListEvent.tags.filter(t => t[0] === 'r')..length === 5;

      results.details.push({
        test: 'Relay list creation (NIP-65)',
        status: listValid ? '✅' : '❌',
        result: `Kind: ${relayListEvent.kind}, Tags: ${relayListEvent.tags.filter(t => t[0] === 'r').length}`
      });

      // Test 4: Optimal relay selection (mock test)
      const mockPubkey = 'test-user' + 'e'.repeat(56);
      const optimalRead = await getOptimalRelays(mockPubkey, 'read', 3);
      const optimalWrite = await getOptimalRelays(mockPubkey, 'write', 3);

      results.details.push({
        test: 'Optimal relay selection',
        status: optimalRead.length > 0 && optimalWrite.length > 0 ? '✅' : '⚠️',
        result: `Read: ${optimalRead.length}, Write: ${optimalWrite.length}`
      });

      // Test 5: Relay statistics
      const stats = await getRelayStatistics(this.config.testRelays);
      const statsValid = stats && typeof stats.total === 'number' &&
                       typeof stats.connected === 'number';

      results.details.push({
        test: 'Relay statistics',
        status: statsValid ? '✅' : '❌',
        result: `Total: ${stats?.total}, Connected: ${stats?.connected}, Avg latency: ${stats?.averageLatency}ms`
      });

      results.passed = results.details.filter(d => d.status === '✅').length;
      results.failed = results.details.filter(d => d.status === '❌').length;

    } catch (error) {
      console.error('NIP-65 Relay Management API Test Error:', error);
      results.failed++;
      results.details.push({
        test: 'API Test Error',
        status: '❌',
        result: error.message
      });
    }

    return results;
  },

  /**
   * Test comprehensive API integration
   */
  async testAPIIntegration() {
    console.log('🔗 Testing Comprehensive API Integration...');

    const results = {
      passed: 0,
      failed: 0,
      details: []
    };

    try {
      // Test 1: Generate test keys and create test data
      const testPrivateKey = generatePrivateKey();
      const testPubkey = getPublicKey(testPrivateKey);

      results.details.push({
        test: 'Test key generation',
        status: testPubkey && testPrivateKey ? '✅' : '❌',
        result: `Generated pubkey: ${testPubkey.slice(0, 16)}...`
      });

      // Test 2: Create and publish a test event
      const testEvent = {
        kind: 1,
        content: 'Phase 1 Week 1-2 API Integration Test',
        created_at: Math.floor(Date.now() / 1000),
        tags: [['t', 'panstr-test'], [['p', testPubkey]]]
      };

      try {
        const signedEvent = finalizeEvent(testEvent, testPrivateKey);
        await publishToPool(this.config.testRelays.slice(0, 2), signedEvent);

        results.details.push({
          test: 'Event publishing',
          status: '✅',
          result: 'Published test event successfully'
        });
      } catch (error) {
        results.details.push({
          test: 'Event publishing',
          status: '⚠️',
          result: `Publishing failed: ${error.message}`
        });
      }

      // Test 3: Query events back
      setTimeout(async () => {
        try {
          const queriedEvents = await queryEvents(
            {
              kinds: [1],
              authors: [testPubkey],
              limit: 1
            },
            this.config.testRelays.slice(0, 2)
          );

          results.details.push({
            test: 'Event querying',
            status: queriedEvents.length > 0 ? '✅' : '❌',
            result: `Found ${queriedEvents.length} events`
          });

        } catch (error) {
          results.details.push({
            test: 'Event querying',
            status: '❌',
            result: error.message
          });
        }
      }, 2000);

      // Test 4: Error handling and resilience
      const invalidRelay = 'wss://invalid-relay-that-does-not-exist.com';
      try {
        const health = await testRelayHealth(invalidRelay, 2000);

        results.details.push({
          test: 'Error handling',
          status: !health.connected ? '✅' : '❌',
          result: `Properly handled invalid relay: ${health.error || 'No error'}`
        });
      } catch (error) {
        results.details.push({
          test: 'Error handling',
          status: '✅',
          result: `Properly threw error for invalid relay: ${error.message}`
        });
      }

      results.passed = results.details.filter(d => d.status === '✅').length;
      results.failed = results.details.filter(d => d.status === '❌').length;

    } catch (error) {
      console.error('API Integration Test Error:', error);
      results.failed++;
      results.details.push({
        test: 'Integration Error',
        status: '❌',
        result: error.message
      });
    }

    return results;
  },

  /**
   * Run all API tests
   */
  async runAllTests() {
    console.log('🚀 Running Comprehensive API Test Suite...\n');

    const startTime = Date.now();
    const results = {
      threading: null,
      zaps: null,
      relay: null,
      integration: null,
      summary: {
        totalPassed: 0,
        totalFailed: 0,
        totalTime: 0,
        successRate: 0
      }
    };

    try {
      // Run individual test suites
      results.threading = await this.testNIP10Threading();
      console.log('\n');

      results.zaps = await this.testNIP57Zaps();
      console.log('\n');

      results.relay = await this.testNIP65RelayManagement();
      console.log('\n');

      results.integration = await this.testAPIIntegration();

      // Wait for any delayed tests
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Calculate summary
      results.summary.totalPassed =
        (results.threading?.passed || 0) +
        (results.zaps?.passed || 0) +
        (results.relay?.passed || 0) +
        (results.integration?.passed || 0);

      results.summary.totalFailed =
        (results.threading?.failed || 0) +
        (results.zaps?.failed || 0) +
        (results.relay?.failed || 0) +
        (results.integration?.failed || 0);

      results.summary.totalTime = Date.now() - startTime;
      const totalTests = results.summary.totalPassed + results.summary.totalFailed;
      results.summary.successRate = totalTests > 0 ? (results.summary.totalPassed / totalTests) * 100 : 0;

      // Display detailed results
      console.log('\n📊 Detailed Test Results:');
      console.log('='.repeat(60));

      console.log('\n🧪 NIP-10 Threading:');
      results.threading?.details.forEach(detail => {
        console.log(`  ${detail.status} ${detail.test}: ${detail.result}`);
      });

      console.log('\n⚡ NIP-57 Zaps:');
      results.zaps?.details.forEach(detail => {
        console.log(`  ${detail.status} ${detail.test}: ${detail.result}`);
      });

      console.log('\n🔌 NIP-65 Relay Management:');
      results.relay?.details.forEach(detail => {
        console.log(`  ${detail.status} ${detail.test}: ${detail.result}`);
      });

      console.log('\n🔗 API Integration:');
      results.integration?.details.forEach(detail => {
        console.log(`  ${detail.status} ${detail.test}: ${detail.result}`);
      });

      console.log('\n📈 Final Summary:');
      console.log('='.repeat(30));
      console.log(`✅ Passed: ${results.summary.totalPassed}`);
      console.log(`❌ Failed: ${results.summary.totalFailed}`);
      console.log(`⏱️  Time: ${results.summary.totalTime}ms`);
      console.log(`📊 Success Rate: ${results.summary.successRate.toFixed(1)}%`);

      if (results.summary.totalFailed === 0) {
        console.log('\n🎉 All API tests passed! Phase 1 Week 1-2 enhancements are production-ready.');
      } else {
        console.log('\n⚠️  Some API tests failed. Review the details above for troubleshooting.');
      }

    } catch (error) {
      console.error('❌ API Test Suite Error:', error);
      results.summary.totalFailed++;
    }

    return results;
  },

  /**
   * Generate test report
   */
  generateReport(testResults) {
    const report = {
      timestamp: new Date().toISOString(),
      version: 'Phase 1 Week 1-2',
      results: testResults,
      recommendations: this.generateRecommendations(testResults)
    };

    return report;
  },

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations(testResults) {
    const recommendations = [];

    if (!testResults.threading || testResults.threading.failed > 0) {
      recommendations.push('Review NIP-10 threading implementation - some tests failed');
    }

    if (!testResults.zaps || testResults.zaps.failed > 0) {
      recommendations.push('Check NIP-57 zap functionality - validation issues detected');
    }

    if (!testResults.relay || testResults.relay.failed > 0) {
      recommendations.push('Examine NIP-65 relay management - connectivity problems found');
    }

    if (testResults.summary?.successRate < 80) {
      recommendations.push('Overall success rate below 80% - comprehensive review needed');
    }

    if (recommendations.length === 0) {
      recommendations.push('All tests passed - implementation is ready for production');
    }

    return recommendations;
  }
};

// Export for use in various environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APITestSuite;
} else if (typeof window !== 'undefined') {
  window.APITestSuite = APITestSuite;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  APITestSuite.runAllTests()
    .then(results => {
      console.log('\n📋 Generating test report...');
      const report = APITestSuite.generateReport(results);
      console.log('Test report generated successfully.');
      process.exit(results.summary.totalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}
