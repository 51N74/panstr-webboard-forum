/**
 * Room Isolation Service - Strict Tag-Based Filtering
 *
 * This module ensures complete isolation between rooms by:
 * 1. Injecting mandatory room tags on post creation
 * 2. Using strict relay queries with room-specific filters
 * 3. Validating room tags on all events before display
 *
 * Usage:
 *   import { createRoomEvent, queryRoomEvents } from '@/lib/rooms/roomIsolation';
 */

import { getRoomById, getRoomTags, isTagValidForRoom, getAllRooms } from '../../data/boardsConfig.js';

/**
 * MANDATORY ROOM TAG - Injected into every event
 * Format: ["room", roomId]
 * This is the PRIMARY isolation mechanism
 */
export const ROOM_TAG_KEY = 'room';

/**
 * Create room-specific tags for an event
 * @param {string} roomId - The room ID where content is being posted
 * @param {Array<string>} additionalTags - Optional user-selected tags
 * @returns {Array<Array<string>>} Nostr-compatible tags array
 */
export function createRoomTags(roomId, additionalTags = []) {
  const room = getRoomById(roomId);
  
  if (!room) {
    throw new Error(`Invalid room ID: ${roomId}`);
  }

  const tags = [];
  
  // MANDATORY: Primary room identifier tag
  tags.push([ROOM_TAG_KEY, roomId]);
  
  // MANDATORY: Category tag for broader filtering
  tags.push(['category', room.category]);
  
  // OPTIONAL: User-selected tags (validated against room)
  if (additionalTags && additionalTags.length > 0) {
    const validTags = additionalTags
      .map(tag => String(tag).trim().toLowerCase())
      .filter(tag => {
        // Validate tag belongs to this room
        const isValid = isTagValidForRoom(roomId, tag);
        if (!isValid) {
          console.warn(`Tag "${tag}" is not valid for room ${roomId} and will be ignored`);
        }
        return isValid;
      })
      .slice(0, 5); // Max 5 user tags
    
    validTags.forEach(tag => {
      tags.push(['t', tag]);
    });
  }
  
  return tags;
}

/**
 * Create strict relay filters for room-specific queries
 * @param {string} roomId - Room ID to query
 * @param {Object} options - Query options
 * @returns {Object} Nostr filter object for relay queries
 */
export function createRoomFilters(roomId, options = {}) {
  const {
    kinds = [30023], // Default to long-form content
    limit = 100,
    since = null,
    until = null,
  } = options;

  // PRIMARY FILTER: Room tag (mandatory)
  const filters = {
    kinds,
    [`#${ROOM_TAG_KEY}`]: [roomId],
    limit,
  };

  // Optional time range filters
  if (since) filters.since = since;
  if (until) filters.until = until;

  return filters;
}

/**
 * Validate that an event belongs to a specific room
 * @param {Object} event - Nostr event
 * @param {string} roomId - Expected room ID
 * @returns {Object} Validation result with isValid and details
 */
export function validateEventRoom(event, roomId) {
  if (!event || !event.tags) {
    return {
      isValid: false,
      reason: 'Event or tags missing',
      details: { event, roomId }
    };
  }

  // Check for mandatory room tag
  const roomTag = event.tags.find(tag => tag[0] === ROOM_TAG_KEY && tag[1]);
  const roomValue = roomTag?.[1];

  if (!roomValue) {
    return {
      isValid: false,
      reason: 'Missing room tag',
      details: { event, roomId }
    };
  }

  // Strict room matching
  if (roomValue !== roomId) {
    return {
      isValid: false,
      reason: `Room mismatch: expected "${roomId}", got "${roomValue}"`,
      details: { event, roomId, actualRoom: roomValue }
    };
  }

  // Validate category tag matches
  const categoryTag = event.tags.find(tag => tag[0] === 'category' && tag[1]);
  const room = getRoomById(roomId);
  
  if (room && categoryTag && categoryTag[1] !== room.category) {
    return {
      isValid: false,
      reason: `Category mismatch: expected "${room.category}", got "${categoryTag[1]}"`,
      details: { event, roomId, actualCategory: categoryTag[1] }
    };
  }

  // Validate 't' tags belong to this room
  const tTags = event.tags
    .filter(tag => tag[0] === 't' && tag[1])
    .map(tag => tag[1]);
  
  const invalidTags = tTags.filter(tag => !isTagValidForRoom(roomId, tag));
  
  if (invalidTags.length > 0) {
    return {
      isValid: false,
      reason: `Invalid tags for room: ${invalidTags.join(', ')}`,
      details: { event, roomId, invalidTags }
    };
  }

  return {
    isValid: true,
    reason: 'All validations passed',
    details: { event, roomId, tagCount: tTags.length }
  };
}

/**
 * Filter events by room with strict validation
 * @param {Array<Object>} events - Array of Nostr events
 * @param {string} roomId - Target room ID
 * @returns {Array<Object>} Filtered events that belong to the room
 */
export function filterEventsByRoom(events, roomId) {
  if (!events || !Array.isArray(events)) {
    return [];
  }

  return events.filter(event => {
    const validation = validateEventRoom(event, roomId);
    if (!validation.isValid) {
      console.debug(`Event ${event.id.slice(0, 8)}... filtered: ${validation.reason}`);
    }
    return validation.isValid;
  });
}

/**
 * Extract room metadata from an event
 * @param {Object} event - Nostr event
 * @returns {Object|null} Room metadata or null if invalid
 */
export function getEventRoomMetadata(event) {
  if (!event || !event.tags) return null;

  const roomTag = event.tags.find(tag => tag[0] === ROOM_TAG_KEY && tag[1]);
  const categoryTag = event.tags.find(tag => tag[0] === 'category' && tag[1]);
  const tTags = event.tags.filter(tag => tag[0] === 't' && tag[1]).map(tag => tag[1]);

  if (!roomTag) return null;

  const room = getRoomById(roomTag[1]);

  return {
    roomId: roomTag[1],
    category: categoryTag?.[1] || room?.category || 'unknown',
    tags: tTags,
    roomName: room?.name || 'Unknown Room',
    roomIcon: room?.icon || '📝',
  };
}

/**
 * Get all rooms for cross-posting validation
 * @returns {Array<Object>} Array of valid rooms
 */
export function getAvailableRooms() {
  return getAllRooms().map(room => ({
    id: room.id,
    name: room.name,
    category: room.category,
    icon: room.icon,
    tags: room.tags,
  }));
}

/**
 * Validate cross-post tags
 * @param {Array<string>} rooms - Array of room IDs to cross-post to
 * @returns {Object} Validation result
 */
export function validateCrossPost(rooms) {
  if (!rooms || rooms.length === 0) {
    return { isValid: false, reason: 'No rooms specified' };
  }

  const invalidRooms = rooms.filter(roomId => !getRoomById(roomId));
  
  if (invalidRooms.length > 0) {
    return {
      isValid: false,
      reason: `Invalid rooms: ${invalidRooms.join(', ')}`,
      invalidRooms
    };
  }

  return {
    isValid: true,
    reason: 'All rooms valid',
    roomCount: rooms.length
  };
}

/**
 * Create cross-post tags for multi-room posting
 * @param {Array<string>} roomIds - Array of room IDs
 * @returns {Array<Array<string>>} Nostr-compatible tags
 */
export function createCrossPostTags(roomIds) {
  const validation = validateCrossPost(roomIds);
  
  if (!validation.isValid) {
    throw new Error(`Invalid cross-post: ${validation.reason}`);
  }

  const tags = [];
  
  // Primary room (first in list)
  tags.push([ROOM_TAG_KEY, roomIds[0]]);
  
  // Cross-post references
  roomIds.forEach(roomId => {
    tags.push(['crosspost', roomId]);
  });
  
  // Category (should be same for all rooms in a cross-post)
  const primaryRoom = getRoomById(roomIds[0]);
  if (primaryRoom) {
    tags.push(['category', primaryRoom.category]);
  }
  
  return tags;
}

export default {
  ROOM_TAG_KEY,
  createRoomTags,
  createRoomFilters,
  validateEventRoom,
  filterEventsByRoom,
  getEventRoomMetadata,
  getAvailableRooms,
  validateCrossPost,
  createCrossPostTags,
};
