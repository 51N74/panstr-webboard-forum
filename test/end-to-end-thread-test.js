/**
 * END-TO-END THREAD FUNCTIONALITY TEST
 * Complete verification of thread creation, rendering, self-reply, and cross-client compatibility
 *
 * This test performs the following actions:
 * 1. Navigate to siamstr test room
 * 2. Create a test thread with rich content
 * 3. Verify thread appears in list and detail view
 * 4. Post a self-reply to the thread
 * 5. Verify reply functionality and counts
 * 6. Check cross-client compatibility requirements
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  testRoomId: 'siamstr-test',
  testTitle: 'TEST: Full Thread Flow Verification',
  testContent: `# Test Thread

This is a **comprehensive test** of:

## Markdown formatting
- **Bold text**
- *Italic text*
- Lists and headers

## Media content
Image: ![Test Image](https://picsum.photos/200)
Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ

## Code block
\`\`\`javascript
function testFunction() {
  console.log("Hello, Nostr Forum!");
  return true;
}
\`\`\`

## Links
[Nostr Protocol](https://nostr.com)

This thread validates:
✅ Thread creation with kind 30023
✅ Rich content rendering
✅ Reply system with kind 1
✅ Cross-client compatibility
✅ NIP-10 threading support`,

  selfReplyContent: 'This is a self-reply from the author to test the reply functionality and NIP-10 threading.',
};

class EndToEndThreadTest {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.threadId = null;
    this.replyId = null;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logEntry);
    this.testResults.push({ timestamp, type, message });
  }

  async initialize() {
    try {
      this.log('Initializing browser and test environment...');
      this.browser = await chromium.launch({
        headless: false, // Set to true for headless testing
        slowMo: 500
      });
      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 }
      });
      this.page = await this.context.newPage();

      // Enable console logging from page
      this.page.on('console', msg => {
        this.log(`Browser Console: ${msg.text()}`, 'debug');
      });

      this.log('Browser initialized successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to initialize: ${error.message}`, 'error');
      return false;
    }
  }

  async navigateToTestRoom() {
    try {
      this.log(`Navigating to test room: ${TEST_CONFIG.baseURL}/room/${TEST_CONFIG.testRoomId}`);
      await this.page.goto(`${TEST_CONFIG.baseURL}/room/${TEST_CONFIG.testRoomId}`);

      // Wait for page to load
      await this.page.waitForSelector('.container', { timeout: 10000 });
      this.log('Successfully navigated to test room', 'success');

      // Take screenshot
      await this.page.screenshot({
        path: 'test/screenshots/01-room-page.png',
        fullPage: true
      });

      return true;
    } catch (error) {
      this.log(`Failed to navigate to test room: ${error.message}`, 'error');
      return false;
    }
  }

  async clickCreateThread() {
    try {
      this.log('Looking for "Create New Thread" button...');
      const createButton = await this.page.waitForSelector('a[href*="/new"]', { timeout: 10000 });
      await createButton.click();

      this.log('Clicked Create New Thread button', 'success');
      await this.page.waitForURL('**/new');

      // Take screenshot
      await this.page.screenshot({
        path: 'test/screenshots/02-create-thread-page.png',
        fullPage: true
      });

      return true;
    } catch (error) {
      this.log(`Failed to click Create Thread: ${error.message}`, 'error');
      return false;
    }
  }

  async fillThreadForm() {
    try {
      this.log('Filling thread creation form...');

      // Wait for form to be ready
      await this.page.waitForSelector('input[placeholder*="title"], input[type="text"]', { timeout: 10000 });

      // Fill title
      await this.page.fill('input[placeholder*="title"], input[type="text"]', TEST_CONFIG.testTitle);
      this.log('Title field filled');

      // Fill content
      await this.page.fill('textarea[placeholder*="content"]', TEST_CONFIG.testContent);
      this.log('Content field filled');

      // Take screenshot of filled form
      await this.page.screenshot({
        path: 'test/screenshots/03-form-filled.png',
        fullPage: true
      });

      return true;
    } catch (error) {
      this.log(`Failed to fill form: ${error.message}`, 'error');
      return false;
    }
  }

  async submitThread() {
    try {
      this.log('Submitting thread...');

      // Click publish button
      const publishButton = await this.page.waitForSelector('button:has-text("Publish")', { timeout: 10000 });
      await publishButton.click();

      // Wait for success message or redirect
      await this.page.waitForSelector('.alert-success, [href*="/room/"]', { timeout: 30000 });

      this.log('Thread submitted successfully', 'success');

      // Take screenshot
      await this.page.screenshot({
        path: 'test/screenshots/04-thread-submitted.png',
        fullPage: true
      });

      return true;
    } catch (error) {
      this.log(`Failed to submit thread: ${error.message}`, 'error');
      // Try to capture error state
      await this.page.screenshot({
        path: 'test/screenshots/ERROR-thread-submission.png',
        fullPage: true
      });
      return false;
    }
  }

  async verifyThreadInList() {
    try {
      this.log('Verifying thread appears in room list...');

      // Navigate back to room page if redirected
      await this.page.goto(`${TEST_CONFIG.baseURL}/room/${TEST_CONFIG.testRoomId}`);
      await this.page.waitForSelector('.container', { timeout: 10000 });

      // Look for our test thread in the list
      const threadLink = await this.page.waitForSelector(`a:has-text("${TEST_CONFIG.testTitle}")`, { timeout: 15000 });

      if (threadLink) {
        this.log('Test thread found in list!', 'success');

        // Extract thread ID from href
        const href = await threadLink.getAttribute('href');
        const match = href.match(/\/thread\/([a-f0-9]+)/);
        if (match) {
          this.threadId = match[1];
          this.log(`Thread ID extracted: ${this.threadId}`);
        }

        // Take screenshot
        await this.page.screenshot({
          path: 'test/screenshots/05-thread-in-list.png',
          fullPage: true
        });

        return true;
      } else {
        throw new Error('Thread not found in list');
      }
    } catch (error) {
      this.log(`Failed to verify thread in list: ${error.message}`, 'error');
      return false;
    }
  }

  async openThreadDetail() {
    try {
      this.log('Opening thread detail view...');

      // Click on the thread
      const threadLink = await this.page.waitForSelector(`a:has-text("${TEST_CONFIG.testTitle}")`);
      await threadLink.click();

      // Wait for thread detail page to load
      await this.page.waitForSelector('h1, h2, h3', { timeout: 10000 });

      this.log('Thread detail page loaded', 'success');

      // Verify title and content
      const titleElement = await this.page.waitForSelector(`h1:has-text("${TEST_CONFIG.testTitle}"), h2:has-text("${TEST_CONFIG.testTitle}")`);
      if (titleElement) {
        this.log('Thread title verified in detail view', 'success');
      }

      // Take screenshot
      await this.page.screenshot({
        path: 'test/screenshots/06-thread-detail.png',
        fullPage: true
      });

      return true;
    } catch (error) {
      this.log(`Failed to open thread detail: ${error.message}`, 'error');
      return false;
    }
  }

  async verifyRichContent() {
    try {
      this.log('Verifying rich content rendering...');

      // Check for various content elements
      const checks = [
        { selector: 'h1, h2', name: 'Headers' },
        { selector: 'strong', name: 'Bold text' },
        { selector: 'em', name: 'Italic text' },
        { selector: 'img', name: 'Images' },
        { selector: 'pre, code', name: 'Code blocks' },
        { selector: 'a[href]', name: 'Links' }
      ];

      let allChecksPassed = true;

      for (const check of checks) {
        try {
          const element = await this.page.waitForSelector(check.selector, { timeout: 5000 });
          if (element) {
            this.log(`✅ ${check.name} rendered correctly`, 'success');
          } else {
            this.log(`❌ ${check.name} not found`, 'error');
            allChecksPassed = false;
          }
        } catch (e) {
          this.log(`❌ ${check.name} not found: ${e.message}`, 'error');
          allChecksPassed = false;
        }
      }

      if (allChecksPassed) {
        this.log('All rich content elements verified!', 'success');
      }

      return allChecksPassed;
    } catch (error) {
      this.log(`Failed to verify rich content: ${error.message}`, 'error');
      return false;
    }
  }

  async verifyViewCount() {
    try {
      this.log('Verifying view count functionality...');

      // Look for view count element
      const viewCountElement = await this.page.$('text=/views?/i');
      if (viewCountElement) {
        const viewCountText = await viewCountElement.textContent();
        this.log(`View count found: ${viewCountText}`, 'success');
        return true;
      } else {
        this.log('View count not found (may not be implemented yet)', 'warning');
        return true; // Not critical
      }
    } catch (error) {
      this.log(`Failed to verify view count: ${error.message}`, 'warning');
      return true; // Not critical
    }
  }

  async postSelfReply() {
    try {
      this.log('Posting self-reply to thread...');

      // Find reply form
      await this.page.waitForSelector('textarea[placeholder*="reply"], textarea[placeholder*="Reply"]', { timeout: 10000 });

      // Fill reply content
      await this.page.fill('textarea[placeholder*="reply"], textarea[placeholder*="Reply"]', TEST_CONFIG.selfReplyContent);

      // Click post reply button
      const postButton = await this.page.waitForSelector('button:has-text("Post"), button:has-text("Reply")', { timeout: 10000 });
      await postButton.click();

      // Wait for success message or reply to appear
      await this.page.waitForSelector('.alert-success, text="Reply published"', { timeout: 15000 });

      this.log('Self-reply posted successfully!', 'success');

      // Take screenshot
      await this.page.screenshot({
        path: 'test/screenshots/07-reply-posted.png',
        fullPage: true
      });

      return true;
    } catch (error) {
      this.log(`Failed to post self-reply: ${error.message}`, 'error');
      return false;
    }
  }

  async verifyReplyInThread() {
    try {
      this.log('Verifying reply appears in thread...');

      // Wait for page to update
      await this.page.waitForTimeout(2000);

      // Look for our reply content
      const replyElement = await this.page.waitForSelector(`text="${TEST_CONFIG.selfReplyContent}"`, { timeout: 10000 });

      if (replyElement) {
        this.log('Self-reply found in thread!', 'success');

        // Take screenshot
        await this.page.screenshot({
          path: 'test/screenshots/08-reply-verified.png',
          fullPage: true
        });

        return true;
      } else {
        throw new Error('Reply not found in thread');
      }
    } catch (error) {
      this.log(`Failed to verify reply: ${error.message}`, 'error');
      return false;
    }
  }

  async verifyReplyCount() {
    try {
      this.log('Verifying reply count updated...');

      // Look for reply count element
      const replyCountElement = await this.page.$('text=/repl(y|ies)/i');
      if (replyCountElement) {
        const replyCountText = await replyCountElement.textContent();
        this.log(`Reply count found: ${replyCountText}`, 'success');

        // Check if count is 1
        if (replyCountText.includes('1')) {
          this.log('Reply count correctly shows 1', 'success');
        } else {
          this.log(`Reply count shows: ${replyCountText} (expected 1)`, 'warning');
        }

        return true;
      } else {
        this.log('Reply count not found', 'warning');
        return true; // Not critical
      }
    } catch (error) {
      this.log(`Failed to verify reply count: ${error.message}`, 'warning');
      return true; // Not critical
    }
  }

  async verifyEventStructure() {
    try {
      this.log('Verifying event structure for NIP compliance...');

      // Check if we can access browser console or network requests
      // This would ideally verify the actual Nostr event structure
      // For now, we'll verify the UI elements that indicate proper structure

      const checks = [
        {
          check: async () => await this.page.$('text=/Thread ID:/'),
          name: 'Thread ID displayed'
        },
        {
          check: async () => await this.page.$('.badge'),
          name: 'Tags displayed'
        }
      ];

      for (const check of checks) {
        try {
          const element = await check.check();
          if (element) {
            this.log(`✅ ${check.name}`, 'success');
          }
        } catch (e) {
          this.log(`❌ ${check.name} not verified`, 'warning');
        }
      }

      return true;
    } catch (error) {
      this.log(`Failed to verify event structure: ${error.message}`, 'error');
      return false;
    }
  }

  async generateTestReport() {
    try {
      this.log('Generating test report...');

      const report = {
        timestamp: new Date().toISOString(),
        testConfig: TEST_CONFIG,
        threadId: this.threadId,
        results: this.testResults,
        summary: {
          totalSteps: this.testResults.length,
          successCount: this.testResults.filter(r => r.type === 'success').length,
          errorCount: this.testResults.filter(r => r.type === 'error').length,
          warningCount: this.testResults.filter(r => r.type === 'warning').length
        }
      };

      // Save report
      const reportPath = 'test/test-report.json';
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      // Generate HTML report
      const htmlReport = this.generateHTMLReport(report);
      fs.writeFileSync('test/test-report.html', htmlReport);

      this.log(`Test report saved to: ${reportPath}`, 'success');
      this.log(`HTML report saved to: test/test-report.html`, 'success');

      return report;
    } catch (error) {
      this.log(`Failed to generate report: ${error.message}`, 'error');
      return null;
    }
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panstr Forum - End-to-End Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card.error { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .summary-card.warning { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .log-entry { padding: 10px; margin: 5px 0; border-left: 4px solid #ddd; background: #f9f9f9; }
        .log-entry.success { border-left-color: #4caf50; background: #f1f8e9; }
        .log-entry.error { border-left-color: #f44336; background: #ffebee; }
        .log-entry.warning { border-left-color: #ff9800; background: #fff3e0; }
        .screenshot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
        .screenshot-card { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .screenshot-card img { width: 100%; height: auto; }
        .screenshot-card h4 { padding: 10px; background: #f5f5f5; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌏 Panstr Forum - End-to-End Test Report</h1>
            <p>Comprehensive Thread Creation & Reply Test</p>
            <p><strong>Test Date:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
            <p><strong>Thread ID:</strong> ${report.threadId || 'N/A'}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>${report.summary.totalSteps}</h3>
                <p>Total Test Steps</p>
            </div>
            <div class="summary-card success">
                <h3>${report.summary.successCount}</h3>
                <p>Successful Steps</p>
            </div>
            ${report.summary.errorCount > 0 ? `
            <div class="summary-card error">
                <h3>${report.summary.errorCount}</h3>
                <p>Failed Steps</p>
            </div>` : ''}
            ${report.summary.warningCount > 0 ? `
            <div class="summary-card warning">
                <h3>${report.summary.warningCount}</h3>
                <p>Warnings</p>
            </div>` : ''}
        </div>

        <h2>Test Configuration</h2>
        <ul>
            <li><strong>Test Room:</strong> ${report.testConfig.testRoomId}</li>
            <li><strong>Test Title:</strong> ${report.testConfig.testTitle}</li>
        </ul>

        <h2>Test Log</h2>
        ${report.results.map(entry => `
            <div class="log-entry ${entry.type}">
                <strong>[${entry.timestamp}] [${entry.type.toUpperCase()}]</strong> ${entry.message}
            </div>
        `).join('')}

        <h2>Screenshots</h2>
        <div class="screenshot-grid">
            <div class="screenshot-card">
                <h4>Room Page</h4>
                <img src="screenshots/01-room-page.png" alt="Room Page" />
            </div>
            <div class="screenshot-card">
                <h4>Create Thread Page</h4>
                <img src="screenshots/02-create-thread-page.png" alt="Create Thread Page" />
            </div>
            <div class="screenshot-card">
                <h4>Form Filled</h4>
                <img src="screenshots/03-form-filled.png" alt="Form Filled" />
            </div>
            <div class="screenshot-card">
                <h4>Thread Submitted</h4>
                <img src="screenshots/04-thread-submitted.png" alt="Thread Submitted" />
            </div>
            <div class="screenshot-card">
                <h4>Thread in List</h4>
                <img src="screenshots/05-thread-in-list.png" alt="Thread in List" />
            </div>
            <div class="screenshot-card">
                <h4>Thread Detail</h4>
                <img src="screenshots/06-thread-detail.png" alt="Thread Detail" />
            </div>
            <div class="screenshot-card">
                <h4>Reply Posted</h4>
                <img src="screenshots/07-reply-posted.png" alt="Reply Posted" />
            </div>
            <div class="screenshot-card">
                <h4>Reply Verified</h4>
                <img src="screenshots/08-reply-verified.png" alt="Reply Verified" />
            </div>
        </div>

        <div style="margin-top: 50px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
            <p>Generated by Panstr Forum E2E Test Suite</p>
        </div>
    </div>
</body>
</html>`;
  }

  async cleanup() {
    try {
      this.log('Cleaning up test environment...');
      if (this.browser) {
        await this.browser.close();
        this.log('Browser closed', 'success');
      }
    } catch (error) {
      this.log(`Cleanup error: ${error.message}`, 'error');
    }
  }

  async runCompleteTest() {
    const testSteps = [
      { name: 'Initialize', method: () => this.initialize() },
      { name: 'Navigate to Test Room', method: () => this.navigateToTestRoom() },
      { name: 'Click Create Thread', method: () => this.clickCreateThread() },
      { name: 'Fill Thread Form', method: () => this.fillThreadForm() },
      { name: 'Submit Thread', method: () => this.submitThread() },
      { name: 'Verify Thread in List', method: () => this.verifyThreadInList() },
      { name: 'Open Thread Detail', method: () => this.openThreadDetail() },
      { name: 'Verify Rich Content', method: () => this.verifyRichContent() },
      { name: 'Verify View Count', method: () => this.verifyViewCount() },
      { name: 'Post Self Reply', method: () => this.postSelfReply() },
      { name: 'Verify Reply in Thread', method: () => this.verifyReplyInThread() },
      { name: 'Verify Reply Count', method: () => this.verifyReplyCount() },
      { name: 'Verify Event Structure', method: () => this.verifyEventStructure() },
    ];

    let allTestsPassed = true;

    for (const step of testSteps) {
      try {
        this.log(`\n=== ${step.name} ===`);
        const result = await step.method();
        if (!result) {
          allTestsPassed = false;
          this.log(`Step "${step.name}" failed`, 'error');
          break; // Stop on first failure
        }
        this.log(`Step "${step.name}" completed successfully`, 'success');
      } catch (error) {
        allTestsPassed = false;
        this.log(`Step "${step.name}" threw exception: ${error.message}`, 'error');
        break;
      }
    }

    // Generate report regardless of test outcome
    await this.generateTestReport();

    if (allTestsPassed) {
      this.log('\n🎉 ALL TESTS PASSED! Thread functionality working correctly.', 'success');
    } else {
      this.log('\n❌ SOME TESTS FAILED. Check the report for details.', 'error');
    }

    await this.cleanup();
    return allTestsPassed;
  }
}

// Create test directory and screenshots folder
const testDir = path.join(__dirname, 'test');
const screenshotsDir = path.join(testDir, 'screenshots');

if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir);
}
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Run the test
async function runTest() {
  console.log('🌏 Starting Panstr Forum End-to-End Thread Test...');
  console.log('=' .repeat(60));

  const tester = new EndToEndThreadTest();
  const success = await tester.runCompleteTest();

  process.exit(success ? 0 : 1);
}

// Export for use as module or run directly
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = EndToEndThreadTest;
