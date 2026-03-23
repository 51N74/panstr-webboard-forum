/**
 * Tag Manager - Room-specific tag filtering system
 * 
 * This module provides utilities for managing and filtering tags
 * based on room/category associations.
 */

import {
  getRoomTags,
  isTagValidForRoom,
  getRoomById,
  getAllRooms
} from '../../data/boardsConfig';

/**
 * Extract tags from a Nostr event
 * @param {Object} event - Nostr event object
 * @returns {Array<string>} Array of tag strings
 */
export const extractEventTags = (event) => {
  if (!event || !event.tags) return [];
  
  return event.tags
    .filter(tag => tag[0] === 't' && tag[1])
    .map(tag => tag[1].toLowerCase());
};

/**
 * Filter event tags to only include tags valid for a specific room
 * @param {Array<string>} eventTags - Tags from the event
 * @param {string} roomId - Room ID to filter against
 * @returns {Array<string>} Filtered tags valid for the room
 */
export const filterTagsForRoom = (eventTags, roomId) => {
  if (!eventTags || !roomId) return [];
  
  return eventTags.filter(tag => isTagValidForRoom(roomId, tag));
};

/**
 * Get display tags for an event in a specific room context
 * @param {Object} event - Nostr event object
 * @param {string} roomId - Room ID for context
 * @returns {Array<string>} Tags to display for this event in this room
 */
export const getDisplayTagsForRoom = (event, roomId) => {
  const eventTags = extractEventTags(event);
  return filterTagsForRoom(eventTags, roomId);
};

/**
 * Validate tags before publishing to a room
 * @param {Array<string>} tags - Tags to validate
 * @param {string} roomId - Target room ID
 * @returns {Object} Validation result with isValid and invalidTags
 */
export const validateTagsForRoom = (tags, roomId) => {
  if (!tags || tags.length === 0) {
    return { isValid: true, invalidTags: [] };
  }
  
  const invalidTags = tags.filter(tag => !isTagValidForRoom(roomId, tag));
  
  return {
    isValid: invalidTags.length === 0,
    invalidTags,
    validTags: tags.filter(tag => isTagValidForRoom(roomId, tag))
  };
};

/**
 * Get suggested tags for a room (for UI dropdowns/autocomplete)
 * @param {string} roomId - Room ID
 * @returns {Array<string>} Array of suggested tags
 */
export const getSuggestedTagsForRoom = (roomId) => {
  return getRoomTags(roomId);
};

/**
 * Search tags within a room by keyword
 * @param {string} roomId - Room ID
 * @param {string} query - Search query
 * @returns {Array<string>} Matching tags
 */
export const searchRoomTags = (roomId, query) => {
  if (!query || query.trim() === '') return getRoomTags(roomId);
  
  const searchTerm = query.toLowerCase();
  return getRoomTags(roomId).filter(tag => 
    tag.toLowerCase().includes(searchTerm)
  );
};

/**
 * Get tag statistics for a room (from events)
 * @param {Array<Object>} events - Array of Nostr events
 * @param {string} roomId - Room ID
 * @returns {Array<Object>} Tag usage statistics
 */
export const getTagStatsForRoom = (events, roomId) => {
  const tagCounts = {};
  
  events.forEach(event => {
    const eventTags = getDisplayTagsForRoom(event, roomId);
    eventTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Get the most popular tags for a room
 * @param {Array<Object>} events - Array of Nostr events
 * @param {string} roomId - Room ID
 * @param {number} limit - Maximum number of tags to return
 * @returns {Array<string>} Top tags
 */
export const getPopularTagsForRoom = (events, roomId, limit = 10) => {
  const stats = getTagStatsForRoom(events, roomId);
  return stats.slice(0, limit).map(item => item.tag);
};

/**
 * Format tags for Nostr event creation
 * @param {Array<string>} tags - Array of tag strings
 * @returns {Array<Array<string>>} Nostr-compatible tag array [['t', 'tag1'], ['t', 'tag2'], ...]
 */
export const formatTagsForEvent = (tags) => {
  if (!tags || tags.length === 0) return [];
  
  return tags
    .map(tag => String(tag).trim().toLowerCase())
    .filter(tag => tag.length > 0 && tag.length <= 50)
    .map(tag => ['t', tag]);
};

/**
 * Check if a room exists
 * @param {string} roomId - Room ID to check
 * @returns {boolean} True if room exists
 */
export const roomExists = (roomId) => {
  return !!getRoomById(roomId);
};

/**
 * Get all rooms that contain a specific tag
 * @param {string} tag - Tag to search for
 * @returns {Array<Object>} Rooms that have this tag
 */
export const getRoomsByTag = (tag) => {
  if (!tag) return [];
  
  const searchTerm = tag.toLowerCase();
  return getAllRooms().filter(room => 
    room.tags?.some(t => t.toLowerCase() === searchTerm)
  );
};

/**
 * Get tag metadata (icon, category, etc.) - future enhancement
 * @param {string} tag - Tag name
 * @returns {Object} Tag metadata
 */
export const getTagMetadata = (tag) => {
  // Future: Add tag icons, descriptions, etc.
  return {
    name: tag,
    displayName: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  };
};

export default {
  extractEventTags,
  filterTagsForRoom,
  getDisplayTagsForRoom,
  validateTagsForRoom,
  getSuggestedTagsForRoom,
  searchRoomTags,
  getTagStatsForRoom,
  getPopularTagsForRoom,
  formatTagsForEvent,
  roomExists,
  getRoomsByTag,
  getTagMetadata
};
