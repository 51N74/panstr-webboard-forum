/**
 * NIP-72 Moderated Communities Implementation
 * Standard Nostr communities (Reddit-style)
 */

import { getPool, publishToPool, getEvents, finalizeEvent } from '../nostrClient.js';

// NIP-72 Event Kinds (Official)
export const NIP72_KINDS = {
  COMMUNITY_DEFINITION: 34550,     // Community creation and definition
  COMMUNITY_APPROVAL: 4550,        // Post approval workflow
  COMMUNITY_POST: 1111,            // Post in a community (NIP-22 standard)
};

// Moderation Actions
export const MODERATION_ACTIONS = {
  APPROVE: 'approve',
  REMOVE: 'remove',
};

/**
 * Create a new community definition (Kind 34550)
 */
export function createCommunityDefinition(communityData) {
  const communityId = communityData.id || generateCommunityId(communityData.name);

  const tags = [
    ['d', communityId],
    ['name', communityData.name],
    ['description', communityData.description || ""],
  ];

  if (communityData.image) {
    tags.push(['image', communityData.image]);
  }

  // Add moderators
  if (communityData.moderators && communityData.moderators.length > 0) {
    communityData.moderators.forEach(pubkey => {
      tags.push(['p', pubkey, "", "moderator"]);
    });
  }

  // Add relays
  if (communityData.relays && communityData.relays.length > 0) {
    communityData.relays.forEach(relay => {
      tags.push(['relay', relay]);
    });
  }

  return {
    kind: NIP72_KINDS.COMMUNITY_DEFINITION,
    content: communityData.description || "",
    tags,
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create a post for a community (Kind 1111)
 */
export function createCommunityPost(content, communityId, communityOwnerPubkey) {
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
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create post approval (Kind 4550)
 */
export function createPostApproval(communityId, communityOwnerPubkey, postEvent) {
  const communityAddr = `34550:${communityOwnerPubkey}:${communityId}`;
  
  return {
    kind: NIP72_KINDS.COMMUNITY_APPROVAL,
    content: JSON.stringify(postEvent),
    tags: [
      ['a', communityAddr],
      ['e', postEvent.id],
      ['p', postEvent.pubkey],
      ['k', String(postEvent.kind)]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Get community definition
 */
export async function getCommunity(communityId, ownerPubkey, relays = null) {
  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_DEFINITION],
    authors: [ownerPubkey],
    '#d': [communityId],
    limit: 1
  };

  const events = await getEvents(filter, relays);
  if (events.length === 0) return null;

  const event = events[0];
  return {
    id: event.tags.find(tag => tag[0] === 'd')?.[1],
    pubkey: event.pubkey,
    name: event.tags.find(tag => tag[0] === 'name')?.[1],
    description: event.tags.find(tag => tag[0] === 'description')?.[1],
    image: event.tags.find(tag => tag[0] === 'image')?.[1],
    moderators: event.tags.filter(tag => tag[0] === 'p' && tag[3] === 'moderator').map(tag => tag[1]),
    relays: event.tags.filter(tag => tag[0] === 'relay').map(tag => tag[1]),
    event: event
  };
}

/**
 * Get available communities
 */
export async function getAvailableCommunities(relays = null) {
  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_DEFINITION],
    limit: 100
  };

  const events = await getEvents(filter, relays);
  return events.map(event => ({
    id: event.tags.find(tag => tag[0] === 'd')?.[1],
    pubkey: event.pubkey,
    name: event.tags.find(tag => tag[0] === 'name')?.[1],
    description: event.tags.find(tag => tag[0] === 'description')?.[1],
    image: event.tags.find(tag => tag[0] === 'image')?.[1],
    moderators: event.tags.filter(tag => tag[0] === 'p' && tag[3] === 'moderator').map(tag => tag[1]),
    created_at: event.created_at
  }));
}

/**
 * Get approved posts for a community
 */
export async function getCommunityPosts(communityId, ownerPubkey, relays = null) {
  const communityAddr = `34550:${ownerPubkey}:${communityId}`;
  
  const filter = {
    kinds: [NIP72_KINDS.COMMUNITY_APPROVAL],
    '#a': [communityAddr],
    limit: 50
  };

  const approvalEvents = await getEvents(filter, relays);
  
  // Extract the original events from approvals
  return approvalEvents.map(event => {
    try {
      return JSON.parse(event.content);
    } catch (e) {
      return null;
    }
  }).filter(post => post !== null);
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
 * Generate unique community ID from name
 */
function generateCommunityId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 32);
}
