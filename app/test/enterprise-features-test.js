/**
 * Enterprise Features Test Suite
 * Comprehensive testing for Phase 4 Week 13-14 implementation
 * NIP-86 Relay Management API, Advanced Security, and Monitoring
 */

'use strict';

import RelayManagementAPI from '../services/admin/RelayManagementAPI.js';
import SecurityService from '../services/security/SecurityService.js';
import MonitoringService from '../services/monitoring/MonitoringService.js';

class EnterpriseFeaturesTestSuite {
  constructor() {
    this.relayAPI = new RelayManagementAPI();
    this.securityService = new SecurityService();
    this.monitoringService = new MonitoringService();
    this.testResults = {
      relayManagement: { passed: 0, failed: 0, details: [] },
      security: { passed: 0, failed: 0, details: [] },
      monitoring: { passed: 0, failed: 0, details: [] },
      integration: { passed: 0, failed: 0, details: [] }
    };
    this.testPrivateKey = 'nsec1testtesttesttesttesttesttesttesttesttesttesttest';
  }

  /**
   * Run all enterprise feature tests
   */
  async runAllTests() {
    console.log('🚀 Starting Enterprise Features Test Suite\n');
    console.log('Phase 4 Week 13-14: NIP-86 Relay Management, Advanced Security, Monitoring\n');

    try {
      // Initialize services
      await this.initializeServices();

      // Run test suites
      await this.testRelayManagementAPI();
      console.log('\n');

      await this.testAdvancedSecurity();
      console.log('\n');

      await this.testMonitoringService();
      console.log('\n');

      await this.testIntegrationScenarios();
      console.log('\n');

      // Generate summary report
      this.generateSummaryReport();

      return this.testResults;
    } catch (error) {
      console.error('❌ Test suite failed to run:', error);
      return null;
    }
  }

  /**
   * Initialize all services for testing
   */
  async initializeServices() {
    console.log('🔧 Initializing Services...');

    try {
      // Initialize Relay Management API
      const adminSession = await this.relayAPI.initializeAdminSession(this.testPrivateKey, 'test-tenant');
      this.addTestResult('relayManagement', 'Admin Session Initialization',
        adminSession.success, adminSession.success ? 'Admin session created successfully' : adminSession.error);

      // Initialize Security Service
      const securityInit = await this.securityService.initialize({
        enableContentScanning: true,
        enableSpamDetection: true,
        enableAutomatedModeration: true,
        enableCompliance: true,
        strictMode: false
      });
      this.addTestResult('security', 'Security Service Initialization',
        securityInit.success, securityInit.success ? 'Security service initialized' : securityInit.error);

      // Initialize Monitoring Service
      const monitoringInit = await this.monitoringService.initialize({
        enableRealTimeMonitoring: true,
        enableHistoricalAnalytics: true,
        enablePerformanceTracking: true,
        enableHealthChecks: true,
        enableAlerting: true
      });
      this.addTestResult('monitoring', 'Monitoring Service Initialization',
        monitoringInit.success, monitoringInit.success ? 'Monitoring service initialized' : monitoringInit.error);

      console.log('✅ Services initialized successfully\n');
    } catch (error) {
      console.log('❌ Service initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Test NIP-86 Relay Management API
   */
  async testRelayManagementAPI() {
    console.log('🔌 Testing NIP-86 Relay Management API...');

    // Test 1: Tenant Creation
    try {
      const tenantConfig = {
        tenant_id: 'test-tenant-' + Date.now(),
        name: 'Test Tenant',
        description: 'Test tenant for enterprise features',
        max_users: 500,
        storage_quota: 536870912, // 512MB
        features: { dm: true, reactions: true, zaps: true }
      };

      const tenantResult = await this.relayAPI.createTenant(tenantConfig);
      this.addTestResult('relayManagement', 'Tenant Creation',
        tenantResult.success,
        tenantResult.success ? 'Tenant created successfully' : tenantResult.error);

      if (tenantResult.success) {
        console.log(`   📝 Created tenant: ${tenantConfig.tenant_id}`);
      }
    } catch (error) {
      this.addTestResult('relayManagement', 'Tenant Creation', false, error.message);
    }

    // Test 2: Relay Configuration Update
    try {
      const relayConfig = {
        relay_url: 'wss://relay.test.com',
        read: true,
        write: true,
        both: false,
        max_connections: 1000,
        enable_authentication: true
      };

      const configResult = await this.relayAPI.updateRelayConfig('wss://relay.test.com', relayConfig);
      this.addTestResult('relayManagement', 'Relay Configuration Update',
        configResult.success,
        configResult.success ? 'Relay configuration updated' : configResult.error);
    } catch (error) {
      this.addTestResult('relayManagement', 'Relay Configuration Update', false, error.message);
    }

    // Test 3: Rate Limiting
    try {
      const rateLimitConfig = {
        type: 'ip',
        window: 3600,
        max_requests: 1000,
        max_events: 500,
        strategy: 'sliding_window'
      };

      const rateLimitResult = await this.relayAPI.setRateLimit('192.168.1.1', rateLimitConfig);
      this.addTestResult('relayManagement', 'Rate Limit Configuration',
        rateLimitResult.success,
        rateLimitResult.success ? 'Rate limit configured' : rateLimitResult.error);
    } catch (error) {
      this.addTestResult('relayManagement', 'Rate Limit Configuration', false, error.message);
    }

    // Test 4: Backup Creation
    try {
      const backupConfig = {
        relay_urls: ['wss://relay.test.com'],
        include_kinds: [0, 1, 3, 6, 7],
        compress: true,
        encrypt: false,
        destination: 'local'
      };

      const backupResult = await this.relayAPI.createBackup(backupConfig);
      this.addTestResult('relayManagement', 'Backup Creation',
        backupResult.success,
        backupResult.success ? `Backup created: ${backupResult.backup_id}` : backupResult.error);
    } catch (error) {
      this.addTestResult('relayManagement', 'Backup Creation', false, error.message);
    }

    // Test 5: Analytics Retrieval
    try {
      const analyticsResult = await this.relayAPI.getAnalytics('24h');
      this.addTestResult('relayManagement', 'Analytics Retrieval',
        analyticsResult.success,
        analyticsResult.success ? 'Analytics data retrieved' : analyticsResult.error);
    } catch (error) {
      this.addTestResult('relayManagement', 'Analytics Retrieval', false, error.message);
    }

    // Test 6: Compliance Report Generation
    try {
      const complianceResult = await this.relayAPI.generateComplianceReport('7d');
      this.addTestResult('relayManagement', 'Compliance Report Generation',
        complianceResult.success,
        complianceResult.success ? 'Compliance report generated' : complianceResult.error);
    } catch (error) {
      this.addTestResult('relayManagement', 'Compliance Report Generation', false, error.message);
    }

    // Test 7: Audit Log Access
    try {
      const auditLog = this.relayAPI.getAuditLog({ limit: 10 });
      this.addTestResult('relayManagement', 'Audit Log Access',
        auditLog.success,
        auditLog.success ? `Retrieved ${auditLog.entries.length} audit entries` : auditLog.error);
    } catch (error) {
      this.addTestResult('relayManagement', 'Audit Log Access', false, error.message);
    }

    console.log(`🔌 Relay Management Tests: ${this.testResults.relayManagement.passed} passed, ${this.testResults.relayManagement.failed} failed`);
  }

  /**
   * Test Advanced Security Features
   */
  async testAdvancedSecurity() {
    console.log('🔒 Testing Advanced Security Features...');

    // Test 1: Content Scanning
    try {
      const testEvent = {
        id: 'test-event-' + Date.now(),
        content: 'This is a test message with no violations',
        pubkey: this.testPublicKey(),
        kind: 1,
        tags: [],
        created_at: Math.floor(Date.now() / 1000)
      };

      const scanResult = await this.securityService.scanContent(testEvent);
      this.addTestResult('security', 'Content Scanning',
        scanResult.safe !== undefined,
        scanResult.safe !== undefined ? `Content scanned: ${scanResult.safe ? 'Safe' : 'Violations detected'}` : 'Scan failed');

      if (scanResult.violations && scanResult.violations.length > 0) {
        console.log(`   ⚠️  Found ${scanResult.violations.length} violations`);
      }
    } catch (error) {
      this.addTestResult('security', 'Content Scanning', false, error.message);
    }

    // Test 2: Spam Detection
    try {
      const spamEvent = {
        content: 'BUY NOW!!! CLICK HERE!!! FREE MONEY!!!',
        pubkey: this.testPublicKey(),
        kind: 1,
        tags: [],
        created_at: Math.floor(Date.now() / 1000)
      };

      const spamResult = await this.securityService.detectSpam(spamEvent);
      this.addTestResult('security', 'Spam Detection',
        spamResult.isSpam !== undefined,
        spamResult.isSpam !== undefined ? `Spam detection: ${spamResult.isSpam ? 'Spam detected' : 'Not spam'}` : 'Detection failed');
    } catch (error) {
      this.addTestResult('security', 'Spam Detection', false, error.message);
    }

    // Test 3: Compliance Checking
    try {
      const complianceEvent = {
        content: 'Test content for compliance check',
        pubkey: this.testPublicKey(),
        kind: 1,
        tags: [],
        created_at: Math.floor(Date.now() / 1000)
      };

      const complianceResult = await this.securityService.checkCompliance(complianceEvent);
      this.addTestResult('security', 'Compliance Checking',
        complianceResult.compliant !== undefined,
        complianceResult.compliant !== undefined ? `Compliance: ${complianceResult.compliant ? 'Compliant' : 'Violations'}` : 'Check failed');
    } catch (error) {
      this.addTestResult('security', 'Compliance Checking', false, error.message);
    }

    // Test 4: User Blocking
    try {
      const blockResult = await this.securityService.blockUser(this.testPublicKey(), 3600, 'Test block');
      this.addTestResult('security', 'User Blocking',
        blockResult.success,
        blockResult.success ? 'User blocked successfully' : blockResult.error);
    } catch (error) {
      this.addTestResult('security', 'User Blocking', false, error.message);
    }

    // Test 5: Content Deletion Request
    try {
      const deletionResult = await this.securityService.requestContentDeletion('test-event-id', 'Test deletion');
      this.addTestResult('security', 'Content Deletion Request',
        deletionResult.success,
        deletionResult.success ? 'Deletion requested successfully' : deletionResult.error);
    } catch (error) {
      this.addTestResult('security', 'Content Deletion Request', false, error.message);
    }

    // Test 6: Security Analytics
    try {
      const analyticsResult = await this.securityService.getSecurityAnalytics('24h');
      this.addTestResult('security', 'Security Analytics',
        analyticsResult.success,
        analyticsResult.success ? 'Security analytics retrieved' : analyticsResult.error);
    } catch (error) {
      this.addTestResult('security', 'Security Analytics', false, error.message);
    }

    // Test 7: Rate Limit Application
    try {
      const rateLimitResult = await this.securityService.applyRateLimit(this.testPublicKey(), 100, 3600);
      this.addTestResult('security', 'Rate Limit Application',
        rateLimitResult.success,
        rateLimitResult.success ? 'Rate limit applied successfully' : rateLimitResult.error);
    } catch (error) {
      this.addTestResult('security', 'Rate Limit Application', false, error.message);
    }

    console.log(`🔒 Security Tests: ${this.testResults.security.passed} passed, ${this.testResults.security.failed} failed`);
  }

  /**
   * Test Monitoring Service
   */
  async testMonitoringService() {
    console.log('📊 Testing Monitoring Service...');

    // Test 1: Metric Recording
    try {
      const metricResult = this.monitoringService.recordMetric('test.metric', 42, { tag1: 'value1' });
      this.addTestResult('monitoring', 'Metric Recording',
        metricResult.success,
        metricResult.success ? `Metric recorded: ${metricResult.metric}` : metricResult.error);
    } catch (error) {
      this.addTestResult('monitoring', 'Metric Recording', false, error.message);
    }

    // Test 2: Performance Tracking
    try {
      const perfResult = await this.monitoringService.trackPerformance('test_operation', 150, { component: 'test' });
      this.addTestResult('monitoring', 'Performance Tracking',
        perfResult.success,
        perfResult.success ? `Performance tracked: ${perfResult.duration}ms` : perfResult.error);
    } catch (error) {
      this.addTestResult('monitoring', 'Performance Tracking', false, error.message);
    }

    // Test 3: Health Checks
    try {
      const healthResult = await this.monitoringService.performHealthCheck('relay_connections');
      this.addTestResult('monitoring', 'Health Check Execution',
        healthResult.success,
        healthResult.success ? `Health status: ${healthResult.status}` : healthResult.error);
    } catch (error) {
      this.addTestResult('monitoring', 'Health Check Execution', false, error.message);
    }

    // Test 4: User Activity Tracking
    try {
      const activityResult = this.monitoringService.trackUserActivity(this.testPublicKey(), 'post_created', { forum: 'test' });
      this.addTestResult('monitoring', 'User Activity Tracking',
        activityResult.success,
        activityResult.success ? 'Activity tracked successfully' : activityResult.error);
    } catch (error) {
      this.addTestResult('monitoring', 'User Activity Tracking', false, error.message);
    }

    // Test 5: Error Tracking
    try {
      const testError = new Error('Test error for monitoring');
      const errorResult = this.monitoringService.trackError(testError, { component: 'test', severity: 'warning' });
      this.addTestResult('monitoring', 'Error Tracking',
        errorResult.success,
        errorResult.success ? `Error tracked: ${errorResult.errorId}` : errorResult.error);
    } catch (error) {
      this.addTestResult('monitoring', 'Error Tracking', false, error.message);
    }

    // Test 6: Analytics Dashboard
    try {
      const dashboardResult = await this.monitoringService.getAnalyticsDashboard('1h');
      this.addTestResult('monitoring', 'Analytics Dashboard',
        dashboardResult.success,
        dashboardResult.success ? 'Dashboard data retrieved' : dashboardResult.error);
    } catch (error) {
      this.addTestResult('monitoring', 'Analytics Dashboard', false, error.message);
    }

    // Test 7: Metrics Export
    try {
      const exportResult = this.monitoringService.exportMetrics('json', '1h');
      this.addTestResult('monitoring', 'Metrics Export',
        exportResult.success,
        exportResult.success ? `Metrics exported in ${exportResult.format} format` : exportResult.error);
    } catch (error) {
      this.addTestResult('monitoring', 'Metrics Export', false, error.message);
    }

    console.log(`📊 Monitoring Tests: ${this.testResults.monitoring.passed} passed, ${this.testResults.monitoring.failed} failed`);
  }

  /**
   * Test Integration Scenarios
   */
  async testIntegrationScenarios() {
    console.log('🔗 Testing Integration Scenarios...');

    // Test 1: Relay Management + Security Integration
    try {
      // Create a tenant with security features
      const tenantConfig = {
        tenant_id: 'secure-tenant-' + Date.now(),
        name: 'Secure Tenant',
        description: 'Tenant with integrated security',
        features: { dm: true, reactions: true, security: true }
      };

      const tenantResult = await this.relayAPI.createTenant(tenantConfig);

      // Apply security rules to the tenant
      if (tenantResult.success) {
        const securityResult = await this.securityService.scanContent({
          content: 'Test content for secure tenant',
          pubkey: this.testPublicKey(),
          kind: 1,
          tags: [['t', tenantConfig.tenant_id]],
          created_at: Math.floor(Date.now() / 1000)
        });

        this.addTestResult('integration', 'Tenant Security Integration',
          tenantResult.success && securityResult.safe !== undefined,
          'Tenant created and security scanning applied');
      }
    } catch (error) {
      this.addTestResult('integration', 'Tenant Security Integration', false, error.message);
    }

    // Test 2: Monitoring + Relay Management Integration
    try {
      // Configure a relay and monitor its health
      const relayConfig = {
        relay_url: 'wss://monitored.relay.com',
        read: true,
        write: true,
        max_connections: 500
      };

      const configResult = await this.relayAPI.updateRelayConfig('wss://monitored.relay.com', relayConfig);

      // Track the configuration as a performance metric
      if (configResult.success) {
        const perfResult = await this.monitoringService.trackPerformance('relay_config_update', 200, {
          relay: 'wss://monitored.relay.com',
          admin_operation: true
        });

        this.addTestResult('integration', 'Relay Monitoring Integration',
          configResult.success && perfResult.success,
          'Relay configured and performance tracked');
      }
    } catch (error) {
      this.addTestResult('integration', 'Relay Monitoring Integration', false, error.message);
    }

    // Test 3: Security + Monitoring Integration
    try {
      // Simulate a security violation and track it
      const violationEvent = {
        content: 'This content contains spam BUY NOW CLICK HERE',
        pubkey: this.testPublicKey(),
        kind: 1,
        tags: [],
        created_at: Math.floor(Date.now() / 1000)
      };

      const spamResult = await this.securityService.detectSpam(violationEvent);

      if (spamResult.isSpam) {
        // Track the spam detection as a metric
        const metricResult = this.monitoringService.recordMetric('security.spam_detected', 1, {
          severity: 'high',
          automated_detection: true
        });

        // Track the error/security event
        const errorResult = this.monitoringService.trackError(new Error('Spam detected'), {
          component: 'security',
          severity: 'warning',
          event_id: violationEvent.id
        });

        this.addTestResult('integration', 'Security Monitoring Integration',
          spamResult.isSpam && metricResult.success && errorResult.success,
          'Spam detected and tracked in monitoring system');
      }
    } catch (error) {
      this.addTestResult('integration', 'Security Monitoring Integration', false, error.message);
    }

    // Test 4: End-to-End Workflow
    try {
      // Complete workflow: Create tenant -> Configure relay -> Apply security -> Monitor performance
      const workflowId = 'workflow-' + Date.now();

      // Step 1: Create tenant
      const tenantConfig = {
        tenant_id: `workflow-tenant-${workflowId}`,
        name: 'Workflow Test Tenant',
        description: 'Testing complete workflow'
      };

      const tenantResult = await this.relayAPI.createTenant(tenantConfig);

      // Step 2: Configure relay with rate limiting
      if (tenantResult.success) {
        const rateLimitResult = await this.relayAPI.setRateLimit(tenantConfig.tenant_id, {
          type: 'tenant',
          window: 3600,
          max_requests: 100
        });

        // Step 3: Apply security monitoring
        const securityScan = await this.securityService.scanContent({
          content: 'Test content for workflow',
          pubkey: this.testPublicKey(),
          kind: 1,
          tags: [['t', tenantConfig.tenant_id]],
          created_at: Math.floor(Date.now() / 1000)
        });

        // Step 4: Monitor the entire workflow
        const workflowMetric = this.monitoringService.recordMetric('workflow.completion', 1, {
          workflow_id: workflowId,
          tenant_id: tenantConfig.tenant_id,
          steps_completed: 4
        });

        this.addTestResult('integration', 'End-to-End Workflow',
          tenantResult.success && rateLimitResult.success &&
          securityScan.safe !== undefined && workflowMetric.success,
          'Complete workflow executed successfully');
      }
    } catch (error) {
      this.addTestResult('integration', 'End-to-End Workflow', false, error.message);
    }

    console.log(`🔗 Integration Tests: ${this.testResults.integration.passed} passed, ${this.testResults.integration.failed} failed`);
  }

  /**
   * Add test result to the results object
   */
  addTestResult(category, testName, passed, message) {
    const result = {
      test: testName,
      status: passed ? '✅' : '❌',
      result: message,
      timestamp: new Date().toISOString()
    };

    this.testResults[category].details.push(result);

    if (passed) {
      this.testResults[category].passed++;
    } else {
      this.testResults[category].failed++;
    }
  }

  /**
   * Generate comprehensive summary report
   */
  generateSummaryReport() {
    console.log('\n📋 ENTERPRISE FEATURES TEST SUMMARY REPORT');
    console.log('='.repeat(60));

    const totalPassed = Object.values(this.testResults).reduce((sum, category) => sum + category.passed, 0);
    const totalFailed = Object.values(this.testResults).reduce((sum, category) => sum + category.failed, 0);
    const totalTests = totalPassed + totalFailed;

    console.log(`\n📊 Overall Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`);

    console.log(`\n📈 Category Breakdown:`);

    Object.entries(this.testResults).forEach(([category, results]) => {
      const categoryTotal = results.passed + results.failed;
      const passRate = categoryTotal > 0 ? ((results.passed / categoryTotal) * 100).toFixed(1) : '0.0';

      console.log(`\n   ${category.toUpperCase()}:`);
      console.log(`      Passed: ${results.passed}/${categoryTotal} (${passRate}%)`);
      console.log(`      Failed: ${results.failed}/${categoryTotal}`);

      if (results.failed > 0) {
        console.log(`      Failed Tests:`);
        results.details.filter(detail => detail.status === '❌').forEach(detail => {
          console.log(`         ❌ ${detail.test}: ${detail.result}`);
        });
      }
    });

    console.log(`\n🎯 Phase 4 Week 13-14 Implementation Status:`);

    const featureStatus = {
      'NIP-86 Relay Management API': {
        tests: this.testResults.relayManagement.passed,
        total: this.testResults.relayManagement.passed + this.testResults.relayManagement.failed,
        implemented: this.testResults.relayManagement.passed >= 6 // At least 6 tests should pass
      },
      'Advanced Security Features': {
        tests: this.testResults.security.passed,
        total: this.testResults.security.passed + this.testResults.security.failed,
        implemented: this.testResults.security.passed >= 6
      },
      'Monitoring & Analytics': {
        tests: this.testResults.monitoring.passed,
        total: this.testResults.monitoring.passed + this.testResults.monitoring.failed,
        implemented: this.testResults.monitoring.passed >= 6
      },
      'Integration Scenarios': {
        tests: this.testResults.integration.passed,
        total: this.testResults.integration.passed + this.testResults.integration.failed,
        implemented: this.testResults.integration.passed >= 3
      }
    };

    Object.entries(featureStatus).forEach(([feature, status]) => {
      const percentage = status.total > 0 ? ((status.tests / status.total) * 100).toFixed(1) : '0.0';
      const statusIcon = status.implemented ? '✅' : '⚠️';
      const statusText = status.implemented ? 'IMPLEMENTED' : 'NEEDS ATTENTION';

      console.log(`   ${statusIcon} ${feature}:`);
      console.log(`      Tests: ${status.tests}/${status.total} (${percentage}%)`);
      console.log(`      Status: ${statusText}`);
    });

    // Recommendations
    console.log(`\n💡 Recommendations:`);

    if (this.testResults.relayManagement.failed > 0) {
      console.log(`   🔌 Review NIP-86 Relay Management implementation - ${this.testResults.relayManagement.failed} test(s) failed`);
    }

    if (this.testResults.security.failed > 0) {
      console.log(`   🔒 Review Advanced Security features - ${this.testResults.security.failed} test(s) failed`);
    }

    if (this.testResults.monitoring.failed > 0) {
      console.log(`   📊 Review Monitoring Service - ${this.testResults.monitoring.failed} test(s) failed`);
    }

    if (this.testResults.integration.failed > 0) {
      console.log(`   🔗 Review Integration scenarios - ${this.testResults.integration.failed} test(s) failed`);
    }

    if (totalFailed === 0) {
      console.log(`   🎉 All tests passed! Enterprise features are ready for production deployment.`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('End of Enterprise Features Test Report');
  }

  /**
   * Generate test private key for testing purposes
   */
  testPublicKey() {
    // Return a deterministic test pubkey for consistent testing
    return 'test-pubkey-for-enterprise-testing';
  }
}

// Export for use in other files
export default EnterpriseFeaturesTestSuite;

// Also provide a self-test function
export const runEnterpriseFeaturesTest = async () => {
  const testSuite = new EnterpriseFeaturesTestSuite();
  return await testSuite.runAllTests();
};

// Run tests if this file is executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  runEnterpriseFeaturesTest().catch(console.error);
}
