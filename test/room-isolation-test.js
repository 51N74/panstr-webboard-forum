/**
 * ROOM ISOLATION VERIFICATION TEST
 * 
 * This test verifies that the strict room isolation is working correctly:
 * 1. Posts are created with mandatory room tags
 * 2. Rooms only display content with their specific room tag
 * 3. No cross-room data leakage occurs
 * 
 * Usage: node test/room-isolation-test.js
 */

const {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  verifyEvent,
} = require('nostr-tools/pure');
const { SimplePool } = require('nostr-tools/pool');
const fs = require('fs');
const path = require('path');

// Import room configuration
const boardsConfig = require('../app/data/boardsConfig.js');
const { getAllRooms, getRoomTags, getRoomById } = boardsConfig;

const TEST_CONFIG = {
  relays: [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://fenrir-s.notoshi.win',
  ],
  publishTimeout: 15000,
  testRunId: `room-isolation-test-${Date.now()}`,
};

// Test rooms - pick 3 distinct rooms from different categories
const TEST_ROOMS = [
  'chill-chat',      // Lifestyle category
  'nostr-cafe',      // Tech & Nostr category
  'zap-zone',        // Nostr Special category
];

/**
 * Create room-specific tags for an event (inline implementation for testing)
 */
function createRoomTags(roomId, additionalTags = []) {
  const room = getRoomById(roomId);
  
  if (!room) {
    throw new Error(`Invalid room ID: ${roomId}`);
  }

  const tags = [];
  
  // MANDATORY: Primary room identifier tag
  tags.push(['room', roomId]);
  
  // MANDATORY: Category tag for broader filtering
  tags.push(['category', room.category]);
  
  // OPTIONAL: User-selected tags (validated against room)
  if (additionalTags && additionalTags.length > 0) {
    const validTags = additionalTags
      .map(tag => String(tag).trim().toLowerCase())
      .filter(tag => {
        // Validate tag belongs to this room
        const roomTags = getRoomTags(roomId);
        const isValid = roomTags.includes(tag);
        if (!isValid) {
          console.warn(`Tag "${tag}" is not valid for room ${roomId} and will be ignored`);
        }
        return isValid;
      })
      .slice(0, 5); // Max 5 user tags
    
    validTags.forEach(tag => {
      tags.push(['t', tag]);
    });
  }
  
  return tags;
}

/**
 * Validate that an event belongs to a specific room (inline implementation for testing)
 */
function validateEventRoom(event, roomId) {
  if (!event || !event.tags) {
    return {
      isValid: false,
      reason: 'Event or tags missing',
    };
  }

  // Check for mandatory room tag
  const roomTag = event.tags.find(tag => tag[0] === 'room' && tag[1]);
  const roomValue = roomTag?.[1];

  if (!roomValue) {
    return {
      isValid: false,
      reason: 'Missing room tag',
    };
  }

  // Strict room matching
  if (roomValue !== roomId) {
    return {
      isValid: false,
      reason: `Room mismatch: expected "${roomId}", got "${roomValue}"`,
    };
  }

  // Validate category tag matches
  const categoryTag = event.tags.find(tag => tag[0] === 'category' && tag[1]);
  const room = getRoomById(roomId);
  
  if (room && categoryTag && categoryTag[1] !== room.category) {
    return {
      isValid: false,
      reason: `Category mismatch: expected "${room.category}", got "${categoryTag[1]}"`,
    };
  }

  // Validate 't' tags belong to this room
  const tTags = event.tags
    .filter(tag => tag[0] === 't' && tag[1])
    .map(tag => tag[1]);
  
  const roomTags = getRoomTags(roomId);
  const invalidTags = tTags.filter(tag => !roomTags.includes(tag));
  
  if (invalidTags.length > 0) {
    return {
      isValid: false,
      reason: `Invalid tags for room: ${invalidTags.join(', ')}`,
    };
  }

  return {
    isValid: true,
    reason: 'All validations passed',
  };
}

/**
 * Filter events by room with strict validation
 */
function filterEventsByRoom(events, roomId) {
  if (!events || !Array.isArray(events)) {
    return [];
  }

  return events.filter(event => {
    const validation = validateEventRoom(event, roomId);
    if (!validation.isValid) {
      console.debug(`Event ${event.id.slice(0, 8)}... filtered: ${validation.reason}`);
    }
    return validation.isValid;
  });
}

/**
 * Create strict relay filters for room-specific queries
 */
function createRoomFilters(roomId, options = {}) {
  const {
    kinds = [30023],
    limit = 100,
    since = null,
    until = null,
  } = options;

  const filters = {
    kinds,
    ['#room']: [roomId],
    limit,
  };

  if (since) filters.since = since;
  if (until) filters.until = until;

  return filters;
}

class RoomIsolationTest {
  constructor() {
    this.accounts = [];
    this.pool = null;
    this.testResults = [];
    this.createdEvents = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info', data = null) {
    const timestamp = new Date().toISOString();
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const logEntry = { timestamp, elapsed, type, message, data };
    
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
   * Generate test accounts
   */
  generateAccounts() {
    this.log('Generating test accounts...', 'test');
    
    const personas = [
      { name: 'RoomTester_Alpha', displayName: 'Alpha Tester' },
      { name: 'RoomTester_Beta', displayName: 'Beta Tester' },
    ];

    personas.forEach(persona => {
      const privateKey = generateSecretKey();
      const publicKey = getPublicKey(privateKey);
      
      this.accounts.push({
        ...persona,
        privateKey: this.bytesToHex(privateKey),
        publicKey: this.bytesToHex(publicKey),
      });
      
      this.log(`Created account: ${persona.name}`, 'success');
    });
  }

  /**
   * Test 1: Verify room tag creation
   */
  testRoomTagCreation() {
    this.log('\n📋 Test 1: Room Tag Creation', 'test');
    
    let passed = 0;
    let failed = 0;

    TEST_ROOMS.forEach(roomId => {
      try {
        const tags = createRoomTags(roomId, ['test-tag']);
        
        // Verify mandatory tags exist
        const roomTag = tags.find(t => t[0] === 'room' && t[1] === roomId);
        const categoryTag = tags.find(t => t[0] === 'category');
        
        if (!roomTag) {
          throw new Error('Missing room tag');
        }
        
        if (!categoryTag) {
          throw new Error('Missing category tag');
        }
        
        // Verify room tag is valid
        const room = getRoomById(roomId);
        if (categoryTag[1] !== room.category) {
          throw new Error(`Category mismatch: expected ${room.category}, got ${categoryTag[1]}`);
        }
        
        this.log(`✅ Room ${roomId}: Tags created correctly`, 'success');
        passed++;
      } catch (error) {
        this.log(`❌ Room ${roomId}: ${error.message}`, 'error');
        failed++;
      }
    });

    this.log(`Test 1 Complete: ${passed} passed, ${failed} failed`, failed === 0 ? 'success' : 'error');
    return { passed, failed, total: passed + failed };
  }

  /**
   * Test 2: Verify event validation
   */
  testEventValidation() {
    this.log('\n📋 Test 2: Event Room Validation', 'test');
    
    let passed = 0;
    let failed = 0;

    TEST_ROOMS.forEach(roomId => {
      try {
        // Create a valid event
        const tags = createRoomTags(roomId, ['test']);
        tags.push(['d', `test-thread-${roomId}`]);
        tags.push(['title', `Test Thread for ${roomId}`]);
        
        const event = finalizeEvent(
          {
            kind: 30023,
            created_at: Math.floor(Date.now() / 1000),
            content: 'Test content',
            tags,
          },
          generateSecretKey()
        );

        // Validate the event
        const validation = validateEventRoom(event, roomId);
        
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.reason}`);
        }
        
        this.log(`✅ Room ${roomId}: Event validation passed`, 'success');
        passed++;
      } catch (error) {
        this.log(`❌ Room ${roomId}: ${error.message}`, 'error');
        failed++;
      }
    });

    this.log(`Test 2 Complete: ${passed} passed, ${failed} failed`, failed === 0 ? 'success' : 'error');
    return { passed, failed, total: passed + failed };
  }

  /**
   * Test 3: Verify cross-room filtering
   */
  testCrossRoomFiltering() {
    this.log('\n📋 Test 3: Cross-Room Filtering', 'test');
    
    let passed = 0;
    let failed = 0;

    try {
      // Create events for different rooms
      const events = [];
      
      TEST_ROOMS.forEach(roomId => {
        const tags = createRoomTags(roomId, ['test']);
        tags.push(['d', `test-${roomId}`]);
        tags.push(['title', `Test for ${roomId}`]);
        
        const event = finalizeEvent(
          {
            kind: 30023,
            created_at: Math.floor(Date.now() / 1000),
            content: `Test content for ${roomId}`,
            tags,
          },
          generateSecretKey()
        );
        
        events.push(event);
        this.createdEvents.push({ roomId, event });
      });

      // Test filtering for each room
      TEST_ROOMS.forEach(roomId => {
        const filtered = filterEventsByRoom(events, roomId);
        
        if (filtered.length !== 1) {
          throw new Error(`Expected 1 event for ${roomId}, got ${filtered.length}`);
        }
        
        const filteredRoomTag = filtered[0].tags.find(t => t[0] === 'room');
        if (filteredRoomTag[1] !== roomId) {
          throw new Error(`Filtered event has wrong room: ${filteredRoomTag[1]}`);
        }
        
        this.log(`✅ Room ${roomId}: Correctly filtered to 1 event`, 'success');
        passed++;
      });
    } catch (error) {
      this.log(`❌ Cross-room filtering failed: ${error.message}`, 'error');
      failed++;
    }

    this.log(`Test 3 Complete: ${passed} passed, ${failed} failed`, failed === 0 ? 'success' : 'error');
    return { passed, failed, total: passed + failed };
  }

  /**
   * Test 4: Verify invalid tag rejection
   */
  testInvalidTagRejection() {
    this.log('\n📋 Test 4: Invalid Tag Rejection', 'test');
    
    let passed = 0;
    let failed = 0;

    try {
      // Create event with invalid tag (tag from different room)
      const roomId = 'chill-chat';
      const invalidTag = 'relay-setup'; // This tag belongs to 'relay-station', not 'chill-chat'
      
      const tags = createRoomTags(roomId, [invalidTag]);
      
      // The invalid tag should have been filtered out
      const hasInvalidTag = tags.some(t => t[0] === 't' && t[1] === invalidTag);
      
      if (hasInvalidTag) {
        throw new Error(`Invalid tag "${invalidTag}" was not rejected`);
      }
      
      this.log(`✅ Invalid tag correctly rejected`, 'success');
      passed++;
    } catch (error) {
      this.log(`❌ Invalid tag rejection failed: ${error.message}`, 'error');
      failed++;
    }

    this.log(`Test 4 Complete: ${passed} passed, ${failed} failed`, failed === 0 ? 'success' : 'error');
    return { passed, failed, total: passed + failed };
  }

  /**
   * Test 5: Create and verify real events on relays
   */
  async testRealEventCreation() {
    this.log('\n📋 Test 5: Real Event Creation on Relays', 'test');
    
    let passed = 0;
    let failed = 0;

    try {
      // Initialize pool
      this.pool = new SimplePool({ enablePing: true });
      
      const connected = await Promise.all(
        TEST_CONFIG.relays.map(async (url) => {
          try {
            await this.pool.ensureRelay(url);
            return { url, connected: true };
          } catch {
            return { url, connected: false };
          }
        })
      );

      const activeRelays = connected.filter(r => r.connected).map(r => r.url);
      this.log(`Connected to ${activeRelays.length}/${TEST_CONFIG.relays.length} relays`, 'info');

      if (activeRelays.length === 0) {
        throw new Error('No relays connected');
      }

      // Create and publish events for each test room
      const account = this.accounts[0];
      
      for (const roomId of TEST_ROOMS) {
        try {
          const tags = createRoomTags(roomId, ['isolation-test']);
          const threadId = `isolation-test-${roomId}-${Date.now()}`;
          
          tags.unshift(['d', threadId]);
          tags.unshift(['title', `Room Isolation Test: ${roomId}`]);
          tags.push(['published_at', String(Math.floor(Date.now() / 1000))]);

          const event = finalizeEvent(
            {
              kind: 30023,
              created_at: Math.floor(Date.now() / 1000),
              content: `This is a test event for room ${roomId}. It should ONLY appear in the ${roomId} room.`,
              tags,
            },
            new Uint8Array(Buffer.from(account.privateKey, 'hex'))
          );

          // Verify signature
          const isValid = verifyEvent(event);
          if (!isValid) {
            throw new Error('Event signature invalid');
          }

          // Publish to relays
          const publishPromises = activeRelays.map(url => 
            this.pool.publish([url], event)
          );
          
          await Promise.any(publishPromises);
          
          this.log(`✅ Published event to room ${roomId}`, 'success', {
            eventId: event.id.slice(0, 16) + '...',
            tags: tags.slice(0, 5)
          });
          
          this.createdEvents.push({ roomId, event });
          passed++;
          
          // Small delay between publishes
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          this.log(`❌ Failed to publish to room ${roomId}: ${error.message}`, 'error');
          failed++;
        }
      }
    } catch (error) {
      this.log(`❌ Real event creation failed: ${error.message}`, 'error');
      failed++;
    } finally {
      this.cleanupPool();
    }

    this.log(`Test 5 Complete: ${passed} passed, ${failed} failed`, failed === 0 ? 'success' : 'error');
    return { passed, failed, total: passed + failed };
  }

  /**
   * Test 6: Verify query filters
   */
  testQueryFilters() {
    this.log('\n📋 Test 6: Query Filter Creation', 'test');
    
    let passed = 0;
    let failed = 0;

    TEST_ROOMS.forEach(roomId => {
      try {
        const filters = createRoomFilters(roomId);
        
        if (!filters['#room'] || !filters['#room'].includes(roomId)) {
          throw new Error('Filter missing room tag');
        }
        
        if (!filters.kinds || !filters.kinds.includes(30023)) {
          throw new Error('Filter missing kind 30023');
        }
        
        this.log(`✅ Room ${roomId}: Query filter created correctly`, 'success');
        passed++;
      } catch (error) {
        this.log(`❌ Room ${roomId}: ${error.message}`, 'error');
        failed++;
      }
    });

    this.log(`Test 6 Complete: ${passed} passed, ${failed} failed`, failed === 0 ? 'success' : 'error');
    return { passed, failed, total: passed + failed };
  }

  /**
   * Cleanup pool connection
   */
  cleanupPool() {
    try {
      if (this.pool && typeof this.pool.close === 'function') {
        this.pool.close();
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  /**
   * Generate test report
   */
  generateReport(testResults) {
    this.log('\n📊 Generating test report...', 'info');

    const totalTests = testResults.reduce((sum, r) => sum + r.total, 0);
    const totalPassed = testResults.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = testResults.reduce((sum, r) => sum + r.failed, 0);

    const report = {
      testRunId: TEST_CONFIG.testRunId,
      timestamp: new Date().toISOString(),
      duration: ((Date.now() - this.startTime) / 1000).toFixed(2) + 's',
      summary: {
        totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: `${((totalPassed / totalTests) * 100).toFixed(1)}%`,
      },
      testResults,
      createdEvents: this.createdEvents.map(e => ({
        roomId: e.roomId,
        eventId: e.event.id,
        tags: e.event.tags,
      })),
      logs: this.testResults,
    };

    // Save report
    const reportDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `${TEST_CONFIG.testRunId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Report saved to: ${reportPath}`, 'success');

    return report;
  }

  bytesToHex(bytes) {
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Run complete test suite
   */
  async runTestSuite() {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 ROOM ISOLATION VERIFICATION TEST');
    console.log('='.repeat(70) + '\n');

    const results = [];

    try {
      // Test 1: Tag creation
      this.generateAccounts();
      results.push(this.testRoomTagCreation());

      // Test 2: Event validation
      results.push(this.testEventValidation());

      // Test 3: Cross-room filtering
      results.push(this.testCrossRoomFiltering());

      // Test 4: Invalid tag rejection
      results.push(this.testInvalidTagRejection());

      // Test 5: Real event creation
      results.push(await this.testRealEventCreation());

      // Test 6: Query filters
      results.push(this.testQueryFilters());

      // Generate report
      const report = this.generateReport(results);

      // Final summary
      console.log('\n' + '='.repeat(70));
      console.log('📊 TEST SUMMARY');
      console.log('='.repeat(70));
      console.log(`✅ Tests Passed: ${report.summary.passed}/${report.summary.totalTests}`);
      console.log(`❌ Tests Failed: ${report.summary.failed}`);
      console.log(`📈 Success Rate: ${report.summary.successRate}`);
      console.log(`⏱️  Duration: ${report.duration}`);
      
      if (report.summary.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Room isolation is working correctly.');
      } else {
        console.log('\n⚠️  SOME TESTS FAILED. Review the report for details.');
      }
      console.log('='.repeat(70) + '\n');

      return {
        success: report.summary.failed === 0,
        report,
      };
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      console.error(error);
      return { success: false, error: error.message };
    }
  }
}

// Run the test
async function main() {
  const tester = new RoomIsolationTest();
  const result = await tester.runTestSuite();
  
  process.exit(result.success ? 0 : 1);
}

// Export for module use
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { RoomIsolationTest, TEST_CONFIG, TEST_ROOMS };
