/**
 * NIP-72 Moderated Communities Implementation
 * Standard Nostr communities (Reddit-style)
 */

import { getPool, publishToPool, finalizeEvent } from "../nostrClient.js";

// NIP-72 Event Kinds (Official)
export const NIP72_KINDS = {
  COMMUNITY_DEFINITION: 34550, // Community creation and definition
  COMMUNITY_APPROVAL: 4550, // Post approval workflow
  COMMUNITY_MODERATION: 4551, // Moderation actions (rename/remove/ban)
  COMMUNITY_RULES: 34551, // Community rules definition
  COMMUNITY_MEMBERSHIP: 10004, // Membership (Kind 10004 is used for general lists, but NIP-72 specifies 10004 for membership)
  COMMUNITY_BAN: 4552, // Ban records
  COMMUNITY_POST: 1111, // Post in a community (NIP-22 standard)
};

// Community Types
export const COMMUNITY_TYPES = {
  PUBLIC: "public",
  PRIVATE: "private",
  RESTRICTED: "restricted",
  APPROVAL_REQUIRED: "approval_required",
};

// Moderation Actions
export const MODERATION_ACTIONS = {
  APPROVE: "approve",
  REMOVE: "remove",
  BAN: "ban",
  MUTE: "mute",
  WARN: "warn",
  LOCK: "lock",
};

// Post Status
export const POST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

/**
 * Create a new community definition (Kind 34550)
 */
export function createCommunityDefinition(communityData, creatorPubkey) {
  const communityId =
    communityData.id || generateCommunityId(communityData.name);

  const tags = [
    ["d", communityId],
    ["name", communityData.name],
    ["description", communityData.description || ""],
    ["type", communityData.type || COMMUNITY_TYPES.PUBLIC],
  ];

  if (creatorPubkey) {
    tags.push(["creator", creatorPubkey]);
  }

  if (communityData.image) {
    tags.push(["image", communityData.image]);
  }

  // Add moderators
  if (communityData.moderators && communityData.moderators.length > 0) {
    communityData.moderators.forEach((pubkey) => {
      tags.push(["p", pubkey, "", "moderator"]);
    });
  }

  // Add relays
  if (communityData.relays && communityData.relays.length > 0) {
    communityData.relays.forEach((relay) => {
      tags.push(["relay", relay]);
    });
  }

  // Add search tags
  if (communityData.tags && communityData.tags.length > 0) {
    communityData.tags.forEach((tag) => {
      tags.push(["t", tag]);
    });
  }

  return {
    kind: NIP72_KINDS.COMMUNITY_DEFINITION,
    content: JSON.stringify({
      name: communityData.name,
      description: communityData.description || "",
      community_type: communityData.type || COMMUNITY_TYPES.PUBLIC,
      rules: communityData.rules || [],
      moderation_policy: communityData.moderationPolicy || "default",
    }),
    tags,
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Publish community definition
 */
export async function publishCommunityDefinition(pool, relays, privateKey, communityData) {
  const creatorPubkey = communityData.pubkey;
  const event = createCommunityDefinition(communityData, creatorPubkey);
  return await publishToPool(pool, relays, privateKey, "", event);
}

/**
 * Create a post for a community (Kind 1111)
 */
export function createCommunityPost(
  content,
  communityId,
  communityOwnerPubkey,
) {
  const communityAddr = `34550:${communityOwnerPubkey}:${communityId}`;

  return {
    kind: NIP72_KINDS.COMMUNITY_POST,
    content,
    tags: [
      ["A", communityAddr],
      ["a", communityAddr],
      ["P", communityOwnerPubkey],
      ["p", communityOwnerPubkey],
      ["K", "34550"],
      ["k", "34550"],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Create post approval request (Kind 4550)
 */
export function createPostApprovalRequest(postEvent, communityId, communityOwnerPubkey) {
  const communityAddr = `34550:${communityOwnerPubkey}:${communityId}`;

  return {
    kind: NIP72_KINDS.COMMUNITY_APPROVAL,
    content: JSON.stringify({
      post_id: postEvent.id,
      status: POST_STATUS.PENDING,
      original_event: postEvent,
    }),
    tags: [
      ["a", communityAddr],
      ["e", postEvent.id],
      ["p", postEvent.pubkey],
      ["k", String(postEvent.kind)],
      ["c", communityId],
      ["status", POST_STATUS.PENDING],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Alias for backward compatibility or different naming conventions
 */
export function createPostApproval(communityId, communityOwnerPubkey, postEvent) {
  return createPostApprovalRequest(postEvent, communityId, communityOwnerPubkey);
}

/**
 * Create moderation action (Kind 4551)
 */
export function createModerationAction(moderatorPubkey, target, action, reason, communityId) {
  return {
    kind: NIP72_KINDS.COMMUNITY_MODERATION,
    content: JSON.stringify({
      action,
      reason,
      timestamp: Math.floor(Date.now() / 1000),
    }),
    tags: [
      ["e", target.id],
      ["p", target.pubkey],
      ["moderator", moderatorPubkey],
      ["c", communityId],
      ["action", action],
      ["severity", "low"],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Create community rules (Kind 34551)
 */
export function createCommunityRules(communityId, rules, moderatorPubkey) {
  return {
    kind: NIP72_KINDS.COMMUNITY_RULES,
    content: JSON.stringify({
      rules,
      version: "1.0",
      last_updated: Math.floor(Date.now() / 1000),
    }),
    tags: [
      ["d", communityId],
      ["type", "rules"],
      ["moderator", moderatorPubkey],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Create community membership (Kind 10004)
 */
export function createCommunityMembership(userPubkey, communityId, action = "join", role = "member") {
  return {
    kind: NIP72_KINDS.COMMUNITY_MEMBERSHIP,
    content: JSON.stringify({
      user_pubkey: userPubkey,
      action,
      role,
      joined_at: Math.floor(Date.now() / 1000),
    }),
    tags: [
      ["p", userPubkey],
      ["c", communityId],
      ["action", action],
      ["role", role],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Create community ban (Kind 4552)
 */
export function createCommunityBan(moderatorPubkey, targetPubkey, reason, duration = null, communityId) {
  const expiresAt = duration ? Math.floor(Date.now() / 1000) + duration : null;

  return {
    kind: NIP72_KINDS.COMMUNITY_BAN,
    content: JSON.stringify({
      banned_pubkey: targetPubkey,
      reason,
      is_permanent: !duration,
      expires_at: expiresAt,
    }),
    tags: [
      ["p", targetPubkey],
      ["moderator", moderatorPubkey],
      ["c", communityId],
      ["reason", reason],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Create community invite
 */
export function createCommunityInvite(communityId, inviteePubkey, inviterPubkey) {
  return {
    kind: 1, // Using regular note for invite or custom kind if defined
    content: `You've been invited to join community ${communityId}`,
    tags: [
      ["p", inviteePubkey],
      ["c", communityId],
      ["inviter", inviterPubkey],
      ["t", "community-invite"],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Create community statistics
 */
export function createCommunityStats(communityId, stats) {
  return {
    kind: 1, // Using regular note for stats
    content: JSON.stringify(stats),
    tags: [
      ["d", communityId],
      ["t", "community-stats"],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Create community crosspost
 */
export function createCommunityCrosspost(event, targetCommunityId, ownerPubkey) {
  const communityAddr = `34550:${ownerPubkey}:${targetCommunityId}`;
  return {
    kind: 6, // NIP-18 Repost/Crosspost
    content: JSON.stringify(event),
    tags: [
      ["e", event.id, "", "mention"],
      ["p", event.pubkey],
      ["a", communityAddr],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Get community definition
 */
export async function getCommunity(communityId, ownerPubkey, relays = null) {
  const pool = await getPool();
  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_DEFINITION],
    authors: [ownerPubkey],
    "#d": [communityId],
    limit: 1,
  };

  const events = await pool.querySync(relays, filter);
  if (events.length === 0) return null;

  const event = events[0];
  return {
    id: event.tags.find((tag) => tag[0] === "d")?.[1],
    pubkey: event.pubkey,
    name: event.tags.find((tag) => tag[0] === "name")?.[1],
    description: event.tags.find((tag) => tag[0] === "description")?.[1],
    image: event.tags.find((tag) => tag[0] === "image")?.[1],
    type: event.tags.find((tag) => tag[0] === "type")?.[1] || COMMUNITY_TYPES.PUBLIC,
    moderators: event.tags
      .filter((tag) => tag[0] === "p" && tag[3] === "moderator")
      .map((tag) => tag[1]),
    relays: event.tags.filter((tag) => tag[0] === "relay").map((tag) => tag[1]),
    event: event,
  };
}

/**
 * Get available communities
 */
export async function getAvailableCommunities(relays = null) {
  const pool = await getPool();
  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_DEFINITION],
    limit: 100,
  };

  const events = await pool.querySync(relays, filter);
  return events.map((event) => ({
    id: event.tags.find((tag) => tag[0] === "d")?.[1],
    pubkey: event.pubkey,
    name: event.tags.find((tag) => tag[0] === "name")?.[1],
    description: event.tags.find((tag) => tag[0] === "description")?.[1],
    image: event.tags.find((tag) => tag[0] === "image")?.[1],
    type: event.tags.find((tag) => tag[0] === "type")?.[1] || COMMUNITY_TYPES.PUBLIC,
    moderators: event.tags
      .filter((tag) => tag[0] === "p" && tag[3] === "moderator")
      .map((tag) => tag[1]),
    created_at: event.created_at,
  }));
}

/**
 * Get pending posts for a community
 */
export async function getPendingPosts(communityId, ownerPubkey, relays = null) {
  const pool = await getPool();
  const communityAddr = `34550:${ownerPubkey}:${communityId}`;

  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_APPROVAL],
    "#a": [communityAddr],
    "#status": [POST_STATUS.PENDING],
    limit: 50,
  };

  const events = await pool.querySync(relays, filter);
  return events.map((event) => {
    try {
      const content = JSON.parse(event.content);
      return {
        ...content.original_event,
        approval_id: event.id,
      };
    } catch (e) {
      return null;
    }
  }).filter(p => p !== null);
}

/**
 * Get approved posts for a community
 */
export async function getCommunityPosts(
  communityId,
  ownerPubkey,
  relays = null,
) {
  const pool = await getPool();
  const communityAddr = `34550:${ownerPubkey}:${communityId}`;

  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_APPROVAL],
    "#a": [communityAddr],
    "#status": [POST_STATUS.APPROVED],
    limit: 50,
  };

  const approvalEvents = await pool.querySync(relays, filter);

  // Extract the original events from approvals
  return approvalEvents
    .map((event) => {
      try {
        const content = JSON.parse(event.content);
        return content.original_event;
      } catch (e) {
        return null;
      }
    })
    .filter((post) => post !== null);
}

/**
 * Get user memberships
 */
export async function getUserMemberships(userPubkey, relays = null) {
  const pool = await getPool();
  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_MEMBERSHIP],
    "#p": [userPubkey],
    limit: 50
  };

  const events = await pool.querySync(relays, filter);
  return events.map(event => {
    try {
      return JSON.parse(event.content);
    } catch (e) {
      return null;
    }
  }).filter(m => m !== null);
}

/**
 * Get community rules
 */
export async function getCommunityRules(communityId, relays = null) {
  const pool = await getPool();
  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_RULES],
    "#d": [communityId],
    limit: 1
  };

  const events = await pool.querySync(relays, filter);
  if (events.length === 0) return null;

  try {
    return JSON.parse(events[0].content);
  } catch (e) {
    return null;
  }
}

/**
 * Get user moderation history
 */
export async function getUserModerationHistory(userPubkey, relays = null) {
  const pool = await getPool();
  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_MODERATION],
    "#p": [userPubkey],
    limit: 50
  };

  const events = await pool.querySync(relays, filter);
  return events.map(event => {
    try {
      return {
        ...JSON.parse(event.content),
        event_id: event.id,
        moderator: event.tags.find(t => t[0] === 'moderator')?.[1],
        action: event.tags.find(t => t[0] === 'action')?.[1],
      };
    } catch (e) {
      return null;
    }
  }).filter(h => h !== null);
}

/**
 * Check if user is moderator of community
 */
export function isUserModerator(userPubkey, communityDefinition) {
  if (!communityDefinition || !communityDefinition.moderators) return false;
  if (communityDefinition.pubkey === userPubkey) return true; // Owner is always moderator
  return communityDefinition.moderators.includes(userPubkey);
}

/**
 * Validate post against rules
 */
export function validatePostAgainstRules(postContent, rulesData) {
  const rules = rulesData?.rules || [];
  const violations = [];

  for (const rule of rules) {
    if (rule.banned_keywords) {
      for (const keyword of rule.banned_keywords) {
        if (postContent.toLowerCase().includes(keyword.toLowerCase())) {
          violations.push({
            rule: rule.title,
            reason: `Content contains banned keyword: ${keyword}`,
            severity: rule.severity
          });
        }
      }
    }

    if (rule.max_length && postContent.length > rule.max_length) {
      violations.push({
        rule: rule.title,
        reason: `Content exceeds maximum length of ${rule.max_length} characters`,
        severity: rule.severity
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Calculate community health score
 */
export function calculateCommunityHealth(stats) {
  if (!stats) return 0;

  let score = 0;
  
  // Member activity (up to 40 points)
  if (stats.totalMembers > 0) {
    const activityRatio = stats.activeMembers / stats.totalMembers;
    score += Math.min(activityRatio * 40, 40);
  }

  // Content volume (up to 30 points)
  const contentScore = (stats.totalPosts * 2 + stats.totalComments) / 10;
  score += Math.min(contentScore, 30);

  // Moderation balance (up to 30 points)
  // Low moderation ratio is good, too high indicates spam/toxicity
  if (stats.totalPosts > 0) {
    const moderationRatio = stats.moderationActions / stats.totalPosts;
    if (moderationRatio < 0.1) score += 30;
    else if (moderationRatio < 0.3) score += 20;
    else if (moderationRatio < 0.5) score += 10;
  } else {
    score += 30; // New communities start with full moderation health
  }

  return Math.round(score);
}

/**
 * Generate unique community ID from name
 */
function generateCommunityId(name) {
  if (!name) return "community-" + Math.random().toString(36).substring(2, 8);
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 32);
}
