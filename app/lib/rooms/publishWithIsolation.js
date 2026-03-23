/**
 * Thread Publishing with Strict Room Isolation
 * 
 * This module provides enhanced thread publishing that ensures
 * complete room isolation through mandatory tagging.
 */

import { publishToPool, DEFAULT_RELAYS } from '../nostrClient';
import { createRoomTags } from './roomIsolation.js';

/**
 * Publish a thread (NIP-23 long-form content) with STRICT ROOM ISOLATION
 * 
 * Event Structure (Kind 30023):
 * Required Tags:
 *  - ["d", threadId] - Unique identifier
 *  - ["title", title] - Thread title
 *  - ["room", roomId] - MANDATORY: Room identifier for isolation
 *  - ["category", categoryId] - Category identifier
 *  - ["published_at", "timestamp"] - Publication time
 *  - ["t", tag] - Room-specific tags (validated)
 * Optional:
 *  - ["summary", "brief description"]
 *  - ["sticky", "true"/"false"]
 *  - ["locked", "true"/"false"]
 *
 * Parameters:
 *  - pool: SimplePool instance
 *  - relayUrls: array of relay URLs (optional)
 *  - privateKeyBytes: Uint8Array private key
 *  - opts: object with fields:
 *      - threadId (required) : string
 *      - title (required) : string
 *      - roomId (required) : string - Room where thread is being posted
 *      - content : markdown string (body)
 *      - tags : array of user-selected tags (validated against room)
 *      - published_at : unix timestamp - defaults to now
 *      - summary, sticky, locked : optional metadata
 *
 * @returns {Promise<Object>} The signed and published event
 */
export async function publishThreadWithIsolation(
  pool,
  relayUrls = DEFAULT_RELAYS,
  privateKeyBytes,
  opts = {},
) {
  const {
    threadId,
    title = "",
    roomId, // REQUIRED for room isolation
    content = "",
    tags: userTags = [], // User-selected tags
    published_at = Math.floor(Date.now() / 1000),
    summary,
    sticky,
    locked,
  } = opts || {};

  // Validation
  if (!threadId) {
    throw new Error("publishThreadWithIsolation: 'threadId' (d-tag) is required");
  }

  if (!roomId) {
    throw new Error("publishThreadWithIsolation: 'roomId' is required for room isolation");
  }

  // Create mandatory room-specific tags
  const roomTags = createRoomTags(roomId, userTags);

  // Build complete tags array
  const tags = [
    ["d", threadId],
    ["title", title],
    ...roomTags, // Room isolation tags (includes ["room", roomId] and ["category", ...])
    ["published_at", String(published_at)],
  ];

  // Optional tags
  if (summary) tags.push(["summary", summary]);
  if (typeof sticky !== "undefined")
    tags.push(["sticky", sticky ? "true" : "false"]);
  if (typeof locked !== "undefined")
    tags.push(["locked", locked ? "true" : "false"]);

  // Publish to pool
  const event = await publishToPool(pool, relayUrls, privateKeyBytes, content, {
    kind: 30023,
    tags,
  });

  console.log(`[RoomIsolation] Thread published to room "${roomId}" with tags:`, JSON.stringify(tags, null, 2));
  return event;
}

/**
 * Publish a reply (Kind 1) with strict room isolation
 * 
 * Event Structure (Kind 1):
 * Required Tags:
 *  - ["e", threadId, "", "reply"] - NIP-10 reply marker
 *  - ["p", authorPubkey] - Mention thread author
 *  - ["room", roomId] - MANDATORY: Room identifier
 *  - ["category", categoryId] - Category identifier
 *
 * @returns {Promise<Object>} The signed and published event
 */
export async function publishReplyWithIsolation(
  pool,
  relayUrls,
  privateKeyBytes,
  opts = {},
) {
  const {
    threadId, // The root thread event ID
    threadAuthorPubkey,
    roomId, // REQUIRED
    content = "",
    replyId, // Optional: for nested replies
  } = opts || {};

  // Validation
  if (!threadId) {
    throw new Error("publishReplyWithIsolation: 'threadId' is required");
  }

  if (!roomId) {
    throw new Error("publishReplyWithIsolation: 'roomId' is required");
  }

  // Import for room tags
  const { createRoomTags } = await import('./rooms/roomIsolation.js');
  const roomTags = createRoomTags(roomId, []);

  // Build NIP-10 compliant tags
  const tags = [
    ["e", threadId, "", "reply"], // NIP-10 reply marker
    ["p", threadAuthorPubkey], // Mention author
    ...roomTags, // Room isolation tags
  ];

  // Add reply-to-reply markers if nested
  if (replyId && replyId !== threadId) {
    tags.push(["e", replyId, "", "mention"]);
  }

  // Publish
  const event = await publishToPool(pool, relayUrls, privateKeyBytes, content, {
    kind: 1,
    tags,
  });

  console.log(`[RoomIsolation] Reply published to room "${roomId}"`);
  return event;
}

export default {
  publishThreadWithIsolation,
  publishReplyWithIsolation,
};
