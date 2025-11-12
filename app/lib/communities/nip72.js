/**
 * NIP-72 Moderated Communities Implementation
 * Reddit-style community management with rules, policies, and moderation tools
 */

import { getPool, publishToPool, queryEvents } from '../nostrClient.js';

// NIP-72 Event Kinds
export const NIP72_KINDS = {
  COMMUNITY_DEFINITION: 3550,     // Community creation and definition
  COMMUNITY_APPROVAL: 3551,       // Post approval workflow
  COMMUNITY_MODERATION: 3552,     // Moderation actions
  COMMUNITY_RULES: 3553,          // Community rules and policies
  COMMUNITY_MEMBERSHIP: 3554,     // Community membership management
  COMMUNITY_METADATA: 3555,       // Community metadata updates
  COMMUNITY_BAN: 3556,            // User bans from community
  COMMUNITY_INVITE: 3557,         // Community invitations
  COMMUNITY_STATS: 3558,          // Community statistics
  COMMUNITY_CROSSPOST: 3559       // Cross-community posting
};

// Community Types
export const COMMUNITY_TYPES = {
  PUBLIC: 'public',
  RESTRICTED: 'restricted',
  PRIVATE: 'private',
  APPROVAL_REQUIRED: 'approval_required'
};

// Moderation Actions
export const MODERATION_ACTIONS = {
  APPROVE: 'approve',
  REMOVE: 'remove',
  BAN: 'ban',
  MUTE: 'mute',
  WARN: 'warn',
  LOCK: 'lock',
  STICKY: 'sticky',
  FEATURE: 'feature'
};

// Post Status
export const POST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REMOVED: 'removed',
  LOCKED: 'locked'
};

/**
 * Create a new community definition
 */
export function createCommunityDefinition(communityData, creatorPubkey) {
  const communityId = generateCommunityId(communityData.name);

  return {
    kind: NIP72_KINDS.COMMUNITY_DEFINITION,
    content: JSON.stringify({
      name: communityData.name,
      description: communityData.description,
      about: communityData.about || '',
      rules: communityData.rules || [],
      image: communityData.image || '',
      banner: communityData.banner || '',
      community_type: communityData.type || COMMUNITY_TYPES.PUBLIC,
      moderation_policy: communityData.moderationPolicy || 'default',
      tags: communityData.tags || [],
      metadata: communityData.metadata || {}
    }),
    tags: [
      ['d', communityId],
      ['name', communityData.name],
      ['type', communityData.type || COMMUNITY_TYPES.PUBLIC],
      ['creator', creatorPubkey],
      ['created_at', Math.floor(Date.now() / 1000).toString()],
      ...communityData.tags?.map(tag => ['t', tag]) || []
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create post approval request
 */
export function createPostApprovalRequest(postEvent, communityId, authorPubkey) {
  return {
    kind: NIP72_KINDS.COMMUNITY_APPROVAL,
    content: JSON.stringify({
      post_id: postEvent.id,
      post_kind: postEvent.kind,
      post_content: postEvent.content,
      post_tags: postEvent.tags,
      status: POST_STATUS.PENDING,
      submitted_at: Math.floor(Date.now() / 1000),
      author_notes: ''
    }),
    tags: [
      ['d', generateApprovalId(postEvent.id, communityId)],
      ['e', postEvent.id],
      ['p', authorPubkey],
      ['c', communityId],
      ['status', POST_STATUS.PENDING],
      ['action', 'submit']
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create moderation action event
 */
export function createModerationAction(moderatorPubkey, targetEvent, action, reason, communityId) {
  return {
    kind: NIP72_KINDS.COMMUNITY_MODERATION,
    content: JSON.stringify({
      target_event_id: targetEvent.id,
      target_author: targetEvent.pubkey,
      action: action,
      reason: reason || '',
      moderator_notes: '',
      severity: getActionSeverity(action),
      timestamp: Math.floor(Date.now() / 1000)
    }),
    tags: [
      ['d', generateModerationId(targetEvent.id, communityId)],
      ['e', targetEvent.id],
      ['p', targetEvent.pubkey],
      ['moderator', moderatorPubkey],
      ['c', communityId],
      ['action', action],
      ['severity', getActionSeverity(action)],
      ['timestamp', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create community rules update
 */
export function createCommunityRules(communityId, rules, moderatorPubkey) {
  return {
    kind: NIP72_KINDS.COMMUNITY_RULES,
    content: JSON.stringify({
      rules: rules.map((rule, index) => ({
        id: index + 1,
        title: rule.title,
        description: rule.description,
        severity: rule.severity || 'medium',
        applies_to: rule.appliesTo || ['posts', 'comments'],
        examples: rule.examples || []
      })),
      version: generateRulesVersion(),
      last_updated: Math.floor(Date.now() / 1000),
      updated_by: moderatorPubkey
    }),
    tags: [
      ['d', communityId],
      ['type', 'rules'],
      ['version', generateRulesVersion()],
      ['moderator', moderatorPubkey],
      ['updated_at', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create community membership event
 */
export function createCommunityMembership(userPubkey, communityId, action, role = 'member') {
  return {
    kind: NIP72_KINDS.COMMUNITY_MEMBERSHIP,
    content: JSON.stringify({
      user_pubkey: userPubkey,
      community_id: communityId,
      action: action, // 'join', 'leave', 'role_change'
      role: role, // 'member', 'moderator', 'admin', 'banned'
      joined_at: action === 'join' ? Math.floor(Date.now() / 1000) : undefined,
      left_at: action === 'leave' ? Math.floor(Date.now() / 1000) : undefined
    }),
    tags: [
      ['d', generateMembershipId(userPubkey, communityId)],
      ['p', userPubkey],
      ['c', communityId],
      ['action', action],
      ['role', role],
      ['timestamp', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create community ban event
 */
export function createCommunityBan(moderatorPubkey, targetPubkey, reason, duration, communityId) {
  const banId = generateBanId(targetPubkey, communityId);
  const expiresAt = duration ? Math.floor(Date.now() / 1000) + duration : null;

  return {
    kind: NIP72_KINDS.COMMUNITY_BAN,
    content: JSON.stringify({
      banned_pubkey: targetPubkey,
      reason: reason,
      moderator_pubkey: moderatorPubkey,
      banned_at: Math.floor(Date.now() / 1000),
      expires_at: expiresAt,
      is_permanent: !duration,
      ban_type: 'community_only' // 'community_only', 'global', 'shadow'
    }),
    tags: [
      ['d', banId],
      ['p', targetPubkey],
      ['moderator', moderatorPubkey],
      ['c', communityId],
      ['reason', reason],
      ['banned_at', Math.floor(Date.now() / 1000).toString()],
      ...(expiresAt ? [['expires_at', expiresAt.toString()]] : [['permanent', 'true']])
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create community invite event
 */
export function createCommunityInvite(inviterPubkey, inviteePubkey, communityId, role = 'member') {
  return {
    kind: NIP72_KINDS.COMMUNITY_INVITE,
    content: JSON.stringify({
      inviter_pubkey: inviterPubkey,
      invitee_pubkey: inviteePubkey,
      community_id: communityId,
      role: role,
      invite_message: '',
      invited_at: Math.floor(Date.now() / 1000),
      expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }),
    tags: [
      ['d', generateInviteId(inviteePubkey, communityId)],
      ['p', inviteePubkey],
      ['inviter', inviterPubkey],
      ['c', communityId],
      ['role', role],
      ['invited_at', Math.floor(Date.now() / 1000).toString()],
      ['expires_at', (Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create community statistics event
 */
export function createCommunityStats(communityId, statsData) {
  return {
    kind: NIP72_KINDS.COMMUNITY_STATS,
    content: JSON.stringify({
      community_id: communityId,
      total_members: statsData.totalMembers,
      active_members: statsData.activeMembers,
      total_posts: statsData.totalPosts,
      pending_posts: statsData.pendingPosts,
      total_comments: statsData.totalComments,
      moderation_actions: statsData.moderationActions,
      active_bans: statsData.activeBans,
      period: statsData.period || 'daily',
      generated_at: Math.floor(Date.now() / 1000)
    }),
    tags: [
      ['d', communityId],
      ['type', 'stats'],
      ['period', statsData.period || 'daily'],
      ['generated_at', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create cross-community post event
 */
export function createCommunityCrosspost(originalPost, targetCommunityId, authorPubkey, comment = '') {
  return {
    kind: NIP72_KINDS.COMMUNITY_CROSSPOST,
    content: JSON.stringify({
      original_post_id: originalPost.id,
      original_community: originalPost.communityId,
      target_community: targetCommunityId,
      crosspost_comment: comment,
      original_author: originalPost.pubkey,
      crosspost_author: authorPubkey,
      crossposted_at: Math.floor(Date.now() / 1000)
    }),
    tags: [
      ['d', generateCrosspostId(originalPost.id, targetCommunityId)],
      ['e', originalPost.id],
      ['original_community', originalPost.communityId],
      ['c', targetCommunityId],
      ['p', originalPost.pubkey],
      ['crosspost_author', authorPubkey],
      ['crossposted_at', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Publish community definition
 */
export async function publishCommunityDefinition(communityData, creatorPrivateKey) {
  const creatorPubkey = await getPubkeyFromPrivateKey(creatorPrivateKey);
  const event = createCommunityDefinition(communityData, creatorPubkey);
  return await publishToPool([event], creatorPrivateKey);
}

/**
 * Get available communities
 */
export async function getAvailableCommunities(relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_DEFINITION],
    limit: 100
  };

  const events = await queryEvents(filter, relays);
  return events.map(event => ({
    id: event.tags.find(tag => tag[0] === 'd')?.[1],
    pubkey: event.pubkey,
    definition: JSON.parse(event.content),
    tags: event.tags,
    created_at: event.created_at
  }));
}

/**
 * Get pending posts for community
 */
export async function getPendingPosts(communityId, relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_APPROVAL],
    '#c': [communityId],
    '#status': [POST_STATUS.PENDING],
    limit: 50
  };

  const events = await queryEvents(filter, relays);
  return events.map(event => ({
    id: event.id,
    postId: event.tags.find(tag => tag[0] === 'e')?.[1],
    author: event.tags.find(tag => tag[0] === 'p')?.[1],
    approval: JSON.parse(event.content),
    created_at: event.created_at
  }));
}

/**
 * Get user's community memberships
 */
export async function getUserMemberships(userPubkey, relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_MEMBERSHIP],
    '#p': [userPubkey],
    limit: 100
  };

  const events = await queryEvents(filter, relays);
  return events.map(event => ({
    id: event.id,
    communityId: event.tags.find(tag => tag[0] === 'c')?.[1],
    membership: JSON.parse(event.content),
    created_at: event.created_at
  }));
}

/**
 * Get community rules
 */
export async function getCommunityRules(communityId, relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_RULES],
    '#d': [communityId],
    limit: 1
  };

  const events = await queryEvents(filter, relays);
  if (events.length === 0) return null;

  const event = events[0];
  return {
    id: event.id,
    communityId: event.tags.find(tag => tag[0] === 'd')?.[1],
    version: event.tags.find(tag => tag[0] === 'version')?.[1],
    rules: JSON.parse(event.content),
    created_at: event.created_at
  };
}

/**
 * Get moderation history for user
 */
export async function getUserModerationHistory(userPubkey, communityId = null, relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_MODERATION],
    '#p': [userPubkey],
    limit: 100
  };

  if (communityId) {
    filter['#c'] = [communityId];
  }

  const events = await queryEvents(filter, relays);
  return events.map(event => ({
    id: event.id,
    targetEvent: event.tags.find(tag => tag[0] === 'e')?.[1],
    moderator: event.tags.find(tag => tag[0] === 'moderator')?.[1],
    action: event.tags.find(tag => tag[0] === 'action')?.[1],
    severity: event.tags.find(tag => tag[0] === 'severity')?.[1],
    moderation: JSON.parse(event.content),
    created_at: event.created_at
  }));
}

/**
 * Check if user is moderator of community
 */
export async function isUserModerator(userPubkey, communityId, relays = null) {
  const memberships = await getUserMemberships(userPubkey, relays);
  const communityMembership = memberships.find(m => m.communityId === communityId);

  if (!communityMembership) return false;

  return ['moderator', 'admin'].includes(communityMembership.membership.role);
}

/**
 * Validate post against community rules
 */
export function validatePostAgainstRules(postContent, communityRules) {
  const violations = [];

  if (!communityRules || !communityRules.rules) {
    return { valid: true, violations: [] };
  }

  communityRules.rules.forEach(rule => {
    if (rule.applies_to.includes('posts')) {
      // Check for rule violations based on content
      const contentLower = postContent.toLowerCase();

      // Simple keyword matching - can be enhanced with NLP
      if (rule.banned_keywords) {
        rule.banned_keywords.forEach(keyword => {
          if (contentLower.includes(keyword.toLowerCase())) {
            violations.push({
              rule_id: rule.id,
              rule_title: rule.title,
              severity: rule.severity,
              reason: `Contains banned keyword: ${keyword}`
            });
          }
        });
      }

      // Check post length
      if (rule.max_length && postContent.length > rule.max_length) {
        violations.push({
          rule_id: rule.id,
          rule_title: rule.title,
          severity: rule.severity,
          reason: `Post exceeds maximum length of ${rule.max_length} characters`
        });
      }
    }
  });

  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Generate unique community ID
 */
function generateCommunityId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate unique approval ID
 */
function generateApprovalId(postId, communityId) {
  return 'approval_' + postId.substring(0, 8) + '_' + communityId.substring(0, 8);
}

/**
 * Generate unique moderation ID
 */
function generateModerationId(eventId, communityId) {
  return 'mod_' + eventId.substring(0, 8) + '_' + communityId.substring(0, 8);
}

/**
 * Generate unique membership ID
 */
function generateMembershipId(userPubkey, communityId) {
  return 'member_' + userPubkey.substring(0, 8) + '_' + communityId.substring(0, 8);
}

/**
 * Generate unique ban ID
 */
function generateBanId(userPubkey, communityId) {
  return 'ban_' + userPubkey.substring(0, 8) + '_' + communityId.substring(0, 8);
}

/**
 * Generate unique invite ID
 */
function generateInviteId(userPubkey, communityId) {
  return 'invite_' + userPubkey.substring(0, 8) + '_' + communityId.substring(0, 8);
}

/**
 * Generate unique crosspost ID
 */
function generateCrosspostId(originalPostId, targetCommunityId) {
  return 'cross_' + originalPostId.substring(0, 8) + '_' + targetCommunityId.substring(0, 8);
}

/**
 * Generate rules version
 */
function generateRulesVersion() {
  return 'v' + Date.now().toString().substring(0, 8);
}

/**
 * Get action severity level
 */
function getActionSeverity(action) {
  const severityMap = {
    [MODERATION_ACTIONS.APPROVE]: 'low',
    [MODERATION_ACTIONS.REMOVE]: 'medium',
    [MODERATION_ACTIONS.BAN]: 'high',
    [MODERATION_ACTIONS.MUTE]: 'medium',
    [MODERATION_ACTIONS.WARN]: 'low',
    [MODERATION_ACTIONS.LOCK]: 'medium',
    [MODERATION_ACTIONS.STICKY]: 'low',
    [MODERATION_ACTIONS.FEATURE]: 'low'
  };

  return severityMap[action] || 'medium';
}

/**
 * Get pubkey from private key
 */
async function getPubkeyFromPrivateKey(privateKey) {
  // This should use nostr-tools to derive pubkey from private key
  // For now, returning a placeholder implementation
  return typeof privateKey === 'string' ? privateKey : 'unknown';
}

/**
 * Calculate community health metrics
 */
export function calculateCommunityHealth(stats) {
  let healthScore = 100;

  // Deduct points for high moderation activity
  if (stats.moderationActions > 0) {
    const moderationRatio = stats.moderationActions / (stats.totalPosts + stats.totalComments);
    healthScore -= Math.min(moderationRatio * 100, 30);
  }

  // Add points for high member activity
  if (stats.totalMembers > 0) {
    const activityRatio = stats.activeMembers / stats.totalMembers;
    healthScore += Math.min(activityRatio * 20, 20);
  }

  // Deduct points for high ban rate
  if (stats.totalMembers > 0) {
    const banRatio = stats.activeBans / stats.totalMembers;
    healthScore -= Math.min(banRatio * 100, 25);
  }

  return Math.max(0, Math.min(100, Math.round(healthScore)));
}
