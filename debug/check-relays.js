/**
 * DEBUG SCRIPT: Check Relay Events
 * This script helps diagnose why threads aren't appearing
 */

import {
  initializePool,
  queryEvents,
  getEvents,
} from "../app/lib/nostrClient.js";

import { DEFAULT_RELAYS } from "../app/lib/nostrClient.js";

console.log("🔍 DEBUGGING RELAY EVENTS");
console.log("=".repeat(50));

async function debugRelays() {
  try {
    // 1. Check relays connection
    console.log("\n📡 Checking relay connections...");
    const pool = await initializePool();
    console.log(`✅ Pool initialized with ${DEFAULT_RELAYS.length} relays:`);
    DEFAULT_RELAYS.forEach((relay, i) => {
      console.log(`   ${i + 1}. ${relay}`);
    });

    // 2. Query all recent forum threads
    console.log("\n🧵 Querying recent forum threads...");
    const forumFilters = {
      kinds: [30023], // Long-form posts
      "#t": ["forum"],
      limit: 20,
    };

    const allForumEvents = await queryEvents(pool, undefined, forumFilters);
    console.log(`📊 Found ${allForumEvents.length} total forum threads:`);

    allForumEvents.forEach((event, index) => {
      const title = event.tags.find((t) => t[0] === "title")?.[1] || "No title";
      const board = event.tags.find((t) => t[0] === "board")?.[1] || "No board";
      const timestamp = new Date(event.created_at * 1000).toLocaleString();

      console.log(`\n   ${index + 1}. "${title}"`);
      console.log(`      ID: ${event.id}`);
      console.log(`      Board: ${board}`);
      console.log(`      Created: ${timestamp}`);
      console.log(
        `      Tags: ${event.tags.map((t) => `${t[0]}=${t[1]}`).join(", ")}`,
      );
    });

    // 3. Query specific to nostr-cafe board
    console.log("\n☕ Querying nostr-cafe board specifically...");
    const cafeFilters = {
      kinds: [30023],
      "#t": ["forum"],
      "#board": ["nostr-cafe"],
      limit: 10,
    };

    const cafeEvents = await queryEvents(pool, undefined, cafeFilters);
    console.log(`📊 Found ${cafeEvents.length} threads in nostr-cafe:`);

    cafeEvents.forEach((event, index) => {
      const title = event.tags.find((t) => t[0] === "title")?.[1] || "No title";
      const timestamp = new Date(event.created_at * 1000).toLocaleString();

      console.log(`\n   ${index + 1}. "${title}"`);
      console.log(`      ID: ${event.id}`);
      console.log(`      Created: ${timestamp}`);
    });

    // 4. Try alternative filter format
    console.log("\n🔄 Trying alternative filter format...");
    const altFilters = {
      kinds: [30023],
      "#t": ["forum"],
      "#board": "nostr-cafe", // String instead of array
      limit: 10,
    };

    const altEvents = await queryEvents(pool, undefined, altFilters);
    console.log(`📊 Alternative filter found ${altEvents.length} threads`);

    // 5. Check for events without board filter
    console.log("\n🌐 Querying all threads (no board filter)...");
    const allThreadsFilters = {
      kinds: [30023],
      limit: 50,
    };

    const allThreads = await queryEvents(pool, undefined, allThreadsFilters);
    console.log(`📊 Found ${allThreads.length} total threads of kind 30023:`);

    // Look for any test thread
    const testThreads = allThreads.filter((event) => {
      const title = event.tags.find((t) => t[0] === "title")?.[1] || "";
      return title.includes("TEST") || title.includes("Full Thread Flow");
    });

    console.log(`🎯 Found ${testThreads.length} test threads:`);
    testThreads.forEach((event, index) => {
      const title = event.tags.find((t) => t[0] === "title")?.[1] || "No title";
      const board = event.tags.find((t) => t[0] === "board")?.[1] || "No board";

      console.log(`\n   ${index + 1}. "${title}"`);
      console.log(`      ID: ${event.id}`);
      console.log(`      Board: ${board}`);
      console.log(`      Tags: ${JSON.stringify(event.tags, null, 2)}`);
    });

    // 6. Test getEvents function directly
    console.log("\n🔧 Testing getEvents function directly...");
    const directEvents = await getEvents({
      kinds: [30023],
      "#t": ["forum"],
      "#board": ["nostr-cafe"],
      limit: 10,
    });
    console.log(`📊 getEvents found ${directEvents.length} threads`);

    return {
      totalForumEvents: allForumEvents.length,
      cafeEvents: cafeEvents.length,
      altEvents: altEvents.length,
      allThreads: allThreads.length,
      testThreads: testThreads.length,
      directEvents: directEvents.length,
    };
  } catch (error) {
    console.error("❌ Debug script failed:", error);
    throw error;
  }
}

// Run debug
debugRelays()
  .then((results) => {
    console.log("\n📋 SUMMARY RESULTS:");
    console.log(`   Total forum events: ${results.totalForumEvents}`);
    console.log(`   Nostr-cafe events: ${results.cafeEvents}`);
    console.log(`   Alternative filter: ${results.altEvents}`);
    console.log(`   All threads: ${results.allThreads}`);
    console.log(`   Test threads: ${results.testThreads}`);
    console.log(`   getEvents direct: ${results.directEvents}`);

    if (results.testThreads === 0) {
      console.log("\n⚠️  No test threads found. Possible causes:");
      console.log("   • Thread was not published successfully");
      console.log("   • Thread was published but not relayed");
      console.log("   • Thread has different tag structure");
      console.log("   • Authentication issue during publishing");
    } else {
      console.log("\n✅ Test threads found! Issue may be in UI filtering.");
    }
  })
  .catch((error) => {
    console.error("💥 Debug script failed completely:", error);
  });
