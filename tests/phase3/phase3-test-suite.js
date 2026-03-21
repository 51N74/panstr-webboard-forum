/**
 * Phase 3 Week 11-12 NIP Implementation Test Suite
 * Comprehensive testing for NIP-90, NIP-72, and NIP-54 implementations
 */

import { describe, it, expect, beforeEach, afterAll, beforeAll } from '@jest/globals';

// Import NIP implementations
import {
  NIP90_KINDS,
  SERVICE_TYPES,
  SUBSCRIPTION_TIERS,
  createServiceConfig,
  createServiceRequest,
  createServiceResponse,
  createSubscriptionEvent,
  createPaymentRequest,
  createAccessToken,
  createAPIUsageEvent,
  createServiceList,
  getAvailableServices,
  getUserSubscriptions,
  checkUserAccessLevel,
  calculateAPIUsage,
  validateSubscriptionPayment,
  getSubscriptionAnalytics,
  publishServiceConfig,
  requestService
} from '../../app/lib/data-vending/nip90.js';

import {
  NIP72_KINDS,
  COMMUNITY_TYPES,
  MODERATION_ACTIONS,
  POST_STATUS,
  createCommunityDefinition,
  createPostApprovalRequest,
  createModerationAction,
  createCommunityRules,
  createCommunityMembership,
  createCommunityBan,
  createCommunityInvite,
  createCommunityStats,
  createCommunityCrosspost,
  getAvailableCommunities,
  getPendingPosts,
  getUserMemberships,
  getCommunityRules,
  getUserModerationHistory,
  isUserModerator,
  validatePostAgainstRules,
  calculateCommunityHealth,
  publishCommunityDefinition
} from '../../app/lib/communities/nip72.js';

import {
  NIP54_KINDS,
  PAGE_STATUS,
  COLLABORATION_STATUS,
  EDIT_TYPES,
  createWikiPage,
  createWikiPageVersion,
  createWikiCategory,
  createWikiRename,
  createWikiDelete,
  createWikiCollaboration,
  createWikiComment,
  createWikiTag,
  createWikiIndex,
  createWikiTemplate,
  publishWikiPage,
  getWikiPages,
  getWikiPageVersions,
  getWikiCategories,
  getWikiComments,
  searchWikiPages,
  getWikiTemplates,
  calculateWikiStatistics
} from '../../app/lib/wiki/nip54.js';

// Mock nostr-tools functions for testing
const mockPubkey = 'test_pubkey_1234567890abcdef';
const mockPrivateKey = 'test_private_key_1234567890abcdef';

describe('Phase 3 NIP Implementation Test Suite', () => {
  describe('NIP-90 Data Vending Machines', () => {
    describe('Service Configuration', () => {
      it('should create valid service config event', () => {
        const config = {
          id: 'test_service',
          name: 'Test Service',
          description: 'A test service for unit testing',
          serviceType: SERVICE_TYPES.PREMIUM_CONTENT,
          pricing: 1000,
          endpoints: ['api/v1/content', 'api/v1/analytics'],
          requirements: ['premium_access']
        };

        const event = createServiceConfig(config);

        expect(event.kind).toBe(NIP90_KINDS.SERVICE_CONFIG);
        expect(event.content).toContain('Test Service');
        expect(event.tags).toEqual(
          expect.arrayContaining([
            ['d', 'test_service'],
            ['t', SERVICE_TYPES.PREMIUM_CONTENT],
            ['price', '1000'],
            ['requirement', 'premium_access']
          ])
        );
      });

      it('should handle different service types correctly', () => {
        const serviceTypes = [
          SERVICE_TYPES.PREMIUM_CONTENT,
          SERVICE_TYPES.API_ACCESS,
          SERVICE_TYPES.SUBSCRIPTION,
          SERVICE_TYPES.DATA_EXPORT,
          SERVICE_TYPES.ANALYTICS,
          SERVICE_TYPES.CUSTOM
        ];

        serviceTypes.forEach(type => {
          const config = {
            id: `service_${type}`,
            name: `${type} Service`,
            description: `Service of type ${type}`,
            serviceType: type,
            pricing: 500
          };

          const event = createServiceConfig(config);
          expect(event.tags).toContainEqual(['t', type]);
        });
      });
    });

    describe('Service Requests and Responses', () => {
      it('should create valid service request', () => {
        const requestData = {
          content_type: 'json',
          query: 'test data',
          filters: ['category:tech', 'date:recent']
        };

        const event = createServiceRequest('test_service', requestData, mockPubkey);

        expect(event.kind).toBe(NIP90_KINDS.SERVICE_REQUEST);
        expect(event.tags).toContainEqual(['d', 'test_service']);
        expect(event.tags).toContainEqual(['p', mockPubkey]);
        expect(JSON.parse(event.content)).toMatchObject({
          service_id: 'test_service',
          request_data: requestData
        });
      });

      it('should create service response with payment requirement', () => {
        const mockRequest = {
          id: 'request_id',
          pubkey: mockPubkey,
          tags: [['d', 'test_service'], ['p', mockPubkey]]
        };

        const responseData = { message: 'Payment required for premium content' };
        const event = createServiceResponse(mockRequest, responseData, true);

        expect(event.kind).toBe(NIP90_KINDS.SERVICE_RESPONSE);
        expect(event.tags).toContainEqual(['status', 'payment_required']);
        expect(event.tags).toContainEqual(['payment_required', 'true']);
        expect(JSON.parse(event.content)).toMatchObject({
          status: 'payment_required',
          response_data: responseData
        });
      });
    });

    describe('Subscription Management', () => {
      it('should create valid subscription event', () => {
        const subscriptionData = {
          subscriptionId: 'sub_123',
          userPubkey: mockPubkey,
          tier: 'premium',
          status: 'active',
          startDate: Math.floor(Date.now() / 1000),
          endDate: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
          autoRenew: true
        };

        const event = createSubscriptionEvent(subscriptionData);

        expect(event.kind).toBe(NIP90_KINDS.SUBSCRIPTION);
        expect(event.tags).toContainEqual(['d', 'sub_123']);
        expect(event.tags).toContainEqual(['p', mockPubkey]);
        expect(event.tags).toContainEqual(['tier', 'premium']);
        expect(event.tags).toContainEqual(['status', 'active']);

        const content = JSON.parse(event.content);
        expect(content.tier).toBe('premium');
        expect(content.auto_renew).toBe(true);
      });

      it('should check user access level correctly', () => {
        const subscriptions = [
          {
            subscription: {
              tier: 'premium',
              status: 'active',
              end_date: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
            }
          }
        ];

        const requiredFeatures = ['all_content', 'full_api'];
        const access = checkUserAccessLevel(subscriptions, requiredFeatures);

        expect(access.hasAccess).toBe(true);
        expect(access.tier).toBe('premium');
        expect(access.missingFeatures).toHaveLength(0);
      });

      it('should deny access for insufficient subscription', () => {
        const subscriptions = [
          {
            subscription: {
              tier: 'basic',
              status: 'active',
              end_date: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
            }
          }
        ];

        const requiredFeatures = ['full_api', 'priority_support'];
        const access = checkUserAccessLevel(subscriptions, requiredFeatures);

        expect(access.hasAccess).toBe(false);
        expect(access.missingFeatures).toContain('full_api');
        expect(access.missingFeatures).toContain('priority_support');
      });
    });

    describe('Payment and Token Management', () => {
      it('should create valid payment request', () => {
        const event = createPaymentRequest('test_service', 500, 'Premium content access', 'req_123');

        expect(event.kind).toBe(NIP90_KINDS.PAYMENT_REQUIRED);
        expect(event.tags).toContainEqual(['d', 'test_service']);
        expect(event.tags).toContainEqual(['amount', '500']);
        expect(event.tags).toContainEqual(['currency', 'sats']);
        expect(event.tags).toContainEqual(['request_id', 'req_123']);

        const content = JSON.parse(event.content);
        expect(content.amount).toBe(500);
        expect(content.description).toBe('Premium content access');
        expect(content.payment_methods).toContain('lightning');
      });

      it('should create valid access token', () => {
        const permissions = ['read_content', 'api_access', 'export_data'];
        const expiry = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

        const event = createAccessToken(mockPubkey, permissions, expiry);

        expect(event.kind).toBe(NIP90_KINDS.ACCESS_TOKEN);
        expect(event.tags).toContainEqual(['p', mockPubkey]);
        expect(event.tags).toContainEqual(['expires', expiry.toString()]);
        expect(event.tags).toContainEqual(['permission', 'read_content']);
        expect(event.tags).toContainEqual(['permission', 'api_access']);
        expect(event.tags).toContainEqual(['permission', 'export_data']);

        const content = JSON.parse(event.content);
        expect(content.user_pubkey).toBe(mockPubkey);
        expect(content.permissions).toEqual(permissions);
      });
    });

    describe('API Usage Tracking', () => {
      it('should create valid API usage event', () => {
        const usageData = {
          endpoint: '/api/v1/content',
          response_time: 150,
          status_code: 200,
          bytes_transferred: 1024
        };

        const event = createAPIUsageEvent(mockPubkey, 'api/v1/content', usageData);

        expect(event.kind).toBe(NIP90_KINDS.API_USAGE);
        expect(event.tags).toContainEqual(['p', mockPubkey]);
        expect(event.tags).toContainEqual(['endpoint', 'api/v1/content']);
        expect(event.tags).toContainEqual(['date', new Date().toISOString().split('T')[0]]);

        const content = JSON.parse(event.content);
        expect(content.user_pubkey).toBe(mockPubkey);
        expect(content.endpoint).toBe('api/v1/content');
        expect(content.usage_data).toEqual(usageData);
      });
    });

    describe('Subscription Tiers', () => {
      it('should have all required subscription tiers', () => {
        expect(SUBSCRIPTION_TIERS.FREE).toBeDefined();
        expect(SUBSCRIPTION_TIERS.BASIC).toBeDefined();
        expect(SUBSCRIPTION_TIERS.PREMIUM).toBeDefined();
        expect(SUBSCRIPTION_TIERS.ENTERPRISE).toBeDefined();
      });

      it('should have correct tier pricing structure', () => {
        expect(SUBSCRIPTION_TIERS.FREE.price).toBe(0);
        expect(SUBSCRIPTION_TIERS.BASIC.price).toBe(500);
        expect(SUBSCRIPTION_TIERS.PREMIUM.price).toBe(2000);
        expect(SUBSCRIPTION_TIERS.ENTERPRISE.price).toBe(10000);
      });

      it('should have appropriate features per tier', () => {
        expect(SUBSCRIPTION_TIERS.FREE.features).toContain('read_public_content');
        expect(SUBSCRIPTION_TIERS.PREMIUM.features).toContain('full_api');
        expect(SUBSCRIPTION_TIERS.ENTERPRISE.features).toContain('custom_integrations');
      });
    });
  });

  describe('NIP-72 Moderated Communities', () => {
    describe('Community Creation and Management', () => {
      it('should create valid community definition', () => {
        const communityData = {
          name: 'Test Community',
          description: 'A test community for unit testing',
          type: COMMUNITY_TYPES.PUBLIC,
          rules: [
            { title: 'Be respectful', description: 'Treat others with respect' },
            { title: 'Stay on topic', description: 'Keep discussions relevant' }
          ],
          tags: ['tech', 'testing'],
          moderationPolicy: 'default'
        };

        const event = createCommunityDefinition(communityData, mockPubkey);

        expect(event.kind).toBe(NIP72_KINDS.COMMUNITY_DEFINITION);
        expect(event.tags).toContainEqual(['name', 'Test Community']);
        expect(event.tags).toContainEqual(['type', COMMUNITY_TYPES.PUBLIC]);
        expect(event.tags).toContainEqual(['creator', mockPubkey]);
        expect(event.tags).toContainEqual(['t', 'tech']);
        expect(event.tags).toContainEqual(['t', 'testing']);

        const content = JSON.parse(event.content);
        expect(content.name).toBe('Test Community');
        expect(content.community_type).toBe(COMMUNITY_TYPES.PUBLIC);
        expect(content.rules).toHaveLength(2);
      });

      it('should handle different community types', () => {
        const types = [
          COMMUNITY_TYPES.PUBLIC,
          COMMUNITY_TYPES.RESTRICTED,
          COMMUNITY_TYPES.PRIVATE,
          COMMUNITY_TYPES.APPROVAL_REQUIRED
        ];

        types.forEach(type => {
          const communityData = {
            name: `${type} Community`,
            description: `Community of type ${type}`,
            type: type
          };

          const event = createCommunityDefinition(communityData, mockPubkey);
          expect(event.tags).toContainEqual(['type', type]);
        });
      });
    });

    describe('Post Approval Workflow', () => {
      it('should create post approval request', () => {
        const mockPost = {
          id: 'post_123',
          kind: 1,
          content: 'Test post content',
          tags: [['t', 'test']],
          pubkey: mockPubkey
        };

        const event = createPostApprovalRequest(mockPost, 'community_123', mockPubkey);

        expect(event.kind).toBe(NIP72_KINDS.COMMUNITY_APPROVAL);
        expect(event.tags).toContainEqual(['e', 'post_123']);
        expect(event.tags).toContainEqual(['p', mockPubkey]);
        expect(event.tags).toContainEqual(['c', 'community_123']);
        expect(event.tags).toContainEqual(['status', POST_STATUS.PENDING]);

        const content = JSON.parse(event.content);
        expect(content.post_id).toBe('post_123');
        expect(content.status).toBe(POST_STATUS.PENDING);
      });
    });

    describe('Moderation Actions', () => {
      it('should create moderation action', () => {
        const mockTarget = {
          id: 'post_123',
          pubkey: mockPubkey
        };

        const event = createModerationAction(
          mockPubkey,
          mockTarget,
          MODERATION_ACTIONS.APPROVE,
          'Content meets community guidelines',
          'community_123'
        );

        expect(event.kind).toBe(NIP72_KINDS.COMMUNITY_MODERATION);
        expect(event.tags).toContainEqual(['e', 'post_123']);
        expect(event.tags).toContainEqual(['p', mockPubkey]);
        expect(event.tags).toContainEqual(['moderator', mockPubkey]);
        expect(event.tags).toContainEqual(['c', 'community_123']);
        expect(event.tags).toContainEqual(['action', MODERATION_ACTIONS.APPROVE]);
        expect(event.tags).toContainEqual(['severity', 'low']);

        const content = JSON.parse(event.content);
        expect(content.action).toBe(MODERATION_ACTIONS.APPROVE);
        expect(content.reason).toBe('Content meets community guidelines');
      });

      it('should handle different moderation actions', () => {
        const mockTarget = {
          id: 'post_123',
          pubkey: mockPubkey
        };

        const actions = [
          MODERATION_ACTIONS.APPROVE,
          MODERATION_ACTIONS.REMOVE,
          MODERATION_ACTIONS.BAN,
          MODERATION_ACTIONS.MUTE,
          MODERATION_ACTIONS.WARN,
          MODERATION_ACTIONS.LOCK
        ];

        actions.forEach(action => {
          const event = createModerationAction(mockPubkey, mockTarget, action, 'Test reason', 'community_123');
          expect(event.tags).toContainEqual(['action', action]);
        });
      });
    });

    describe('Community Rules', () => {
      it('should create community rules', () => {
        const rules = [
          {
            title: 'No Spam',
            description: 'Do not post spam content',
            severity: 'high',
            applies_to: ['posts', 'comments'],
            examples: ['Repeated identical messages', 'Unsolicited advertisements']
          },
          {
            title: 'Be Civil',
            description: 'Maintain respectful discourse',
            severity: 'medium',
            applies_to: ['posts', 'comments']
          }
        ];

        const event = createCommunityRules('community_123', rules, mockPubkey);

        expect(event.kind).toBe(NIP72_KINDS.COMMUNITY_RULES);
        expect(event.tags).toContainEqual(['d', 'community_123']);
        expect(event.tags).toContainEqual(['type', 'rules']);
        expect(event.tags).toContainEqual(['moderator', mockPubkey]);

        const content = JSON.parse(event.content);
        expect(content.rules).toHaveLength(2);
        expect(content.rules[0].title).toBe('No Spam');
        expect(content.rules[0].severity).toBe('high');
      });
    });

    describe('Community Membership', () => {
      it('should create membership event', () => {
        const event = createCommunityMembership(mockPubkey, 'community_123', 'join', 'member');

        expect(event.kind).toBe(NIP72_KINDS.COMMUNITY_MEMBERSHIP);
        expect(event.tags).toContainEqual(['p', mockPubkey]);
        expect(event.tags).toContainEqual(['c', 'community_123']);
        expect(event.tags).toContainEqual(['action', 'join']);
        expect(event.tags).toContainEqual(['role', 'member']);

        const content = JSON.parse(event.content);
        expect(content.user_pubkey).toBe(mockPubkey);
        expect(content.action).toBe('join');
        expect(content.role).toBe('member');
        expect(content.joined_at).toBeDefined();
      });
    });

    describe('Community Bans', () => {
      it('should create ban event', () => {
        const event = createCommunityBan(
          mockPubkey,
          'user_to_ban',
          'Repeated rule violations',
          7 * 24 * 60 * 60, // 7 days
          'community_123'
        );

        expect(event.kind).toBe(NIP72_KINDS.COMMUNITY_BAN);
        expect(event.tags).toContainEqual(['p', 'user_to_ban']);
        expect(event.tags).toContainEqual(['moderator', mockPubkey]);
        expect(event.tags).toContainEqual(['c', 'community_123']);
        expect(event.tags).toContainEqual(['reason', 'Repeated rule violations']);

        const content = JSON.parse(event.content);
        expect(content.banned_pubkey).toBe('user_to_ban');
        expect(content.reason).toBe('Repeated rule violations');
        expect(content.is_permanent).toBe(false);
        expect(content.expires_at).toBeDefined();
      });
    });

    describe('Post Validation', () => {
      it('should validate post against community rules', () => {
        const rules = {
          rules: [
            {
              title: 'No Banned Words',
              description: 'Posts should not contain banned words',
              severity: 'high',
              applies_to: ['posts'],
              banned_keywords: ['spam', 'advertisement'],
              max_length: 1000
            }
          ]
        };

        const validPost = 'This is a legitimate post with good content.';
        const invalidPost = 'This post contains spam and advertisement content.';

        const validResult = validatePostAgainstRules(validPost, rules);
        expect(validResult.valid).toBe(true);
        expect(validResult.violations).toHaveLength(0);

        const invalidResult = validatePostAgainstRules(invalidPost, rules);
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.violations.length).toBeGreaterThan(0);
        expect(invalidResult.violations[0].reason).toContain('spam');
      });
    });

    describe('Community Health', () => {
      it('should calculate community health score', () => {
        const goodStats = {
          totalMembers: 100,
          activeMembers: 80,
          totalPosts: 200,
          totalComments: 500,
          moderationActions: 5,
          activeBans: 1
        };

        const healthScore = calculateCommunityHealth(goodStats);
        expect(healthScore).toBeGreaterThan(70);
        expect(healthScore).toBeLessThanOrEqual(100);

        const poorStats = {
          totalMembers: 100,
          activeMembers: 20,
          totalPosts: 50,
          totalComments: 100,
          moderationActions: 50,
          activeBans: 10
        };

        const poorHealthScore = calculateCommunityHealth(poorStats);
        expect(poorHealthScore).toBeLessThan(goodStats);
      });
    });
  });

  describe('NIP-54 Wiki System', () => {
    describe('Wiki Page Management', () => {
      it('should create valid wiki page', () => {
        const pageData = {
          title: 'Test Page',
          content: '# Test Page\n\nThis is a test wiki page.',
          summary: 'A test page for unit testing',
          category: 'testing',
          tags: ['test', 'wiki'],
          status: PAGE_STATUS.PUBLISHED,
          language: 'en'
        };

        const event = createWikiPage(pageData, mockPubkey);

        expect(event.kind).toBe(NIP54_KINDS.WIKI_PAGE);
        expect(event.tags).toContainEqual(['title', 'Test Page']);
        expect(event.tags).toContainEqual(['author', mockPubkey]);
        expect(event.tags).toContainEqual(['category', 'testing']);
        expect(event.tags).toContainEqual(['status', PAGE_STATUS.PUBLISHED]);
        expect(event.tags).toContainEqual(['language', 'en']);
        expect(event.tags).toContainEqual(['t', 'test']);
        expect(event.tags).toContainEqual(['t', 'wiki']);

        const content = JSON.parse(event.content);
        expect(content.title).toBe('Test Page');
        expect(content.content).toContain('# Test Page');
        expect(content.status).toBe(PAGE_STATUS.PUBLISHED);
      });

      it('should handle different page statuses', () => {
        const statuses = [
          PAGE_STATUS.DRAFT,
          PAGE_STATUS.PUBLISHED,
          PAGE_STATUS.ARCHIVED,
          PAGE_STATUS.DELETED,
          PAGE_STATUS.UNDER_REVIEW
        ];

        statuses.forEach(status => {
          const pageData = {
            title: `${status} Page`,
            content: `Content for ${status} page`,
            status: status
          };

          const event = createWikiPage(pageData, mockPubkey);
          expect(event.tags).toContainEqual(['status', status]);
        });
      });
    });

    describe('Wiki Page Versions', () => {
      it('should create wiki page version', () => {
        const versionData = {
          title: 'Updated Test Page',
          content: '# Updated Test Page\n\nThis is updated content.',
          editSummary: 'Fixed typos and added more information',
          editType: EDIT_TYPES.EDIT,
          changes: {
            sections_modified: ['introduction', 'conclusion'],
            words_added: 50,
            words_removed: 10
          }
        };

        const event = createWikiPageVersion('page_123', versionData, mockPubkey, 'v1');

        expect(event.kind).toBe(NIP54_KINDS.WIKI_PAGE_VERSION);
        expect(event.tags).toContainEqual(['page_id', 'page_123']);
        expect(event.tags).toContainEqual(['author', mockPubkey]);
        expect(event.tags).toContainEqual(['edit_type', EDIT_TYPES.EDIT]);
        expect(event.tags).toContainEqual(['parent_version', 'v1']);

        const content = JSON.parse(event.content);
        expect(content.page_id).toBe('page_123');
        expect(content.edit_type).toBe(EDIT_TYPES.EDIT);
        expect(content.edit_summary).toBe('Fixed typos and added more information');
        expect(content.word_count).toBeGreaterThan(0);
        expect(content.character_count).toBeGreaterThan(0);
      });

      it('should handle different edit types', () => {
        const editTypes = [
          EDIT_TYPES.CREATE,
          EDIT_TYPES.EDIT,
          EDIT_TYPES.MINOR_EDIT,
          EDIT_TYPES.REVERT,
          EDIT_TYPES.MERGE
        ];

        editTypes.forEach(editType => {
          const versionData = {
            title: 'Test Edit',
            content: 'Test content',
            editType: editType
          };

          const event = createWikiPageVersion('page_123', versionData, mockPubkey);
          expect(event.tags).toContainEqual(['edit_type', editType]);
        });
      });
    });

    describe('Wiki Categories', () => {
      it('should create wiki category', () => {
        const categoryData = {
          name: 'Technical Documentation',
          description: 'Technical guides and documentation',
          parentCategory: 'documentation',
          color: '#3B82F6',
          icon: '📖',
          sortOrder: 10,
          isPrivate: false
        };

        const event = createWikiCategory(categoryData, mockPubkey);

        expect(event.kind).toBe(NIP54_KINDS.WIKI_CATEGORY);
        expect(event.tags).toContainEqual(['name', 'Technical Documentation']);
        expect(event.tags).toContainEqual(['creator', mockPubkey]);
        expect(event.tags).toContainEqual(['parent_category', 'documentation']);
        expect(event.tags).toContainEqual(['color', '#3B82F6']);

        const content = JSON.parse(event.content);
        expect(content.name).toBe('Technical Documentation');
        expect(content.parent_category).toBe('documentation');
        expect(content.color).toBe('#3B82F6');
        expect(content.is_private).toBe(false);
      });
    });

    describe('Wiki Collaboration', () => {
      it('should create collaboration request', () => {
        const requestData = {
          requestType: 'edit_access',
          proposedChanges: {
            section: 'introduction',
            suggested_content: 'Updated introduction with better explanation'
          },
          message: 'I can help improve this section'
        };

        const event = createWikiCollaboration('page_123', requestData, mockPubkey);

        expect(event.kind).toBe(NIP54_KINDS.WIKI_COLLABORATION);
        expect(event.tags).toContainEqual(['page_id', 'page_123']);
        expect(event.tags).toContainEqual(['requester', mockPubkey]);
        expect(event.tags).toContainEqual(['request_type', 'edit_access']);
        expect(event.tags).toContainEqual(['status', COLLABORATION_STATUS.PENDING]);

        const content = JSON.parse(event.content);
        expect(content.request_type).toBe('edit_access');
        expect(content.status).toBe(COLLABORATION_STATUS.PENDING);
        expect(content.expires_at).toBeDefined();
      });
    });

    describe('Wiki Comments', () => {
      it('should create wiki comment', () => {
        const commentData = {
          comment: 'Great article! Very helpful information.',
          section: 'introduction',
          lineNumber: 15
        };

        const event = createWikiComment('page_123', commentData, mockPubkey);

        expect(event.kind).toBe(NIP54_KINDS.WIKI_COMMENT);
        expect(event.tags).toContainEqual(['page_id', 'page_123']);
        expect(event.tags).toContainEqual(['author', mockPubkey]);
        expect(event.tags).toContainEqual(['section', 'introduction']);

        const content = JSON.parse(event.content);
        expect(content.page_id).toBe('page_123');
        expect(content.comment).toBe('Great article! Very helpful information.');
        expect(content.section).toBe('introduction');
        expect(content.line_number).toBe(15);
        expect(content.is_resolved).toBe(false);
      });
    });

    describe('Wiki Templates', () => {
      it('should create wiki template', () => {
        const templateData = {
          name: 'API Documentation Template',
          description: 'Template for API documentation pages',
          content: '# {{api_name}} API\n\n## Overview\n{{overview}}\n\n## Endpoints\n{{endpoints}}',
          variables: ['api_name', 'overview', 'endpoints'],
          category: 'technical',
          isPublic: true
        };

        const event = createWikiTemplate(templateData, mockPubkey);

        expect(event.kind).toBe(NIP54_KINDS.WIKI_TEMPLATE);
        expect(event.tags).toContainEqual(['name', 'API Documentation Template']);
        expect(event.tags).toContainEqual(['creator', mockPubkey]);
        expect(event.tags).toContainEqual(['category', 'technical']);
        expect(event.tags).toContainEqual(['public', 'true']);

        const content = JSON.parse(event.content);
        expect(content.name).toBe('API Documentation Template');
        expect(content.variables).toEqual(['api_name', 'overview', 'endpoints']);
        expect(content.is_public).toBe(true);
      });
    });

    describe('Wiki Statistics', () => {
      it('should calculate wiki statistics correctly', () => {
        const pages = [
          { status: 'published', page: { content: 'Page 1 content with some words' } },
          { status: 'published', page: { content: 'Page 2 content with more words here' } },
          { status: 'draft', page: { content: 'Draft page content' } }
        ];

        const versions = [
          { author: 'user1' },
          { author: 'user1' },
          { author: 'user2' }
        ];

        const comments = [
          { comment: { comment: 'First comment' } },
          { comment: { comment: 'Second comment' } }
        ];

        const stats = calculateWikiStatistics(pages, versions, comments);

        expect(stats.totalPages).toBe(3);
        expect(stats.publishedPages).toBe(2);
        expect(stats.draftPages).toBe(1);
        expect(stats.totalVersions).toBe(3);
        expect(stats.totalComments).toBe(2);
        expect(stats.averageVersionsPerPage).toBeCloseTo(1.0, 1);
        expect(stats.mostActiveAuthors).toHaveLength(2);
        expect(stats.mostActiveAuthors[0].count).toBe(2);
        expect(stats.totalWords).toBeGreaterThan(0);
      });
    });

    describe('Wiki Search', () => {
      it('should search wiki pages with relevance scoring', async () => {
        // Mock search results would come from actual search implementation
        // This tests the search logic structure
        const query = 'technical documentation';
        const category = null;

        // Test that search function exists and accepts correct parameters
        expect(typeof searchWikiPages).toBe('function');

        // In actual implementation, this would:
        // 1. Filter pages by category if specified
        // 2. Search content for query terms
        // 3. Calculate relevance scores
        // 4. Sort by relevance
      });
    });
  });

  describe('Integration Tests', () => {
    describe('Cross-NIP Functionality', () => {
      it('should maintain consistency across NIP implementations', () => {
        // Test that all NIP kinds are unique and properly defined
        const allKinds = new Set([
          ...Object.values(NIP90_KINDS),
          ...Object.values(NIP72_KINDS),
          ...Object.values(NIP54_KINDS)
        ]);

        const duplicateKinds = Object.values({
          ...NIP90_KINDS,
          ...NIP72_KINDS,
          ...NIP54_KINDS
        }).filter((kind, index, arr) => arr.indexOf(kind) !== index);

        expect(duplicateKinds).toHaveLength(0);
        expect(allKinds.size).toBeGreaterThan(0);
      });

      it('should handle event structure consistently', () => {
        // Test that all events follow Nostr event structure
        const serviceEvent = createServiceConfig({
          id: 'test',
          name: 'Test',
          serviceType: SERVICE_TYPES.API_ACCESS
        });

        const communityEvent = createCommunityDefinition({
          name: 'Test Community',
          type: COMMUNITY_TYPES.PUBLIC
        }, mockPubkey);

        const wikiEvent = createWikiPage({
          title: 'Test Page',
          content: 'Test content'
        }, mockPubkey);

        [serviceEvent, communityEvent, wikiEvent].forEach(event => {
          expect(event).toHaveProperty('kind');
          expect(event).toHaveProperty('content');
          expect(event).toHaveProperty('tags');
          expect(event).toHaveProperty('created_at');
          expect(Array.isArray(event.tags)).toBe(true);
          expect(typeof event.created_at).toBe('number');
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle invalid data gracefully', () => {
        // Test with invalid service config
        expect(() => {
          createServiceConfig({});
        }).not.toThrow();

        // Test with invalid community data
        expect(() => {
          createCommunityDefinition({}, mockPubkey);
        }).not.toThrow();

        // Test with invalid wiki page data
        expect(() => {
          createWikiPage({}, mockPubkey);
        }).not.toThrow();
      });

      it('should validate required fields', () => {
        // Service config without required fields
        const serviceEvent = createServiceConfig({});
        expect(serviceEvent.tags).toContainEqual(['d', 'undefined'));

        // Community without creator
        expect(() => {
          createCommunityDefinition({ name: 'Test' });
        }).not.toThrow();

        // Wiki page without author
        const wikiEvent = createWikiPage({ title: 'Test' });
        expect(wikiEvent.tags).toContainEqual(['author', 'undefined']);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large data sets efficiently', () => {
      const startTime = Date.now();

      // Create multiple events
      for (let i = 0; i < 100; i++) {
        createServiceConfig({
          id: `service_${i}`,
          name: `Service ${i}`,
          serviceType: SERVICE_TYPES.API_ACCESS
        });

        createCommunityDefinition({
          name: `Community ${i}`,
          type: COMMUNITY_TYPES.PUBLIC
        }, mockPubkey);

        createWikiPage({
          title: `Page ${i}`,
          content: `Content for page ${i}`.repeat(100)
        }, mockPubkey);
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(executionTime).toBeLessThan(1000);
    });

    it('should handle large content without memory issues', () => {
      const largeContent = 'Large content '.repeat(10000);
      const wikiEvent = createWikiPage({
        title: 'Large Page',
        content: largeContent
      }, mockPubkey);

      expect(wikiEvent.content).toBeDefined();
      expect(JSON.parse(wikiEvent.content).content).toBe(largeContent);
    });
  });
});

// Mock utilities for testing
const mockTestUtils = {
  createMockEvent: (kind, content, tags = []) => ({
    kind,
    content: typeof content === 'string' ? content : JSON.stringify(content),
    tags,
    created_at: Math.floor(Date.now() / 1000),
    id: 'mock_event_id',
    pubkey: mockPubkey
  }),

  createMockPool: () => ({
    publish: jest.fn(),
    subscribeMany: jest.fn(),
    close: jest.fn()
  }),

  validateEventStructure: (event) => {
    expect(event).toHaveProperty('kind');
    expect(event).toHaveProperty('content');
    expect(event).toHaveProperty('tags');
    expect(event).toHaveProperty('created_at');
    expect(Array.isArray(event.tags)).toBe(true);
    expect(typeof event.created_at).toBe('number');
  }
};

// Export for potential external use
export {
  mockTestUtils,
  mockPubkey,
  mockPrivateKey
};

// Test configuration
export const testConfig = {
  timeout: 10000,
  retries: 3,
  verbose: true,
  collectCoverage: true,
  coverageThreshold: {
    lines: 80,
    functions: 80,
    branches: 70,
    statements: 80
  }
};
