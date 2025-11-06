/**
 * DEBUGGING SCRIPT: Fix Local Thread Filtering Issue
 *
 * Problem: Threads are created and visible on other Nostr clients
 * but not showing up in local web application
 *
 * This script helps diagnose and fix the filtering/retrieval issue
 */

console.log('🔍 DEBUGGING LOCAL THREAD FILTERING');
console.log('='.repeat(60));

// Test different filter approaches
async function testThreadFiltering() {
  try {
    console.log('\n🧪 Testing different filter approaches...');

    // Test 1: Direct filter (current approach)
    console.log('\n1️⃣ Testing current filter approach:');
    const currentFilter = {
      kinds: [30023],
      '#t': ['forum'],
      '#board': ['nostr-cafe'],
      limit: 50
    };
    console.log('Filter:', JSON.stringify(currentFilter, null, 2));

    // Test 2: Alternative filter - array vs string
    console.log('\n2️⃣ Testing alternative filter formats:');
    const altFilters = [
      {
        kinds: [30023],
        '#t': ['forum'],
        '#board': 'nostr-cafe', // String instead of array
        limit: 50
      },
      {
        kinds: [30023],
        '#t': 'forum', // String instead of array
        '#board': 'nostr-cafe',
        limit: 50
      },
      {
        kinds: [30023],
        tags: [
          ['t', 'forum'],
          ['board', 'nostr-cafe']
        ],
        limit: 50
      }
    ];

    altFilters.forEach((filter, index) => {
      console.log(`\nAlt filter ${index + 1}:`, JSON.stringify(filter, null, 2));
    });

    // Test 3: No board filter
    console.log('\n3️⃣ Testing without board filter:');
    const noBoardFilter = {
      kinds: [30023],
      '#t': ['forum'],
      limit: 50
    };
    console.log('No board filter:', JSON.stringify(noBoardFilter, null, 2));

    // Test 4: Query all kind 30023 events
    console.log('\n4️⃣ Testing all kind 30023 events:');
    const allFilter = {
      kinds: [30023],
      limit: 100
    };
    console.log('All threads filter:', JSON.stringify(allFilter, null, 2));

    return {
      currentFilter,
      altFilters,
      noBoardFilter,
      allFilter
    };
  } catch (error) {
    console.error('❌ Filter test failed:', error);
    return null;
  }
}

// Test queryEvents function
async function testQueryEvents() {
  try {
    console.log('\n🔧 Testing queryEvents function...');

    // Import and test the actual function
    const { initializePool, queryEvents } = await import('../app/lib/nostrClient.js');

    const pool = await initializePool();
    console.log('✅ Pool initialized');

    const filters = await testThreadFiltering();

    // Test each filter approach
    const results = {};

    // Test current approach
    console.log('\n📊 Testing current filter approach...');
    results.current = await queryEvents(pool, undefined, filters.currentFilter);
    console.log(`Current filter result: ${results.current.length} events`);

    // Test alternative approaches
    for (let i = 0; i < filters.altFilters.length; i++) {
      console.log(`\n📊 Testing alternative filter ${i + 1}...`);
      results[`alt${i + 1}`] = await queryEvents(pool, undefined, filters.altFilters[i]);
      console.log(`Alt ${i + 1} result: ${results[`alt${i + 1}`].length} events`);
    }

    // Test no board filter
    console.log('\n📊 Testing no board filter...');
    results.noBoard = await queryEvents(pool, undefined, filters.noBoardFilter);
    console.log(`No board filter result: ${results.noBoard.length} events`);

    // Test all events
    console.log('\n📊 Testing all kind 30023 events...');
    results.all = await queryEvents(pool, undefined, filters.allFilter);
    console.log(`All events result: ${results.all.length} events`);

    return results;
  } catch (error) {
    console.error('❌ Query test failed:', error);
    return null;
  }
}

// Test getEvents wrapper
async function testGetEvents() {
  try {
    console.log('\n🔧 Testing getEvents wrapper...');

    const { getEvents } = await import('../app/lib/nostrClient.js');

    const filters = await testThreadFiltering();

    // Test with getEvents wrapper
    const results = {};

    results.current = await getEvents(filters.currentFilter);
    console.log(`getEvents current: ${results.current.length} events`);

    for (let i = 0; i < filters.altFilters.length; i++) {
      results[`alt${i + 1}`] = await getEvents(filters.altFilters[i]);
      console.log(`getEvents alt ${i + 1}: ${results[`alt${i + 1}`].length} events`);
    }

    results.noBoard = await getEvents(filters.noBoardFilter);
    console.log(`getEvents no board: ${results.noBoard.length} events`);

    results.all = await getEvents(filters.allFilter);
    console.log(`getEvents all: ${results.all.length} events`);

    return results;
  } catch (error) {
    console.error('❌ getEvents test failed:', error);
    return null;
  }
}

// Analyze results
function analyzeResults(queryResults, getResults) {
  console.log('\n📈 ANALYZING RESULTS:');
  console.log('='.repeat(40));

  console.log('\n🔍 Query Results:');
  Object.entries(queryResults).forEach(([key, events]) => {
    console.log(`  ${key}: ${events.length} events`);
    if (events.length > 0) {
      events.forEach((event, index) => {
        const title = event.tags?.find(t => t[0] === 'title')?.[1] || 'No title';
        const board = event.tags?.find(t => t[0] === 'board')?.[1] || 'No board';
        console.log(`    ${index + 1}. "${title}" (Board: ${board})`);
      });
    }
  });

  console.log('\n🔍 getEvents Results:');
  Object.entries(getResults).forEach(([key, events]) => {
    console.log(`  ${key}: ${events.length} events`);
    if (events.length > 0) {
      events.forEach((event, index) => {
        const title = event.tags?.find(t => t[0] === 'title')?.[1] || 'No title';
        const board = event.tags?.find(t => t[0] === 'board')?.[1] || 'No board';
        console.log(`    ${index + 1}. "${title}" (Board: ${board})`);
      });
    }
  });

  // Find which approach gets our test thread
  const allEvents = [...queryResults.all, ...getResults.all];
  const testThreads = allEvents.filter(event => {
    const title = event.tags?.find(t => t[0] === 'title')?.[1] || '';
    return title.includes('TEST') || title.includes('Full Thread Flow') || title.includes('DEBUG');
  });

  console.log(`\n🎯 Found ${testThreads.length} test threads across all methods:`);
  testThreads.forEach((event, index) => {
    console.log(`  ${index + 1}. "${event.tags?.find(t => t[0] === 'title')?.[1]}"`);
    console.log(`     ID: ${event.id}`);
    console.log(`     Board: ${event.tags?.find(t => t[0] === 'board')?.[1]}`);
    console.log(`     Tags: ${JSON.stringify(event.tags, null, 2)}`);
  });

  // Determine the issue
  if (testThreads.length > 0) {
    console.log('\n✅ TEST THREADS FOUND! Issue is in local filtering/display.');
    console.log('\n💡 POTENTIAL FIXES:');
    console.log('1. Check if roomId matches board tag exactly');
    console.log('2. Verify filter syntax (array vs string)');
    console.log('3. Check for case sensitivity issues');
    console.log('4. Verify NostrContext is receiving events correctly');
    console.log('5. Check RoomPage component state updates');

    return {
      issue: 'local_filtering',
      testThreadsFound: testThreads.length,
      recommendedFix: 'modify RoomPage.js filters'
    };
  } else {
    console.log('\n❌ NO TEST THREADS FOUND EVEN IN RAW DATA');
    console.log('💡 POTENTIAL ISSUES:');
    console.log('1. Thread creation failed locally');
    console.log('2. Relay propagation delay');
    console.log('3. Different user/relay context');
    console.log('4. Event signing issues');

    return {
      issue: 'creation_or_relay',
      testThreadsFound: 0,
      recommendedFix: 'check thread creation process'
    };
  }
}

// Fix RoomPage filtering
function generateFixedRoomPage() {
  return `
// FIXED RoomPage.js - fetchThreads function
const fetchThreads = async () => {
  setLoading(true);
  try {
    // Try multiple filter approaches
    const filterOptions = [
      // Approach 1: Current (broken)
      {
        kinds: [30023],
        '#t': ['forum'],
        '#board': [roomId],
        limit: 100
      },
      // Approach 2: String instead of array
      {
        kinds: [30023],
        '#t': ['forum'],
        '#board': roomId, // String instead of array
        limit: 100
      },
      // Approach 3: Tags array format
      {
        kinds: [30023],
        tags: [
          ['t', 'forum'],
          ['board', roomId]
        ],
        limit: 100
      },
      // Approach 4: No board filter (fallback)
      {
        kinds: [30023],
        '#t': ['forum'],
        limit: 100
      }
    ];

    let events = [];

    // Try each approach until we get results
    for (let i = 0; i < filterOptions.length; i++) {
      console.log(\`Trying filter approach \${i + 1}...\`);
      const testEvents = await getEvents(filterOptions[i]);
      console.log(\`Approach \${i + 1} found \${testEvents.length} events\`);

      if (testEvents.length > 0) {
        events = testEvents;
        break;
      }
    }

    // If still no events, try without board filter
    if (events.length === 0) {
      console.log('Trying without board filter...');
      events = await getEvents({
        kinds: [30023],
        '#t': ['forum'],
        limit: 100
      });
    }

    // Filter by board client-side if needed
    if (events.length > 0) {
      const boardFiltered = events.filter(event => {
        const boardTag = event.tags?.find(t => t[0] === 'board')?.[1];
        return boardTag === roomId || !boardTag; // Include events without board tag as fallback
      });
      console.log(\`Board filtered: \${boardFiltered.length} from \${events.length} total\`);
      events = boardFiltered;
    }

    // Apply sorting
    switch (sortBy) {
      case 'latest':
        events.sort((a, b) => b.created_at - a.created_at);
        break;
      case 'oldest':
        events.sort((a, b) => a.created_at - b.created_at);
        break;
      case 'replies':
        events.sort((a, b) => {
          const aReplies = a.tags.find(tag => tag[0] === 'reply_count')?.[1] || 0;
          const bReplies = b.tags.find(tag => tag[0] === 'reply_count')?.[1] || 0;
          return parseInt(bReplies) - parseInt(aReplies);
        });
        break;
    }

    setThreads(events);
  } catch (error) {
    console.error('Error fetching threads:', error);
  } finally {
    setLoading(false);
  }
};
`;
}

// Main execution
async function runDiagnostics() {
  try {
    console.log('🚀 STARTING COMPREHENSIVE DIAGNOSTICS...');

    // Test 1: Query events directly
    const queryResults = await testQueryEvents();

    // Test 2: Test getEvents wrapper
    const getResults = await testGetEvents();

    // Test 3: Analyze results
    const analysis = analyzeResults(queryResults, getResults);

    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('='.repeat(40));

    if (analysis.issue === 'local_filtering') {
      console.log('✅ ISSUE IDENTIFIED: Local filtering problem');
      console.log('\n📝 IMMEDIATE FIX:');
      console.log('1. Open RoomPage.js');
      console.log('2. Replace fetchThreads function with the generated version');
      console.log('3. The fix tries multiple filter approaches');
      console.log('4. Includes client-side board filtering as fallback');

      // Generate fixed code
      console.log('\n📄 FIXED CODE:');
      console.log(generateFixedRoomPage());

      console.log('\n🔧 ALTERNATIVE QUICK FIX:');
      console.log('Temporarily remove board filter to see all threads:');
      console.log('Change line ~40 in RoomPage.js to:');
      console.log('const filters = {');
      console.log('  kinds: [30023],');
      console.log('  "#t": ["forum"],');
      console.log('  limit: 100');
      console.log('};');

    } else {
      console.log('❌ ISSUE NOT CLEAR: Check thread creation process');
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Apply the recommended fix');
    console.log('2. Restart development server');
    console.log('3. Test thread creation again');
    console.log('4. Verify threads appear in local UI');
    console.log('5. Confirm cross-client compatibility maintained');

  } catch (error) {
    console.error('❌ Diagnostics failed:', error);
  }
}

// Run if in browser
if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser - starting diagnostics...');
  runDiagnostics();
} else {
  console.log('🖥️ Running in Node.js - this script requires browser environment');
  console.log('Load this script in browser console on the room page');
}
