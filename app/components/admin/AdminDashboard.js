/**
 * Comprehensive Admin Dashboard
 * Integrates NIP-86 Relay Management API, Advanced Security, and Monitoring features
 * Phase 4 Week 13-14 Enterprise Implementation
 */

'use client';

import { useState, useEffect } from 'react';
import RelayManagementAPI from '../../services/admin/RelayManagementAPI.js';
import SecurityService from '../../services/security/SecurityService.js';
import MonitoringService from '../../services/monitoring/MonitoringService.js';

const AdminDashboard = ({ currentPubkey, privateKey }) => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState({
    relayAPI: null,
    security: null,
    monitoring: null
  });
  const [dashboardData, setDashboardData] = useState({
    overview: null,
    relays: null,
    security: null,
    monitoring: null,
    analytics: null
  });

  // Form states
  const [tenantForm, setTenantForm] = useState({
    tenant_id: '',
    name: '',
    description: '',
    max_users: 1000,
    storage_quota: 1073741824
  });

  const [relayConfigForm, setRelayConfigForm] = useState({
    relay_url: '',
    read: false,
    write: false,
    both: false,
    max_connections: 1000,
    enable_authentication: true
  });

  const [rateLimitForm, setRateLimitForm] = useState({
    identifier: '',
    type: 'ip',
    window: 3600,
    max_requests: 1000,
    strategy: 'sliding_window'
  });

  const [backupForm, setBackupForm] = useState({
    relay_urls: [],
    include_kinds: [0, 1, 3, 6, 7, 9734, 9735],
    compress: true,
    encrypt: false,
    destination: 'local'
  });

  const [securityConfig, setSecurityConfig] = useState({
    enableContentScanning: true,
    enableSpamDetection: true,
    enableAutomatedModeration: true,
    strictMode: false
  });

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      setLoading(true);
      try {
        const relayAPI = new RelayManagementAPI();
        const security = new SecurityService();
        const monitoring = new MonitoringService();

        // Initialize admin session
        if (privateKey) {
          await relayAPI.initializeAdminSession(privateKey, 'default');
        }

        // Initialize security and monitoring
        await security.initialize(securityConfig);
        await monitoring.initialize({
          enableRealTimeMonitoring: true,
          enableHistoricalAnalytics: true,
          enablePerformanceTracking: true,
          enableHealthChecks: true,
          enableAlerting: true
        });

        setServices({ relayAPI, security, monitoring });
      } catch (error) {
        console.error('Failed to initialize services:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeServices();
  }, [privateKey, securityConfig]);

  // Load dashboard data
  useEffect(() => {
    if (services.relayAPI && services.security && services.monitoring) {
      loadDashboardData();
    }
  }, [services, activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = {};

      // Load overview data
      if (activeTab === 'overview' || !dashboardData.overview) {
        data.overview = await loadOverviewData();
      }

      // Load relay data
      if (activeTab === 'relays' || !dashboardData.relays) {
        data.relays = await loadRelayData();
      }

      // Load security data
      if (activeTab === 'security' || !dashboardData.security) {
        data.security = await loadSecurityData();
      }

      // Load monitoring data
      if (activeTab === 'monitoring' || !dashboardData.monitoring) {
        data.monitoring = await loadMonitoringData();
      }

      // Load analytics data
      if (activeTab === 'analytics' || !dashboardData.analytics) {
        data.analytics = await loadAnalyticsData();
      }

      setDashboardData(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewData = async () => {
    try {
      const [relayList, securityAnalytics, monitoringDashboard] = await Promise.all([
        services.relayAPI.getRelayList(),
        services.security.getSecurityAnalytics('24h'),
        services.monitoring.getAnalyticsDashboard('24h')
      ]);

      return {
        totalRelays: relayList.success ? relayList.count : 0,
        totalTenants: 1, // Would fetch from database
        securityEvents: securityAnalytics.success ? securityAnalytics.analytics.summary.totalSecurityEvents : 0,
        systemHealth: monitoringDashboard.success ? monitoringDashboard.dashboard.summary.overallHealth : 'unknown',
        activeUsers: monitoringDashboard.success ? monitoringDashboard.dashboard.summary.activeUsers : 0,
        totalErrors: monitoringDashboard.success ? monitoringDashboard.dashboard.summary.totalErrors : 0
      };
    } catch (error) {
      console.error('Failed to load overview data:', error);
      return null;
    }
  };

  const loadRelayData = async () => {
    try {
      const [relayList, analytics] = await Promise.all([
        services.relayAPI.getRelayList(),
        services.relayAPI.getAnalytics('24h')
      ]);

      return {
        relays: relayList.success ? relayList.relays : [],
        analytics: analytics.success ? analytics.analytics : null
      };
    } catch (error) {
      console.error('Failed to load relay data:', error);
      return null;
    }
  };

  const loadSecurityData = async () => {
    try {
      const [analytics, auditLog] = await Promise.all([
        services.security.getSecurityAnalytics('24h'),
        services.security.auditLog.slice(-100) // Last 100 entries
      ]);

      return {
        analytics: analytics.success ? analytics.analytics : null,
        auditLog
      };
    } catch (error) {
      console.error('Failed to load security data:', error);
      return null;
    }
  };

  const loadMonitoringData = async () => {
    try {
      const [dashboard, healthStatus] = await Promise.all([
        services.monitoring.getAnalyticsDashboard('1h'),
        services.monitoring.getOverallHealthStatus?.() || { overall: 'unknown', components: {} }
      ]);

      return {
        dashboard: dashboard.success ? dashboard.dashboard : null,
        healthStatus
      };
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      return null;
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const [relayAnalytics, securityAnalytics, monitoringAnalytics] = await Promise.all([
        services.relayAPI.getAnalytics('7d'),
        services.security.getSecurityAnalytics('7d'),
        services.monitoring.getAnalyticsDashboard('7d')
      ]);

      return {
        relay: relayAnalytics.success ? relayAnalytics.analytics : null,
        security: securityAnalytics.success ? securityAnalytics.analytics : null,
        monitoring: monitoringAnalytics.success ? monitoringAnalytics.dashboard : null
      };
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      return null;
    }
  };

  // Event handlers
  const handleCreateTenant = async (e) => {
    e.preventDefault();
    if (!services.relayAPI) return;

    setLoading(true);
    try {
      const result = await services.relayAPI.createTenant(tenantForm);
      if (result.success) {
        alert('Tenant created successfully!');
        setTenantForm({ tenant_id: '', name: '', description: '', max_users: 1000, storage_quota: 1073741824 });
        loadDashboardData();
      } else {
        alert(`Failed to create tenant: ${result.error}`);
      }
    } catch (error) {
      alert(`Error creating tenant: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRelayConfig = async (e) => {
    e.preventDefault();
    if (!services.relayAPI) return;

    setLoading(true);
    try {
      const result = await services.relayAPI.updateRelayConfig(relayConfigForm.relay_url, relayConfigForm);
      if (result.success) {
        alert('Relay configuration updated successfully!');
        setRelayConfigForm({ relay_url: '', read: false, write: false, both: false, max_connections: 1000, enable_authentication: true });
        loadDashboardData();
      } else {
        alert(`Failed to update relay config: ${result.error}`);
      }
    } catch (error) {
      alert(`Error updating relay config: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetRateLimit = async (e) => {
    e.preventDefault();
    if (!services.relayAPI) return;

    setLoading(true);
    try {
      const result = await services.relayAPI.setRateLimit(rateLimitForm.identifier, rateLimitForm);
      if (result.success) {
        alert('Rate limit set successfully!');
        setRateLimitForm({ identifier: '', type: 'ip', window: 3600, max_requests: 1000, strategy: 'sliding_window' });
        loadDashboardData();
      } else {
        alert(`Failed to set rate limit: ${result.error}`);
      }
    } catch (error) {
      alert(`Error setting rate limit: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async (e) => {
    e.preventDefault();
    if (!services.relayAPI) return;

    setLoading(true);
    try {
      const result = await services.relayAPI.createBackup(backupForm);
      if (result.success) {
        alert(`Backup created successfully! ID: ${result.backup_id}`);
        setBackupForm({ relay_urls: [], include_kinds: [0, 1, 3, 6, 7, 9734, 9735], compress: true, encrypt: false, destination: 'local' });
        loadDashboardData();
      } else {
        alert(`Failed to create backup: ${result.error}`);
      }
    } catch (error) {
      alert(`Error creating backup: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScanContent = async (content) => {
    if (!services.security) return;

    try {
      const mockEvent = {
        id: 'test_event',
        content,
        pubkey: currentPubkey,
        kind: 1,
        tags: [],
        created_at: Math.floor(Date.now() / 1000)
      };

      const result = await services.security.scanContent(mockEvent);
      alert(`Content scan result: ${result.safe ? 'Safe' : 'Violations detected'}\nRisk Score: ${result.riskScore}\nViolations: ${result.violations.length}`);
    } catch (error) {
      alert(`Error scanning content: ${error.message}`);
    }
  };

  const handlePerformHealthCheck = async (component) => {
    if (!services.monitoring) return;

    setLoading(true);
    try {
      const result = await services.monitoring.performHealthCheck(component);
      alert(`Health check result for ${component}:\nStatus: ${result.status}\nHealth Score: ${result.details.healthScore}\nDuration: ${result.duration}ms`);
      loadDashboardData();
    } catch (error) {
      alert(`Error performing health check: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">System Overview</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Relays:</span>
            <span className="font-medium">{dashboardData.overview?.totalRelays || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Active Tenants:</span>
            <span className="font-medium">{dashboardData.overview?.totalTenants || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Active Users:</span>
            <span className="font-medium">{dashboardData.overview?.activeUsers || 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">Security Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Security Events:</span>
            <span className="font-medium">{dashboardData.overview?.securityEvents || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Content Scans:</span>
            <span className="font-medium">--</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Spam Detections:</span>
            <span className="font-medium">--</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">System Health</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Overall Status:</span>
            <span className={`font-medium ${
              dashboardData.overview?.systemHealth === 'healthy' ? 'text-green-600' :
              dashboardData.overview?.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {dashboardData.overview?.systemHealth || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Errors:</span>
            <span className="font-medium">{dashboardData.overview?.totalErrors || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Uptime:</span>
            <span className="font-medium">--</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRelayManagement = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Tenant */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Tenant</h3>
          <form onSubmit={handleCreateTenant} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant ID</label>
              <input
                type="text"
                value={tenantForm.tenant_id}
                onChange={(e) => setTenantForm(prev => ({ ...prev, tenant_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={tenantForm.name}
                onChange={(e) => setTenantForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={tenantForm.description}
                onChange={(e) => setTenantForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Users</label>
              <input
                type="number"
                value={tenantForm.max_users}
                onChange={(e) => setTenantForm(prev => ({ ...prev, max_users: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Tenant'}
            </button>
          </form>
        </div>

        {/* Update Relay Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Update Relay Configuration</h3>
          <form onSubmit={handleUpdateRelayConfig} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relay URL</label>
              <input
                type="url"
                value={relayConfigForm.relay_url}
                onChange={(e) => setRelayConfigForm(prev => ({ ...prev, relay_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="wss://relay.example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={relayConfigForm.read}
                  onChange={(e) => setRelayConfigForm(prev => ({ ...prev, read: e.target.checked, both: false }))}
                  className="mr-2"
                />
                Allow Read Access
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={relayConfigForm.write}
                  onChange={(e) => setRelayConfigForm(prev => ({ ...prev, write: e.target.checked, both: false }))}
                  className="mr-2"
                />
                Allow Write Access
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={relayConfigForm.both}
                  onChange={(e) => setRelayConfigForm(prev => ({ ...prev, both: e.target.checked, read: false, write: false }))}
                  className="mr-2"
                />
                Allow Both Read & Write
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Connections</label>
              <input
                type="number"
                value={relayConfigForm.max_connections}
                onChange={(e) => setRelayConfigForm(prev => ({ ...prev, max_connections: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Configuration'}
            </button>
          </form>
        </div>
      </div>

      {/* Relay List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Active Relays</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Relay URL</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Permissions</th>
                <th className="text-left py-2">Max Connections</th>
                <th className="text-left py-2">Tenant</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.relays?.relays?.map((relay, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{relay.id}</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                  </td>
                  <td className="py-2">{Object.keys(relay.metadata || {}).join(', ') || 'None'}</td>
                  <td className="py-2">--</td>
                  <td className="py-2">{relay.tenant_id}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">No relays found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Security Configuration</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={securityConfig.enableContentScanning}
                onChange={(e) => setSecurityConfig(prev => ({ ...prev, enableContentScanning: e.target.checked }))}
                className="mr-2"
              />
              Enable Content Scanning
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={securityConfig.enableSpamDetection}
                onChange={(e) => setSecurityConfig(prev => ({ ...prev, enableSpamDetection: e.target.checked }))}
                className="mr-2"
              />
              Enable Spam Detection
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={securityConfig.enableAutomatedModeration}
                onChange={(e) => setSecurityConfig(prev => ({ ...prev, enableAutomatedModeration: e.target.checked }))}
                className="mr-2"
              />
              Enable Automated Moderation
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={securityConfig.strictMode}
                onChange={(e) => setSecurityConfig(prev => ({ ...prev, strictMode: e.target.checked }))}
                className="mr-2"
              />
              Strict Mode
            </label>
          </div>
        </div>

        {/* Content Scanner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Content Scanner Test</h3>
          <div className="space-y-4">
            <textarea
              placeholder="Enter content to test for violations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              id="contentScannerTest"
            />
            <button
              onClick={() => {
                const content = document.getElementById('contentScannerTest').value;
                handleScanContent(content);
              }}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              Scan Content
            </button>
          </div>
        </div>
      </div>

      {/* Security Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Security Analytics (24h)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.security?.analytics?.summary?.totalSecurityEvents || 0}
            </div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardData.security?.analytics?.summary?.contentScans || 0}
            </div>
            <div className="text-sm text-gray-600">Content Scans</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {dashboardData.security?.analytics?.summary?.spamDetections || 0}
            </div>
            <div className="text-sm text-gray-600">Spam Detected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {dashboardData.security?.analytics?.summary?.moderationActions || 0}
            </div>
            <div className="text-sm text-gray-600">Moderation Actions</div>
          </div>
        </div>

        {/* Recent Security Events */}
        <div>
          <h4 className="font-medium mb-2">Recent Security Events</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Action</th>
                  <th className="text-left py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.security?.auditLog?.slice(-10).reverse().map((event, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{new Date(event.timestamp * 1000).toLocaleString()}</td>
                    <td className="py-2">{event.action}</td>
                    <td className="py-2">{JSON.stringify(event.data).substring(0, 100)}...</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-gray-500">No recent security events</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonitoring = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Limiting */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Rate Limiting</h3>
          <form onSubmit={handleSetRateLimit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identifier</label>
              <input
                type="text"
                value={rateLimitForm.identifier}
                onChange={(e) => setRateLimitForm(prev => ({ ...prev, identifier: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="IP address or pubkey"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={rateLimitForm.type}
                onChange={(e) => setRateLimitForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ip">IP Address</option>
                <option value="pubkey">Public Key</option>
                <option value="tenant">Tenant</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Requests</label>
              <input
                type="number"
                value={rateLimitForm.max_requests}
                onChange={(e) => setRateLimitForm(prev => ({ ...prev, max_requests: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Window (seconds)</label>
              <input
                type="number"
                value={rateLimitForm.window}
                onChange={(e) => setRateLimitForm(prev => ({ ...prev, window: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Setting...' : 'Set Rate Limit'}
            </button>
          </form>
        </div>

        {/* Backup Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Create Backup</h3>
          <form onSubmit={handleCreateBackup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relay URLs (comma-separated)</label>
              <input
                type="text"
                value={backupForm.relay_urls.join(', ')}
                onChange={(e) => setBackupForm(prev => ({ ...prev, relay_urls: e.target.value.split(',').map(url => url.trim()).filter(url => url) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="wss://relay1.example.com, wss://relay2.example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={backupForm.compress}
                  onChange={(e) => setBackupForm(prev => ({ ...prev, compress: e.target.checked }))}
                  className="mr-2"
                />
                Compress Backup
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={backupForm.encrypt}
                  onChange={(e) => setBackupForm(prev => ({ ...prev, encrypt: e.target.checked }))}
                  className="mr-2"
                />
                Encrypt Backup
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <select
                value={backupForm.destination}
                onChange={(e) => setBackupForm(prev => ({ ...prev, destination: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="local">Local Storage</option>
                <option value="s3">Amazon S3</option>
                <option value="gcs">Google Cloud Storage</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Backup'}
            </button>
          </form>
        </div>
      </div>

      {/* Health Checks */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">System Health Checks</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {['relay_connections', 'database', 'memory', 'cpu', 'disk', 'api_endpoints'].map((component) => (
            <button
              key={component}
              onClick={() => handlePerformHealthCheck(component)}
              className="p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="text-sm font-medium">{component.replace('_', ' ')}</div>
              <div className={`text-xs mt-1 ${
                dashboardData.monitoring?.healthStatus?.components?.[component]?.status === 'healthy' ? 'text-green-600' :
                dashboardData.monitoring?.healthStatus?.components?.[component]?.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {dashboardData.monitoring?.healthStatus?.components?.[component]?.status || 'Unknown'}
              </div>
            </button>
          ))}
        </div>

        {/* Monitoring Dashboard */}
        {dashboardData.monitoring?.dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData.monitoring.dashboard.summary.avgResponseTime || 0}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dashboardData.monitoring.dashboard.summary.slaCompliance || 0}%
              </div>
              <div className="text-sm text-gray-600">SLA Compliance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {dashboardData.monitoring.dashboard.summary.activeUsers || 0}
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {dashboardData.monitoring.dashboard.alerts?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Active Alerts</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">7-Day Analytics Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Relay Analytics */}
          <div>
            <h4 className="font-medium mb-3">Relay Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Events:</span>
                <span className="font-medium">{dashboardData.analytics?.relay?.summary?.total_events || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unique Users:</span>
                <span className="font-medium">{dashboardData.analytics?.relay?.summary?.unique_pubkeys || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Data Transferred:</span>
                <span className="font-medium">{Math.round((dashboardData.analytics?.relay?.summary?.total_bytes || 0) / 1024 / 1024)}MB</span>
              </div>
            </div>
          </div>

          {/* Security Analytics */}
          <div>
            <h4 className="font-medium mb-3">Security Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Scans:</span>
                <span className="font-medium">{dashboardData.analytics?.security?.summary?.totalSecurityEvents || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Violations:</span>
                <span className="font-medium">{dashboardData.analytics?.security?.topViolations ? Object.values(dashboardData.analytics.security.topViolations).reduce((a, b) => a + b, 0) : 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Blocks:</span>
                <span className="font-medium">{dashboardData.analytics?.security?.summary?.userBlocks || 0}</span>
              </div>
            </div>
          </div>

          {/* System Analytics */}
          <div>
            <h4 className="font-medium mb-3">System Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Response:</span>
                <span className="font-medium">{dashboardData.analytics?.monitoring?.summary?.avgResponseTime || 0}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Errors:</span>
                <span className="font-medium">{dashboardData.analytics?.monitoring?.summary?.totalErrors || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">SLA Compliance:</span>
                <span className="font-medium">{dashboardData.analytics?.monitoring?.summary?.slaCompliance || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Data */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Data Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => services.monitoring?.exportMetrics('json', '7d')}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Export Metrics (JSON)
          </button>
          <button
            onClick={() => services.monitoring?.exportMetrics('csv', '7d')}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            Export Metrics (CSV)
          </button>
          <button
            onClick={() => services.relayAPI?.generateComplianceReport('30d')}
            className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
          >
            Generate Compliance Report
          </button>
        </div>
      </div>
    </div>
  );

  if (loading && !services.relayAPI) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Enterprise Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">NIP-86 Relay Management, Advanced Security & Monitoring</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'relays', name: 'Relay Management', icon: '🔌' },
              { id: 'security', name: 'Security', icon: '🔒' },
              { id: 'monitoring', name: 'Monitoring', icon: '📈' },
              { id: 'analytics', name: 'Analytics', icon: '📉' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'relays' && renderRelayManagement()}
          {activeTab === 'security' && renderSecurity()}
          {activeTab === 'monitoring' && renderMonitoring()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
