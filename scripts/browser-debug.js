/**
 * BROWSER DEBUG SCRIPT
 * Run this in browser console on http://localhost:3000/room/nostr-cafe
 * Paste this script directly into browser console (F12)
 */

console.log('🔍 BROWSER DEBUG - Thread Creation Issues');
console.log('='.repeat(60));

async function debugInBrowser() {
  try {
    // 1. Check authentication status
    console.log('\n🔐 Checking authentication...');
    const privateKey = localStorage.getItem('nostr_private_key');
    if (privateKey) {
      console.log('✅ Private key found');
      console.log(`Length: ${privateKey.length} characters`);
      console.log(`Preview: ${privateKey.substring(0, 16)}...`);
    } else {
      console.log('❌ No private key found in localStorage');
      console.log('You need to connect your Nostr account first');
    }

    // 2. Check for browser extension
    console.log('\n🔌 Checking for Nostr extension...');
    if (window.nostr) {
      console.log('✅ Nostr extension detected');
      try {
        const pubkey = await window.nostr.getPublicKey();
        console.log(`Extension pubkey: ${pubkey?.substring(0, 16)}...`);
      } catch (e) {
        console.log('❌ Extension pubkey error:', e.message);
      }
    } else {
      console.log('❌ No Nostr extension detected');
      console.log('Consider installing a Nostr extension like nos2x or Alby');
    }

    // 3. Check React state and context
    console.log('\n⚛️ Checking React state...');
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✅ React DevTools detected');

      // Try to access React state
      const roots = document.querySelectorAll('[data-reactroot]');
      console.log(`Found ${roots.length} React roots`);

      if (roots.length > 0) {
        // Look for thread data
        console.log('Checking for thread data in React components...');

        // Check if threads are being fetched
        const threadCards = document.querySelectorAll('a[href*="/thread/"]');
        console.log(`Found ${threadCards.length} thread cards in DOM`);

        threadCards.forEach((card, index) => {
          const href = card.getAttribute('href');
          const titleElement = card.querySelector('h3, .font-semibold');
          const title = titleElement ? titleElement.textContent.trim() : 'No title found';

          console.log(`\nThread ${index + 1}:`);
          console.log(`  Title: "${title}"`);
          console.log(`  Href: ${href}`);

          if (title.includes('TEST') || title.includes('Full Thread Flow')) {
            console.log('  🎯 FOUND OUR TEST THREAD!');
            console.log(`  Full href: http://localhost:3000${href}`);
          }
        });
      }
    } else {
      console.log('❌ React DevTools not available');
    }

    // 4. Monitor network requests
    console.log('\n🌐 Monitoring network requests...');
    const originalFetch = window.fetch;
    let nostrRequests = [];

    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string') {
        if (url.includes('wss://') || url.includes('nostr')) {
          nostrRequests.push({url, timestamp: Date.now()});
          console.log(`📡 Nostr request: ${url}`);
        }
      }
      return originalFetch.apply(this, args);
    };

    // 5. Check WebSocket connections
    console.log('\n🔌 Checking WebSocket connections...');
    setTimeout(() => {
      if (window.WebSocket) {
        console.log('✅ WebSocket available');

        // Monitor new WebSocket connections
        const originalWS = window.WebSocket;
        let wsConnections = [];

        window.WebSocket = function(url, protocols) {
          if (url.includes('wss://') || url.includes('nostr')) {
            console.log(`🔌 WebSocket connecting: ${url}`);
            wsConnections.push({url, timestamp: Date.now()});
          }
          return new originalWS(url, protocols);
        };

        console.log(`📊 WebSocket monitoring setup complete`);
      }
    }, 100);

    // 6. Check current page's thread fetching
    console.log('\n📋 Checking current page state...');
    const roomTitle = document.querySelector('h1');
    if (roomTitle) {
      console.log(`✅ Current room: "${roomTitle.textContent}"`);
    }

    const createButton = document.querySelector('a[href*="/new"]');
    if (createButton) {
      console.log('✅ Create Thread button found');
    } else {
      console.log('❌ Create Thread button not found');
    }

    const loadingElements = document.querySelectorAll('.loading');
    console.log(`📊 Found ${loadingElements.length} loading indicators`);

    // 7. Try to trigger thread fetch manually
    console.log('\n🔄 Testing manual thread fetch...');
    setTimeout(() => {
      // Simulate clicking refresh or reload
      const refreshButton = document.querySelector('button[title="Refresh"], .btn-outline');
      if (refreshButton) {
        console.log('🔄 Found refresh button, you can click it to reload threads');
      }

      console.log('\n📝 Manual debugging steps:');
      console.log('1. Try creating a new thread');
      console.log('2. Check browser network tab for WebSocket connections');
      console.log('3. Look for errors in console');
      console.log('4. Check if thread appears after 30 seconds');
      console.log('5. Try refreshing the page');

      console.log('\n🎯 To create test thread:');
      console.log('1. Click "Create New Thread"');
      console.log('2. Fill title: "TEST: Full Thread Flow Verification"');
      console.log('3. Fill content with test data (see instructions)');
      console.log('4. Click "Publish Thread"');
      console.log('5. Wait for success message');
      console.log('6. Check if thread appears in list');
      console.log('7. If not, check console for errors');

    }, 2000);

    return {
      hasPrivateKey: !!privateKey,
      hasExtension: !!window.nostr,
      threadCount: document.querySelectorAll('a[href*="/thread/"]').length,
      wsMonitoring: true,
      nostrRequests: nostrRequests.length
    };

  } catch (error) {
    console.error('❌ Debug script failed:', error);
    return { error: error.message };
  }
}

// Run the debug
debugInBrowser()
  .then(results => {
    console.log('\n📊 DEBUG SUMMARY:');
    console.log(`Private key: ${results.hasPrivateKey ? '✅' : '❌'}`);
    console.log(`Extension: ${results.hasExtension ? '✅' : '❌'}`);
    console.log(`Current threads: ${results.threadCount}`);
    console.log(`WS monitoring: ${results.wsMonitoring ? '✅' : '❌'}`);
    console.log(`Nostr requests: ${results.nostrRequests}`);

    if (!results.hasPrivateKey) {
      console.log('\n🔐 SOLUTION: Go to http://localhost:3000 and connect your Nostr account');
      console.log('   - Click "Connect Account" or "Generate New Key"');
      console.log('   - Then return to room page');
    }

    if (results.threadCount === 0) {
      console.log('\n📋 NO THREADS FOUND:');
      console.log('   - Check authentication status');
      console.log('   - Verify relay connections');
      console.log('   - Try creating a new test thread');
      console.log('   - Wait and refresh page');
    }

    console.log('\n🔧 CONTINUE MONITORING:');
    console.log('   - Network requests are being tracked');
    console.log('   - WebSocket connections are monitored');
    console.log('   - Try creating a thread now');
  })
  .catch(error => {
    console.error('💥 Debug setup failed:', error);
    console.log('💡 Try running this in the browser console instead');
  });

console.log('\n💡 DEBUG SCRIPT LOADED');
console.log('🔄 Check results above in a few seconds');
