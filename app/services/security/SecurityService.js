/**
 * Advanced Security Service
 * Provides content scanning, automated moderation, spam detection, and compliance tools
 */

import { queryEvents, publishToPool } from "../../lib/nostrClient.js";

class SecurityService {
  constructor() {
    this.moderationRules = new Map();
    this.spamFilters = new Map();
    this.contentScanner = null;
    this.auditLog = [];
    this.blockList = new Set();
    this.watchList = new Set();
    this.complianceRules = new Map();
    this.threatIntelligence = new Map();
  }

  /**
   * Initialize security service with configuration
   */
  async initialize(config = {}) {
    try {
      const {
        enableContentScanning = true,
        enableSpamDetection = true,
        enableAutomatedModeration = true,
        enableCompliance = true,
        strictMode = false,
        customRules = [],
      } = config;

      // Initialize content scanner
      if (enableContentScanning) {
        this.contentScanner = new ContentScanner(strictMode);
      }

      // Load default moderation rules
      await this.loadDefaultModerationRules();

      // Load custom rules if provided
      if (customRules.length > 0) {
        customRules.forEach((rule) => this.addModerationRule(rule));
      }

      // Initialize spam filters
      if (enableSpamDetection) {
        await this.initializeSpamFilters();
      }

      // Initialize compliance rules
      if (enableCompliance) {
        await this.initializeComplianceRules();
      }

      // Load threat intelligence
      await this.loadThreatIntelligence();

      return {
        success: true,
        features: {
          contentScanning: enableContentScanning,
          spamDetection: enableSpamDetection,
          automatedModeration: enableAutomatedModeration,
          compliance: enableCompliance,
        },
        initialized: true,
      };
    } catch (error) {
      console.error("Failed to initialize security service:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Scan content for violations
   */
  async scanContent(event, context = {}) {
    try {
      if (!this.contentScanner) {
        return { safe: true, violations: [] };
      }

      const { content = "", pubkey, kind, tags = [], created_at } = event;

      const scanResult = await this.contentScanner.scan({
        content,
        pubkey,
        kind,
        tags,
        created_at,
        ...context,
      });

      // Log scan result
      this.logSecurityEvent("content_scan", {
        event_id: event.id,
        pubkey,
        kind,
        violations: scanResult.violations,
        risk_score: scanResult.riskScore,
        safe: scanResult.safe,
      });

      return scanResult;
    } catch (error) {
      console.error("Content scanning failed:", error);
      return { safe: true, violations: [], error: error.message };
    }
  }

  /**
   * Automated moderation actions
   */
  async moderateEvent(event, violations) {
    try {
      const actions = [];
      const { pubkey, id: eventId, kind } = event;

      for (const violation of violations) {
        const action = this.determineModerationAction(violation, event);
        if (action) {
          actions.push(action);

          // Execute action
          switch (action.type) {
            case "BLOCK":
              await this.blockUser(pubkey, action.duration, action.reason);
              break;
            case "SHADOW_BAN":
              await this.shadowBanUser(pubkey, action.duration, action.reason);
              break;
            case "CONTENT_DELETE":
              await this.requestContentDeletion(eventId, action.reason);
              break;
            case "CONTENT_HIDE":
              await this.hideContent(eventId, action.reason);
              break;
            case "RATE_LIMIT":
              await this.applyRateLimit(pubkey, action.limit, action.duration);
              break;
            case "REPORT":
              await this.createModerationReport(event, violation);
              break;
          }
        }
      }

      // Log moderation actions
      this.logSecurityEvent("moderation_action", {
        event_id: eventId,
        pubkey,
        kind,
        violations,
        actions,
      });

      return {
        success: true,
        actions,
        moderated: actions.length > 0,
      };
    } catch (error) {
      console.error("Moderation failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect spam and malicious content
   */
  async detectSpam(event) {
    try {
      if (!this.spamFilters.size) {
        return { isSpam: false, score: 0, reasons: [] };
      }

      const { content = "", pubkey, kind, tags = [], created_at } = event;

      let spamScore = 0;
      const reasons = [];

      // Check each spam filter
      for (const [filterName, filter] of this.spamFilters) {
        const result = await filter.check(event);
        if (result.isSpam) {
          spamScore += result.score;
          reasons.push({
            filter: filterName,
            reason: result.reason,
            score: result.score,
          });
        }
      }

      // Check user reputation
      const userReputation = await this.getUserReputation(pubkey);
      if (userReputation.spamScore > 0.7) {
        spamScore += userReputation.spamScore * 0.3;
        reasons.push({
          filter: "user_reputation",
          reason: "Low user reputation",
          score: userReputation.spamScore * 0.3,
        });
      }

      // Check for duplicate content
      const duplicateScore = await this.checkDuplicateContent(event);
      if (duplicateScore > 0) {
        spamScore += duplicateScore;
        reasons.push({
          filter: "duplicate_content",
          reason: "Duplicate or similar content detected",
          score: duplicateScore,
        });
      }

      const isSpam = spamScore > 0.5; // Threshold

      // Log spam detection
      this.logSecurityEvent("spam_detection", {
        event_id: event.id,
        pubkey,
        kind,
        isSpam,
        spamScore,
        reasons,
      });

      return {
        isSpam,
        score: spamScore,
        reasons,
        threshold: 0.5,
      };
    } catch (error) {
      console.error("Spam detection failed:", error);
      return { isSpam: false, score: 0, reasons: [], error: error.message };
    }
  }

  /**
   * Check compliance with regulations and policies
   */
  async checkCompliance(event) {
    try {
      if (!this.complianceRules.size) {
        return { compliant: true, violations: [] };
      }

      const violations = [];
      const { content = "", pubkey, kind, tags = [], created_at } = event;

      // Check each compliance rule
      for (const [ruleName, rule] of this.complianceRules) {
        const result = await rule.check(event);
        if (!result.compliant) {
          violations.push({
            rule: ruleName,
            severity: rule.severity,
            description: result.description,
            requirement: rule.requirement,
          });
        }
      }

      const compliant = violations.length === 0;

      // Log compliance check
      this.logSecurityEvent("compliance_check", {
        event_id: event.id,
        pubkey,
        kind,
        compliant,
        violations,
      });

      return {
        compliant,
        violations,
        totalRules: this.complianceRules.size,
      };
    } catch (error) {
      console.error("Compliance check failed:", error);
      return { compliant: true, violations: [], error: error.message };
    }
  }

  /**
   * Block user from the platform
   */
  async blockUser(
    pubkey,
    duration = null,
    reason = "Violation of community guidelines",
  ) {
    try {
      const blockEvent = {
        kind: 30301, // Custom moderation event
        content: JSON.stringify({
          action: "block",
          target: pubkey,
          reason,
          duration,
          timestamp: Math.floor(Date.now() / 1000),
          expires_at: duration
            ? Math.floor(Date.now() / 1000) + duration
            : null,
        }),
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["moderation", "block"],
          ["p", pubkey],
          ["reason", reason],
        ],
      };

      const result = await publishToPool(
        ["wss://relay.damus.io"],
        blockEvent.content,
        blockEvent.tags,
        blockEvent.kind,
      );

      this.blockList.add(pubkey);

      // Log block action
      this.logSecurityEvent("user_blocked", {
        target_pubkey: pubkey,
        duration,
        reason,
        event_id: result.events[0]?.id,
      });

      return {
        success: true,
        blocked: true,
        pubkey,
        duration,
        reason,
        event_id: result.events[0]?.id,
      };
    } catch (error) {
      console.error("Failed to block user:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Shadow ban user (content hidden but user unaware)
   */
  async shadowBanUser(pubkey, duration = null, reason = "Repeated violations") {
    try {
      const shadowBanEvent = {
        kind: 30302, // Custom shadow ban event
        content: JSON.stringify({
          action: "shadow_ban",
          target: pubkey,
          reason,
          duration,
          timestamp: Math.floor(Date.now() / 1000),
          expires_at: duration
            ? Math.floor(Date.now() / 1000) + duration
            : null,
        }),
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["moderation", "shadow_ban"],
          ["p", pubkey],
          ["reason", reason],
        ],
      };

      const result = await publishToPool(
        ["wss://relay.damus.io"],
        shadowBanEvent.content,
        shadowBanEvent.tags,
        shadowBanEvent.kind,
      );

      this.watchList.add(pubkey);

      this.logSecurityEvent("user_shadow_banned", {
        target_pubkey: pubkey,
        duration,
        reason,
        event_id: result.events[0]?.id,
      });

      return {
        success: true,
        shadowBanned: true,
        pubkey,
        duration,
        reason,
        event_id: result.events[0]?.id,
      };
    } catch (error) {
      console.error("Failed to shadow ban user:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Request deletion of harmful content
   */
  async requestContentDeletion(eventId, reason = "Policy violation") {
    try {
      const deletionEvent = {
        kind: 5, // NIP-09 event deletion
        content: reason,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["e", eventId]],
      };

      const result = await publishToPool(
        ["wss://relay.damus.io"],
        deletionEvent.content,
        deletionEvent.tags,
        deletionEvent.kind,
      );

      this.logSecurityEvent("content_deletion_requested", {
        target_event: eventId,
        reason,
        event_id: result.events[0]?.id,
      });

      return {
        success: true,
        deletionRequested: true,
        eventId,
        reason,
        event_id: result.events[0]?.id,
      };
    } catch (error) {
      console.error("Failed to request content deletion:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Hide content from public view
   */
  async hideContent(eventId, reason = "Content violation") {
    try {
      const hideEvent = {
        kind: 30303, // Custom content hide event
        content: JSON.stringify({
          action: "hide",
          target: eventId,
          reason,
          timestamp: Math.floor(Date.now() / 1000),
        }),
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["moderation", "hide"],
          ["e", eventId],
          ["reason", reason],
        ],
      };

      const result = await publishToPool(
        ["wss://relay.damus.io"],
        hideEvent.content,
        hideEvent.tags,
        hideEvent.kind,
      );

      this.logSecurityEvent("content_hidden", {
        target_event: eventId,
        reason,
        event_id: result.events[0]?.id,
      });

      return {
        success: true,
        hidden: true,
        eventId,
        reason,
        event_id: result.events[0]?.id,
      };
    } catch (error) {
      console.error("Failed to hide content:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply rate limiting to user
   */
  async applyRateLimit(pubkey, limit, duration) {
    try {
      const rateLimitEvent = {
        kind: 30304, // Custom rate limit event
        content: JSON.stringify({
          action: "rate_limit",
          target: pubkey,
          limit,
          duration,
          timestamp: Math.floor(Date.now() / 1000),
          expires_at: Math.floor(Date.now() / 1000) + duration,
        }),
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["moderation", "rate_limit"],
          ["p", pubkey],
          ["limit", limit.toString()],
        ],
      };

      const result = await publishToPool(
        ["wss://relay.damus.io"],
        rateLimitEvent.content,
        rateLimitEvent.tags,
        rateLimitEvent.kind,
      );

      this.logSecurityEvent("rate_limit_applied", {
        target_pubkey: pubkey,
        limit,
        duration,
        event_id: result.events[0]?.id,
      });

      return {
        success: true,
        rateLimited: true,
        pubkey,
        limit,
        duration,
        event_id: result.events[0]?.id,
      };
    } catch (error) {
      console.error("Failed to apply rate limit:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create moderation report
   */
  async createModerationReport(event, violation) {
    try {
      const reportEvent = {
        kind: 30305, // Custom moderation report
        content: JSON.stringify({
          type: "automated_report",
          target_event: event.id,
          target_user: event.pubkey,
          violation: {
            type: violation.type,
            severity: violation.severity,
            description: violation.description,
            evidence: violation.evidence,
          },
          auto_generated: true,
          timestamp: Math.floor(Date.now() / 1000),
        }),
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["moderation", "report"],
          ["e", event.id],
          ["p", event.pubkey],
          ["violation", violation.type],
        ],
      };

      const result = await publishToPool(
        ["wss://relay.damus.io"],
        reportEvent.content,
        reportEvent.tags,
        reportEvent.kind,
      );

      this.logSecurityEvent("moderation_report_created", {
        target_event: event.id,
        target_user: event.pubkey,
        violation_type: violation.type,
        event_id: result.events[0]?.id,
      });

      return {
        success: true,
        reportCreated: true,
        eventId: result.events[0]?.id,
      };
    } catch (error) {
      console.error("Failed to create moderation report:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load default moderation rules
   */
  async loadDefaultModerationRules() {
    const defaultRules = [
      {
        id: "hate_speech",
        type: "content_filter",
        patterns: [
          /\b(hate|racist|nazi|terrorist)\b/gi,
          /\b(kill|murder|violence).*\b(group|people|race)\b/gi,
        ],
        severity: "high",
        action: { type: "BLOCK", duration: 86400 * 30 }, // 30 days
      },
      {
        id: "spam_keywords",
        type: "content_filter",
        patterns: [
          /\b(buy now|click here|free money|guaranteed)\b/gi,
          /\b(bitcoin|crypto).*\b(investment|profit|guarantee)\b/gi,
        ],
        severity: "medium",
        action: { type: "SHADOW_BAN", duration: 86400 * 7 }, // 7 days
      },
      {
        id: "inappropriate_content",
        type: "content_filter",
        patterns: [
          /\b(nude|naked|porn|explicit)\b/gi,
          /\b(drug|cocaine|heroin|marijuana).*\b(sell|buy|deal)\b/gi,
        ],
        severity: "high",
        action: { type: "CONTENT_DELETE", reason: "Inappropriate content" },
      },
      {
        id: "harassment",
        type: "content_filter",
        patterns: [
          /\b(stupid|idiot|moron).*\b(you are|you\'re)\b/gi,
          /\b(kill.*yourself|go die)\b/gi,
        ],
        severity: "high",
        action: { type: "BLOCK", duration: 86400 * 14 }, // 14 days
      },
    ];

    defaultRules.forEach((rule) => this.addModerationRule(rule));
  }

  /**
   * Add moderation rule
   */
  addModerationRule(rule) {
    this.moderationRules.set(rule.id, rule);
  }

  /**
   * Initialize spam filters
   */
  async initializeSpamFilters() {
    this.spamFilters.set("frequency", new FrequencySpamFilter());
    this.spamFilters.set("similarity", new SimilaritySpamFilter());
    this.spamFilters.set("behavioral", new BehavioralSpamFilter());
    this.spamFilters.set("reputation", new ReputationSpamFilter());
  }

  /**
   * Initialize compliance rules
   */
  async initializeComplianceRules() {
    // GDPR compliance
    this.complianceRules.set("gdpr", new GDPRComplianceRule());

    // KYC/AML compliance for financial content
    this.complianceRules.set("kyc_aml", new KYCAMLComplianceRule());

    // Content age verification
    this.complianceRules.set("age_verification", new AgeVerificationRule());
  }

  /**
   * Load threat intelligence
   */
  async loadThreatIntelligence() {
    // Load known malicious actors, spam patterns, etc.
    // In production, this would fetch from threat intelligence feeds
    this.threatIntelligence.set("malicious_pubkeys", new Set());
    this.threatIntelligence.set("spam_patterns", new Map());
    this.threatIntelligence.set("compromised_accounts", new Set());
  }

  /**
   * Determine moderation action based on violation
   */
  determineModerationAction(violation, event) {
    const rule = this.moderationRules.get(violation.ruleId);
    if (!rule) return null;

    // Check user history
    const userReputation = this.getUserReputation(event.pubkey);

    // Escalate if repeat offender
    if (userReputation.violationCount > 3) {
      return {
        type: "BLOCK",
        duration: rule.action.duration * 2,
        reason: `Repeat violation: ${violation.description}`,
      };
    }

    return rule.action;
  }

  /**
   * Get user reputation score
   */
  async getUserReputation(pubkey) {
    // In production, this would query a reputation database
    return {
      spamScore: 0.1,
      violationCount: 0,
      lastViolation: null,
      trustScore: 0.8,
    };
  }

  /**
   * Check for duplicate content
   */
  async checkDuplicateContent(event) {
    // Simple hash-based duplicate detection
    // In production, use more sophisticated similarity algorithms
    const contentHash = this.hashContent(event.content);

    // Check recent events for similar content
    const recentEvents = await queryEvents({
      kinds: [event.kind],
      since: Math.floor(Date.now() / 1000) - 3600, // Last hour
      limit: 100,
    });

    let maxSimilarity = 0;
    for (const recentEvent of recentEvents) {
      const similarity = this.calculateSimilarity(
        event.content,
        recentEvent.content,
      );
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity > 0.8 ? maxSimilarity : 0;
  }

  /**
   * Calculate content similarity
   */
  calculateSimilarity(content1, content2) {
    // Simple Jaccard similarity
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Hash content for duplicate detection
   */
  hashContent(content) {
    // Simple hash function - in production use crypto hash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Log security event
   */
  logSecurityEvent(action, data) {
    const logEntry = {
      timestamp: Math.floor(Date.now() / 1000),
      action,
      data,
    };

    this.auditLog.push(logEntry);

    // Keep log size manageable
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
  }

  /**
   * Get security analytics
   */
  async getSecurityAnalytics(timeframe = "24h") {
    try {
      const now = Math.floor(Date.now() / 1000);
      let since;
      switch (timeframe) {
        case "1h":
          since = now - 3600;
          break;
        case "24h":
          since = now - 86400;
          break;
        case "7d":
          since = now - 604800;
          break;
        case "30d":
          since = now - 2592000;
          break;
        default:
          since = now - 86400;
      }

      const relevantLogs = this.auditLog.filter(
        (log) => log.timestamp >= since,
      );

      const analytics = {
        timeframe,
        summary: {
          totalSecurityEvents: relevantLogs.length,
          contentScans: relevantLogs.filter((l) => l.action === "content_scan")
            .length,
          spamDetections: relevantLogs.filter(
            (l) => l.action === "spam_detection",
          ).length,
          moderationActions: relevantLogs.filter(
            (l) => l.action === "moderation_action",
          ).length,
          userBlocks: relevantLogs.filter((l) => l.action === "user_blocked")
            .length,
          shadowBans: relevantLogs.filter(
            (l) => l.action === "user_shadow_banned",
          ).length,
        },
        topViolations: {},
        hourlyActivity: {},
      };

      // Analyze violations by type
      relevantLogs.forEach((log) => {
        if (log.action === "content_scan" && log.data.violations) {
          log.data.violations.forEach((violation) => {
            analytics.topViolations[violation.type] =
              (analytics.topViolations[violation.type] || 0) + 1;
          });
        }

        // Hourly breakdown
        const hour = Math.floor(log.timestamp / 3600) * 3600;
        analytics.hourlyActivity[hour] =
          (analytics.hourlyActivity[hour] || 0) + 1;
      });

      return {
        success: true,
        analytics,
        generated_at: now,
      };
    } catch (error) {
      console.error("Failed to get security analytics:", error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Content Scanner Class
 */
class ContentScanner {
  constructor(strictMode = false) {
    this.strictMode = strictMode;
    this.violationPatterns = new Map();
    this.initializePatterns();
  }

  initializePatterns() {
    this.violationPatterns.set("hate_speech", [
      { pattern: /\b(hate|racist|nazi)\b/gi, severity: "high" },
      { pattern: /\b(kill.*\b(group|people|race))\b/gi, severity: "critical" },
    ]);

    this.violationPatterns.set("spam", [
      { pattern: /\b(buy now|click here|free money)\b/gi, severity: "medium" },
      { pattern: /(http|https):\/\/[^\s]+/g, severity: "low" }, // Excessive links
    ]);

    this.violationPatterns.set("inappropriate", [
      { pattern: /\b(nude|naked|porn)\b/gi, severity: "high" },
      { pattern: /\b(drug.*\b(sell|buy|deal))\b/gi, severity: "medium" },
    ]);
  }

  async scan(contentData) {
    const violations = [];
    let totalRiskScore = 0;

    const { content, tags } = contentData;

    // Scan text content
    for (const [violationType, patterns] of this.violationPatterns) {
      for (const { pattern, severity } of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          violations.push({
            type: violationType,
            severity,
            count: matches.length,
            evidence: matches.slice(0, 3), // Store first 3 matches
            pattern: pattern.source,
          });

          totalRiskScore += this.calculateRiskScore(severity, matches.length);
        }
      }
    }

    // Check for suspicious tags
    if (tags) {
      const suspiciousTags = this.scanTags(tags);
      violations.push(...suspiciousTags);
    }

    const riskScore = Math.min(totalRiskScore, 1.0); // Cap at 1.0
    const safe = riskScore < (this.strictMode ? 0.2 : 0.5);

    return {
      safe,
      riskScore,
      violations,
      scannedAt: Math.floor(Date.now() / 1000),
    };
  }

  scanTags(tags) {
    const violations = [];

    // Check for excessive tagging (potential spam)
    if (tags.length > 20) {
      violations.push({
        type: "excessive_tagging",
        severity: "medium",
        count: tags.length,
        evidence: `Found ${tags.length} tags`,
      });
    }

    return violations;
  }

  calculateRiskScore(severity, count) {
    const severityWeights = {
      low: 0.1,
      medium: 0.3,
      high: 0.6,
      critical: 0.9,
    };

    return (severityWeights[severity] || 0.3) * Math.min(count / 3, 1);
  }
}

/**
 * Spam Filter Classes
 */
class FrequencySpamFilter {
  constructor() {
    this.recentPosts = new Map();
  }

  async check(event) {
    const { pubkey, created_at } = event;
    const now = Math.floor(Date.now() / 1000);
    const hour = Math.floor(now / 3600);

    if (!this.recentPosts.has(pubkey)) {
      this.recentPosts.set(pubkey, []);
    }

    const posts = this.recentPosts.get(pubkey);
    const recentPosts = posts.filter((timestamp) => timestamp > now - 3600);

    if (recentPosts.length > 10) {
      // More than 10 posts per hour
      return {
        isSpam: true,
        score: 0.8,
        reason: "Excessive posting frequency",
      };
    }

    recentPosts.push(created_at);
    this.recentPosts.set(pubkey, recentPosts);

    return { isSpam: false, score: 0 };
  }
}

class SimilaritySpamFilter {
  constructor() {
    this.contentCache = new Map();
  }

  async check(event) {
    const { content, pubkey } = event;
    const contentHash = this.hashContent(content);

    // Check if very similar content was posted recently
    for (const [cachedPubkey, cachedContent] of this.contentCache) {
      if (cachedPubkey !== pubkey) continue;

      const similarity = this.calculateSimilarity(
        content,
        cachedContent.content,
      );
      if (similarity > 0.9) {
        return {
          isSpam: true,
          score: 0.7,
          reason: "Duplicate or very similar content detected",
        };
      }
    }

    this.contentCache.set(pubkey, { content, timestamp: Date.now() });

    return { isSpam: false, score: 0 };
  }

  hashContent(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  calculateSimilarity(content1, content2) {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}

class BehavioralSpamFilter {
  async check(event) {
    // Check for behavioral patterns indicating spam
    const { content, tags } = event;

    let spamScore = 0;
    let reasons = [];

    // Check for all caps
    if (content === content.toUpperCase() && content.length > 20) {
      spamScore += 0.3;
      reasons.push("Excessive capitalization");
    }

    // Check for excessive punctuation
    const punctuationCount = (content.match(/[!?.]/g) || []).length;
    if (punctuationCount > 5) {
      spamScore += 0.2;
      reasons.push("Excessive punctuation");
    }

    // Check for repetitive characters
    if (/(.)\1{4,}/.test(content)) {
      spamScore += 0.3;
      reasons.push("Repetitive characters");
    }

    return {
      isSpam: spamScore > 0.5,
      score: spamScore,
      reason: reasons.join(", "),
    };
  }
}

class ReputationSpamFilter {
  async check(event) {
    // In production, this would check against a reputation database
    return { isSpam: false, score: 0 };
  }
}

/**
 * Compliance Rule Classes
 */
class GDPRComplianceRule {
  constructor() {
    this.severity = "high";
    this.requirement = "GDPR compliance";
  }

  async check(event) {
    const { content } = event;

    // Check for personal data sharing
    const personalDataPatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/, // SSN pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    ];

    for (const pattern of personalDataPatterns) {
      if (pattern.test(content)) {
        return {
          compliant: false,
          description: "Potential personal data detected in content",
        };
      }
    }

    return { compliant: true };
  }
}

class KYCAMLComplianceRule {
  constructor() {
    this.severity = "critical";
    this.requirement = "KYC/AML compliance";
  }

  async check(event) {
    const { content, kind } = event;

    // Check for financial transactions that might require KYC
    if (kind === 9735 || kind === 9734) {
      // Zap events
      // Check for large amounts that might trigger AML requirements
      const largeAmountPattern = /\b\d{4,}\b/;
      if (largeAmountPattern.test(content)) {
        return {
          compliant: false,
          description:
            "Large financial transaction detected - KYC verification required",
        };
      }
    }

    return { compliant: true };
  }
}

class AgeVerificationRule {
  constructor() {
    this.severity = "medium";
    this.requirement = "Age verification compliance";
  }

  async check(event) {
    const { content } = event;

    // Check for age-restricted content
    const adultContentPatterns = [
      /\b(alcohol|beer|wine|whiskey)\b/gi,
      /\b(gambling|bet|casino)\b/gi,
      /\b(tobacco|smoking|cigarette)\b/gi,
    ];

    for (const pattern of adultContentPatterns) {
      if (pattern.test(content)) {
        return {
          compliant: false,
          description:
            "Age-restricted content detected - age verification required",
        };
      }
    }

    return { compliant: true };
  }
}

export default SecurityService;
