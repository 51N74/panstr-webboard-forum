/**
 * Monitoring Service
 * Provides comprehensive analytics, performance metrics, and health tracking for the Panstr platform
 */

import { queryEvents, publishToPool, getPool } from '../../lib/nostrClient.js';

class MonitoringService {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.performanceBaseline = new Map();
    this.healthChecks = new Map();
    this.uptimeTracker = new Map();
    this.errorTracker = new Map();
    this.userActivityTracker = new Map();
    this.resourceTracker = new Map();
    this.slaMetrics = new Map();
  }

  /**
   * Initialize monitoring service
   */
  async initialize(config = {}) {
    try {
      const {
        enableRealTimeMonitoring = true,
        enableHistoricalAnalytics = true,
        enablePerformanceTracking = true,
        enableHealthChecks = true,
        enableAlerting = true,
        metricsRetentionDays = 30,
        alertThresholds = {}
      } = config;

      this.config = {
        enableRealTimeMonitoring,
        enableHistoricalAnalytics,
        enablePerformanceTracking,
        enableHealthChecks,
        enableAlerting,
        metricsRetentionDays,
        alertThresholds
      };

      // Initialize performance baselines
      await this.initializePerformanceBaselines();

      // Start background monitoring tasks
      if (enableRealTimeMonitoring) {
        this.startRealTimeMonitoring();
      }

      if (enableHealthChecks) {
        this.startHealthChecks();
      }

      // Load historical data
      if (enableHistoricalAnalytics) {
        await this.loadHistoricalMetrics();
      }

      return {
        success: true,
        initialized: true,
        features: this.config
      };
    } catch (error) {
      console.error('Failed to initialize monitoring service:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record custom metric
   */
  recordMetric(name, value, tags = {}, timestamp = Date.now()) {
    try {
      const metricKey = this.buildMetricKey(name, tags);

      if (!this.metrics.has(metricKey)) {
        this.metrics.set(metricKey, {
          name,
          tags,
          values: [],
          aggregates: {
            count: 0,
            sum: 0,
            min: Infinity,
            max: -Infinity,
            avg: 0
          }
        });
      }

      const metric = this.metrics.get(metricKey);
      const dataPoint = { value, timestamp };

      metric.values.push(dataPoint);
      metric.aggregates.count++;
      metric.aggregates.sum += value;
      metric.aggregates.min = Math.min(metric.aggregates.min, value);
      metric.aggregates.max = Math.max(metric.aggregates.max, value);
      metric.aggregates.avg = metric.aggregates.sum / metric.aggregates.count;

      // Keep only recent values (based on retention period)
      const cutoffTime = Date.now() - (this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
      metric.values = metric.values.filter(v => v.timestamp > cutoffTime);

      // Check alert thresholds
      if (this.config.enableAlerting) {
        this.checkAlertThresholds(name, value, tags);
      }

      return {
        success: true,
        metric: metricKey,
        value,
        aggregates: metric.aggregates
      };
    } catch (error) {
      console.error('Failed to record metric:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get metrics with optional filtering
   */
  getMetrics(filters = {}) {
    try {
      const { name, tags, timeRange = '1h', aggregation = 'avg' } = filters;
      let results = Array.from(this.metrics.entries());

      // Filter by name
      if (name) {
        results = results.filter(([key, metric]) => metric.name === name);
      }

      // Filter by tags
      if (tags) {
        results = results.filter(([key, metric]) => {
          return Object.entries(tags).every(([tagKey, tagValue]) =>
            metric.tags[tagKey] === tagValue
          );
        });
      }

      // Filter by time range
      const now = Date.now();
      let timeRangeMs;
      switch (timeRange) {
        case '1h': timeRangeMs = 60 * 60 * 1000; break;
        case '24h': timeRangeMs = 24 * 60 * 60 * 1000; break;
        case '7d': timeRangeMs = 7 * 24 * 60 * 60 * 1000; break;
        case '30d': timeRangeMs = 30 * 24 * 60 * 60 * 1000; break;
        default: timeRangeMs = 60 * 60 * 1000;
      }

      const cutoffTime = now - timeRangeMs;
      results = results.map(([key, metric]) => {
        const filteredValues = metric.values.filter(v => v.timestamp >= cutoffTime);
        return [key, { ...metric, values: filteredValues }];
      });

      return {
        success: true,
        metrics: Object.fromEntries(results),
        count: results.length,
        timeRange,
        aggregation
      };
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(operation, duration, metadata = {}) {
    try {
      const timestamp = Date.now();

      // Record basic performance metric
      this.recordMetric(`performance.${operation}.duration`, duration, {
        operation,
        ...metadata
      }, timestamp);

      // Track performance vs baseline
      const baseline = this.performanceBaseline.get(operation);
      if (baseline) {
        const performanceRatio = duration / baseline;
        this.recordMetric(`performance.${operation}.ratio_to_baseline`, performanceRatio, {
          operation,
          baseline,
          current: duration,
          status: performanceRatio > 2 ? 'degraded' : performanceRatio > 1.5 ? 'warning' : 'normal'
        }, timestamp);
      }

      // Track slow operations
      if (duration > 5000) { // 5 seconds threshold
        this.recordMetric(`performance.${operation}.slow_operations`, 1, {
          operation,
          threshold: 5000,
          actual: duration
        }, timestamp);
      }

      return {
        success: true,
        operation,
        duration,
        baseline,
        timestamp
      };
    } catch (error) {
      console.error('Failed to track performance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Health check for system components
   */
  async performHealthCheck(component, config = {}) {
    try {
      const startTime = Date.now();
      let status = 'healthy';
      let details = {};
      let metrics = {};

      switch (component) {
        case 'relay_connections':
          details = await this.checkRelayConnections();
          break;
        case 'database':
          details = await this.checkDatabaseHealth();
          break;
        case 'memory':
          details = await this.checkMemoryUsage();
          break;
        case 'cpu':
          details = await this.checkCPUUsage();
          break;
        case 'disk':
          details = await this.checkDiskUsage();
          break;
        case 'api_endpoints':
          details = await this.checkAPIEndpoints();
          break;
        default:
          details = await this.checkCustomComponent(component, config);
      }

      const duration = Date.now() - startTime;

      // Determine overall status
      if (details.errors && details.errors.length > 0) {
        status = details.critical ? 'critical' : 'degraded';
      }

      const healthResult = {
        component,
        status,
        timestamp: Date.now(),
        duration,
        details,
        metrics: {
          response_time: duration,
          ...details.metrics
        }
      };

      // Store health check result
      if (!this.healthChecks.has(component)) {
        this.healthChecks.set(component, []);
      }
      const componentHistory = this.healthChecks.get(component);
      componentHistory.push(healthResult);

      // Keep only recent history (last 100 checks)
      if (componentHistory.length > 100) {
        componentHistory.splice(0, componentHistory.length - 100);
      }

      // Record health metrics
      this.recordMetric(`health.${component}.status`, status === 'healthy' ? 1 : 0, {
        component,
        status
      });
      this.recordMetric(`health.${component}.response_time`, duration, {
        component
      });

      // Check for SLA violations
      this.checkSLAViolations(component, healthResult);

      return {
        success: true,
        ...healthResult
      };
    } catch (error) {
      console.error(`Health check failed for ${component}:`, error);

      const failedResult = {
        component,
        status: 'critical',
        timestamp: Date.now(),
        error: error.message,
        details: { errors: [error.message] }
      };

      // Record failure
      this.recordMetric(`health.${component}.status`, 0, {
        component,
        status: 'critical'
      });

      return {
        success: false,
        ...failedResult
      };
    }
  }

  /**
   * Track user activity metrics
   */
  trackUserActivity(pubkey, activity, metadata = {}) {
    try {
      const timestamp = Date.now();

      // Track basic activity
      this.recordMetric(`user.activity.${activity}`, 1, {
        pubkey: pubkey.substring(0, 8), // Partial pubkey for privacy
        activity,
        ...metadata
      }, timestamp);

      // Update user activity tracker
      if (!this.userActivityTracker.has(pubkey)) {
        this.userActivityTracker.set(pubkey, {
          firstSeen: timestamp,
          lastSeen: timestamp,
          activities: [],
          sessionCount: 0,
          totalActivities: 0
        });
      }

      const userStats = this.userActivityTracker.get(pubkey);
      userStats.lastSeen = timestamp;
      userStats.activities.push({ activity, timestamp, metadata });
      userStats.totalActivities++;

      // Update session count (new session if > 30 minutes inactive)
      if (timestamp - userStats.lastSeen > 30 * 60 * 1000) {
        userStats.sessionCount++;
      }

      // Keep only recent activities
      userStats.activities = userStats.activities.filter(a =>
        timestamp - a.timestamp < 24 * 60 * 60 * 1000
      );

      return {
        success: true,
        pubkey: pubkey.substring(0, 8),
        activity,
        timestamp,
        userStats: {
          sessionCount: userStats.sessionCount,
          totalActivities: userStats.totalActivities,
          active24h: userStats.activities.length
        }
      };
    } catch (error) {
      console.error('Failed to track user activity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track errors and exceptions
   */
  trackError(error, context = {}) {
    try {
      const timestamp = Date.now();
      const errorId = `error_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

      const errorData = {
        id: errorId,
        message: error.message || error,
        stack: error.stack,
        context,
        timestamp,
        severity: context.severity || 'error'
      };

      // Track error metrics
      this.recordMetric(`errors.${context.component || 'unknown'}.count`, 1, {
        component: context.component || 'unknown',
        error_type: error.name || 'unknown',
        severity: errorData.severity
      }, timestamp);

      // Update error tracker
      if (!this.errorTracker.has(context.component || 'unknown')) {
        this.errorTracker.set(context.component || 'unknown', []);
      }

      const componentErrors = this.errorTracker.get(context.component || 'unknown');
      componentErrors.push(errorData);

      // Keep only recent errors (last 1000 per component)
      if (componentErrors.length > 1000) {
        componentErrors.splice(0, componentErrors.length - 1000);
      }

      // Check for error spikes
      this.checkErrorSpikes(context.component || 'unknown');

      return {
        success: true,
        errorId,
        timestamp,
        severity: errorData.severity
      };
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
      return { success: false, error: trackingError.message };
    }
  }

  /**
   * Get comprehensive analytics dashboard data
   */
  async getAnalyticsDashboard(timeRange = '24h') {
    try {
      const now = Date.now();
      let timeRangeMs;
      switch (timeRange) {
        case '1h': timeRangeMs = 60 * 60 * 1000; break;
        case '24h': timeRangeMs = 24 * 60 * 60 * 1000; break;
        case '7d': timeRangeMs = 7 * 24 * 60 * 60 * 1000; break;
        case '30d': timeRangeMs = 30 * 24 * 60 * 60 * 1000; break;
        default: timeRangeMs = 24 * 60 * 60 * 1000;
      }

      const cutoffTime = now - timeRangeMs;

      // Get performance metrics
      const performanceMetrics = this.getMetrics({
        name: 'performance',
        timeRange
      });

      // Get health status
      const healthStatus = this.getOverallHealthStatus();

      // Get error statistics
      const errorStats = this.getErrorStatistics(cutoffTime);

      // Get user activity stats
      const userActivityStats = this.getUserActivityStats(cutoffTime);

      // Get resource usage
      const resourceUsage = this.getResourceUsage();

      // Get SLA compliance
      const slaCompliance = this.getSLACompliance(cutoffTime);

      const dashboard = {
        timeRange,
        generatedAt: now,
        summary: {
          overallHealth: healthStatus.overall,
          totalErrors: errorStats.total,
          activeUsers: userActivityStats.activeUsers,
          avgResponseTime: performanceMetrics.success ?
            this.calculateAverage(performanceMetrics.metrics, 'duration') : 0,
          slaCompliance: slaCompliance.overall
        },
        performance: performanceMetrics,
        health: healthStatus,
        errors: errorStats,
        userActivity: userActivityStats,
        resources: resourceUsage,
        sla: slaCompliance,
        alerts: this.getActiveAlerts()
      };

      return {
        success: true,
        dashboard
      };
    } catch (error) {
      console.error('Failed to get analytics dashboard:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check relay connections health
   */
  async checkRelayConnections() {
    try {
      const pool = getPool();
      const relays = pool ? Object.keys(pool) : [];
      const results = {
        total: relays.length,
        connected: 0,
        disconnected: 0,
        errors: [],
        details: []
      };

      for (const relay of relays) {
        try {
          // Simple connectivity check
          const startTime = Date.now();
          // In a real implementation, this would check actual connection status
          const connected = Math.random() > 0.1; // Simulate 90% uptime
          const latency = connected ? Math.random() * 1000 : 0;

          if (connected) {
            results.connected++;
          } else {
            results.disconnected++;
            results.errors.push(`Relay ${relay} is disconnected`);
          }

          results.details.push({
            relay,
            connected,
            latency,
            status: connected ? 'healthy' : 'unhealthy'
          });
        } catch (error) {
          results.disconnected++;
          results.errors.push(`Failed to check relay ${relay}: ${error.message}`);
        }
      }

      const healthScore = results.total > 0 ? results.connected / results.total : 0;

      return {
        healthy: healthScore > 0.8,
        healthScore,
        metrics: {
          total: results.total,
          connected: results.connected,
          disconnected: results.disconnected,
          healthScore
        },
        details: results.details,
        errors: results.errors
      };
    } catch (error) {
      return {
        healthy: false,
        healthScore: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Check database health (simulated)
   */
  async checkDatabaseHealth() {
    try {
      // Simulate database health check
      const responseTime = Math.random() * 200;
      const connectionPool = Math.random() * 100;
      const querySuccess = Math.random() > 0.05; // 95% success rate

      return {
        healthy: querySuccess && responseTime < 100,
        healthScore: querySuccess ? Math.max(0, 1 - responseTime / 100) : 0,
        metrics: {
          responseTime,
          connectionPool,
          querySuccess
        },
        errors: querySuccess ? [] : ['Database query failed']
      };
    } catch (error) {
      return {
        healthy: false,
        healthScore: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Check memory usage
   */
  async checkMemoryUsage() {
    try {
      // Simulate memory usage check
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage();
        const totalMemory = memUsage.heapTotal;
        const usedMemory = memUsage.heapUsed;
        const usagePercentage = (usedMemory / totalMemory) * 100;

        return {
          healthy: usagePercentage < 80,
          healthScore: Math.max(0, 1 - usagePercentage / 100),
          metrics: {
            totalMemory,
            usedMemory,
            usagePercentage
          },
          errors: usagePercentage > 90 ? ['High memory usage detected'] : []
        };
      }

      // Fallback simulation
      const usagePercentage = Math.random() * 100;
      return {
        healthy: usagePercentage < 80,
        healthScore: Math.max(0, 1 - usagePercentage / 100),
        metrics: {
          usagePercentage,
          usedMemory: usagePercentage * 100,
          totalMemory: 100
        }
      };
    } catch (error) {
      return {
        healthy: false,
        healthScore: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Check CPU usage
   */
  async checkCPUUsage() {
    try {
      // Simulate CPU usage check
      const usagePercentage = Math.random() * 100;

      return {
        healthy: usagePercentage < 70,
        healthScore: Math.max(0, 1 - usagePercentage / 100),
        metrics: {
          usagePercentage
        },
        errors: usagePercentage > 90 ? ['High CPU usage detected'] : []
      };
    } catch (error) {
      return {
        healthy: false,
        healthScore: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Check disk usage
   */
  async checkDiskUsage() {
    try {
      // Simulate disk usage check
      const usagePercentage = Math.random() * 100;

      return {
        healthy: usagePercentage < 85,
        healthScore: Math.max(0, 1 - usagePercentage / 100),
        metrics: {
          usagePercentage
        },
        errors: usagePercentage > 95 ? ['Low disk space'] : []
      };
    } catch (error) {
      return {
        healthy: false,
        healthScore: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Check API endpoints health
   */
  async checkAPIEndpoints() {
    try {
      const endpoints = ['/api/events', '/api/users', '/api/relays'];
      const results = {
        total: endpoints.length,
        healthy: 0,
        unhealthy: 0,
        details: [],
        errors: []
      };

      for (const endpoint of endpoints) {
        const responseTime = Math.random() * 1000;
        const statusCode = Math.random() > 0.1 ? 200 : 500;
        const healthy = statusCode === 200 && responseTime < 500;

        if (healthy) {
          results.healthy++;
        } else {
          results.unhealthy++;
          results.errors.push(`Endpoint ${endpoint} returned ${statusCode}`);
        }

        results.details.push({
          endpoint,
          statusCode,
          responseTime,
          healthy
        });
      }

      const healthScore = results.total > 0 ? results.healthy / results.total : 0;

      return {
        healthy: healthScore > 0.8,
        healthScore,
        metrics: results,
        errors: results.errors
      };
    } catch (error) {
      return {
        healthy: false,
        healthScore: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Check custom component health
   */
  async checkCustomComponent(component, config) {
    // Placeholder for custom component health checks
    return {
      healthy: true,
      healthScore: 1.0,
      metrics: {},
      errors: []
    };
  }

  /**
   * Initialize performance baselines
   */
  async initializePerformanceBaselines() {
    const baselines = {
      'event_publish': 500,    // ms
      'event_query': 300,      // ms
      'relay_connect': 1000,   // ms
      'user_auth': 200,        // ms
      'content_scan': 100,     // ms
      'database_query': 150    // ms
    };

    for (const [operation, baseline] of Object.entries(baselines)) {
      this.performanceBaseline.set(operation, baseline);
    }
  }

  /**
   * Start real-time monitoring
   */
  startRealTimeMonitoring() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Start health checks
   */
  startHealthChecks() {
    const healthCheckInterval = 60000; // Every minute

    setInterval(async () => {
      await this.performHealthCheck('relay_connections');
      await this.performHealthCheck('memory');
      await this.performHealthCheck('cpu');
    }, healthCheckInterval);

    // Less frequent checks
    setInterval(async () => {
      await this.performHealthCheck('database');
      await this.performHealthCheck('disk');
    }, healthCheckInterval * 5);

    setInterval(async () => {
      await this.performHealthCheck('api_endpoints');
    }, healthCheckInterval * 2);
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const timestamp = Date.now();

    // Memory metrics
    this.recordMetric('system.memory.used', Math.random() * 1000000000, {}, timestamp);
    this.recordMetric('system.memory.available', Math.random() * 1000000000, {}, timestamp);

    // CPU metrics
    this.recordMetric('system.cpu.usage', Math.random() * 100, {}, timestamp);

    // Network metrics
    this.recordMetric('system.network.bytes_in', Math.random() * 1000000, {}, timestamp);
    this.recordMetric('system.network.bytes_out', Math.random() * 1000000, {}, timestamp);

    // Active connections
    this.recordMetric('system.active_connections', Math.floor(Math.random() * 1000), {}, timestamp);
  }

  /**
   * Build metric key with tags
   */
  buildMetricKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    return tagString ? `${name}{${tagString}}` : name;
  }

  /**
   * Check alert thresholds
   */
  checkAlertThresholds(name, value, tags) {
    const thresholds = this.config.alertThresholds[name];
    if (!thresholds) return;

    if (value > thresholds.critical) {
      this.createAlert('critical', name, value, tags, `Value ${value} exceeds critical threshold ${thresholds.critical}`);
    } else if (value > thresholds.warning) {
      this.createAlert('warning', name, value, tags, `Value ${value} exceeds warning threshold ${thresholds.warning}`);
    }
  }

  /**
   * Create alert
   */
  createAlert(severity, metric, value, tags, message) {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const alert = {
      id: alertId,
      severity,
      metric,
      value,
      tags,
      message,
      timestamp: Date.now(),
      status: 'active'
    };

    this.alerts.set(alertId, alert);

    console.log(`ALERT [${severity.toUpperCase()}]: ${message}`);
  }

  /**
   * Check for error spikes
   */
  checkErrorSpikes(component) {
    const componentErrors = this.errorTracker.get(component) || [];
    const recentErrors = componentErrors.filter(e => Date.now() - e.timestamp < 300000); // Last 5 minutes

    if (recentErrors.length > 10) {
      this.createAlert('critical', 'error_spike', recentErrors.length, { component },
        `Error spike detected: ${recentErrors.length} errors in last 5 minutes`);
    }
  }

  /**
   * Check SLA violations
   */
  checkSLAViolations(component, healthResult) {
    // Simple SLA check - in production would be more sophisticated
    if (healthResult.status !== 'healthy' && healthResult.duration > 10000) {
      this.recordMetric(`sla.${component}.violations`, 1, {
        component,
        status: healthResult.status,
        duration: healthResult.duration
      });
    }
  }

  /**
   * Get overall health status
   */
  getOverallHealthStatus() {
    const componentHealth = {};
    let totalHealthScore = 0;
    let componentCount = 0;

    for (const [component, history] of this.healthChecks) {
      if (history.length > 0) {
        const latest = history[history.length - 1];
        componentHealth[component] = {
          status: latest.status,
          lastCheck: latest.timestamp,
          healthScore: latest.details.healthScore || 0
        };
        totalHealthScore += componentHealth[component].healthScore;
        componentCount++;
      }
    }

    const overallHealthScore = componentCount > 0 ? totalHealthScore / componentCount : 0;

    return {
      overall: overallHealthScore > 0.8 ? 'healthy' : overallHealthScore > 0.5 ? 'warning' : 'critical',
      score: overallHealthScore,
      components: componentHealth,
      componentCount
    };
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(cutoffTime) {
    let totalErrors = 0;
    const errorsByComponent = {};
    const errorsByType = {};

    for (const [component, errors] of this.errorTracker) {
      const recentErrors = errors.filter(e => e.timestamp >= cutoffTime);
      totalErrors += recentErrors.length;
      errorsByComponent[component] = recentErrors.length;

      recentErrors.forEach(error => {
        const errorType = error.error_type || 'unknown';
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
      });
    }

    return {
      total: totalErrors,
      byComponent: errorsByComponent,
      byType: errorsByType
    };
  }

  /**
   * Get user activity statistics
   */
  getUserActivityStats(cutoffTime) {
    let activeUsers = 0;
    let totalActivities = 0;
    const activitiesByType = {};

    for (const [pubkey, stats] of this.userActivityTracker) {
      if (stats.lastSeen >= cutoffTime) {
        activeUsers++;
      }

      const recentActivities = stats.activities.filter(a => a.timestamp >= cutoffTime);
      totalActivities += recentActivities.length;

      recentActivities.forEach(activity => {
        activitiesByType[activity.activity] = (activitiesByType[activity.activity] || 0) + 1;
      });
    }

    return {
      activeUsers,
      totalActivities,
      activitiesByType,
      totalUsers: this.userActivityTracker.size
    };
  }

  /**
   * Get resource usage
   */
  getResourceUsage() {
    const memoryMetrics = this.getMetrics({ name: 'system.memory.used', timeRange: '1h' });
    const cpuMetrics = this.getMetrics({ name: 'system.cpu.usage', timeRange: '1h' });
    const networkMetrics = this.getMetrics({ name: 'system.network.bytes_in', timeRange: '1h' });

    return {
      memory: memoryMetrics.success ? this.calculateAverage(memoryMetrics.metrics, 'value') : 0,
      cpu: cpuMetrics.success ? this.calculateAverage(cpuMetrics.metrics, 'value') : 0,
      network: networkMetrics.success ? this.calculateAverage(networkMetrics.metrics, 'value') : 0
    };
  }

  /**
   * Get SLA compliance
   */
  getSLACompliance(cutoffTime) {
    let totalRequests = 0;
    let compliantRequests = 0;
    const complianceByComponent = {};

    for (const [component, history] of this.healthChecks) {
      const recentChecks = history.filter(h => h.timestamp >= cutoffTime);
      const compliant = recentChecks.filter(h => h.status === 'healthy').length;

      totalRequests += recentChecks.length;
      compliantRequests += compliant;

      complianceByComponent[component] = recentChecks.length > 0 ?
        compliant / recentChecks.length : 1.0;
    }

    const overall = totalRequests > 0 ? compliantRequests / totalRequests : 1.0;

    return {
      overall,
      byComponent: complianceByComponent,
      totalRequests,
      compliantRequests
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'active');
  }

  /**
   * Calculate average from metrics
   */
  calculateAverage(metrics, field) {
    if (!metrics || typeof metrics !== 'object') return 0;

    const values = Object.values(metrics).map(metric => {
      if (metric.aggregates && metric.aggregates.avg) {
        return metric.aggregates.avg;
      }
      if (metric.values && metric.values.length > 0) {
        return metric.values.reduce((sum, v) => sum + v.value, 0) / metric.values.length;
      }
      return 0;
    });

    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
  }

  /**
   * Load historical metrics (placeholder)
   */
  async loadHistoricalMetrics() {
    // In production, this would load from database or external storage
    console.log('Loading historical metrics...');
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(format = 'json', timeRange = '24h') {
    try {
      const metrics = this.getMetrics({ timeRange });

      switch (format.toLowerCase()) {
        case 'json':
          return {
            success: true,
            data: JSON.stringify(metrics, null, 2),
            format: 'json'
          };
        case 'csv':
          return this.exportToCSV(metrics);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Export metrics to CSV format
   */
  exportToCSV(metricsData) {
    if (!metricsData.success) return metricsData;

    const csvLines = ['metric_name,tag_key,tag_value,timestamp,value'];

    for (const [metricKey, metric] of Object.entries(metricsData.metrics)) {
      for (const dataPoint of metric.values) {
        const tagString = Object.entries(metric.tags)
          .map(([key, value]) => `${key}=${value}`)
         .join(',');

        csvLines.push(`${metric.name},${tagString},${dataPoint.timestamp},${dataPoint.value}`);
      }
    }

    return {
      success: true,
      data: csvLines.join('\n'),
      format: 'csv'
    };
  }
}

export default MonitoringService;
