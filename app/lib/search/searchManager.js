import Fuse from 'fuse.js';
import { getEvents, getUserProfile } from '../nostrClient';
import db from '../storage/indexedDB';

class SearchManager {
  constructor() {
    this.fuseOptions = {
      keys: [
        { name: 'content', weight: 0.4 },
        { name: 'title', weight: 0.3 },
        { name: 'authorName', weight: 0.2 },
        { name: 'tags', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      ignoreLocation: true,
      shouldSort: true,
      findAllMatches: true
    };

    this.userFuseOptions = {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'display_name', weight: 0.4 },
        { name: 'about', weight: 0.2 },
        { name: 'nip05', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2
    };
  }

  async searchThreads(query, options = {}) {
    const {
      limit = 20,
      offset = 0,
      kinds = [30023, 1], // Forum threads and replies
      authors = null,
      since = null,
      until = null,
      roomId = null,
      useCache = true
    } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = `threads_${query}_${JSON.stringify(options)}`;
        const cachedResults = await db.getCachedSearchResults(cacheKey);
        if (cachedResults) {
          return this.paginateResults(cachedResults, limit, offset);
        }
      }

      // Fetch events from Nostr
      const filters = {
        kinds,
        limit: 200, // Fetch more to enable better filtering
        ...(since && { since }),
        ...(until && { until }),
        ...(authors && { authors }),
        ...(roomId && { '#d': [roomId] })
      };

      const events = await getEvents(filters);

      // Process events for search
      const processedEvents = await this.processEventsForSearch(events);

      // Create Fuse instance and search
      const fuse = new Fuse(processedEvents, this.fuseOptions);
      const results = fuse.search(query);

      // Format results
      const formattedResults = results.map(result => {
        const event = result.item;
        const highlightedSnippets = this.createHighlightedSnippets(
          event.content,
          result.matches
        );

        return {
          id: event.id,
          kind: event.kind,
          title: event.title,
          content: event.content,
          contentPreview: event.content.substring(0, 200) + (event.content.length > 200 ? '...' : ''),
          author: event.author,
          authorName: event.authorName,
          authorPicture: event.authorPicture,
          created_at: event.created_at,
          tags: event.tags,
          score: result.score,
          matches: result.matches,
          highlightedSnippets,
          relevance: this.calculateRelevance(event, result.score, result.matches),
          room: this.extractRoomInfo(event)
        };
      });

      // Sort by relevance and timestamp
      formattedResults.sort((a, b) => {
        if (Math.abs(a.relevance - b.relevance) > 0.1) {
          return b.relevance - a.relevance;
        }
        return b.created_at - a.created_at;
      });

      // Cache results
      if (useCache) {
        await db.cacheSearchResults(cacheKey, formattedResults, 300000); // 5 minutes cache
      }

      return this.paginateResults(formattedResults, limit, offset);

    } catch (error) {
      console.error('Search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async searchUsers(query, options = {}) {
    const { limit = 20, offset = 0, useCache = true } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = `users_${query}`;
        const cachedResults = await db.getCachedSearchResults(cacheKey);
        if (cachedResults) {
          return this.paginateResults(cachedResults, limit, offset);
        }
      }

      // This is a simplified approach - in production, you'd want a better user discovery mechanism
      // For now, we'll search recent metadata events
      const filters = {
        kinds: [0], // Metadata events
        limit: 500,
        since: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60) // Last 30 days
      };

      const events = await getEvents(filters);

      // Process metadata events
      const users = await Promise.all(events.map(async (event) => {
        try {
          const profile = JSON.parse(event.content);
          return {
            pubkey: event.pubkey,
            ...profile,
            created_at: event.created_at
          };
        } catch {
          return null;
        }
      }));

      const validUsers = users.filter(Boolean);

      // Create Fuse instance and search
      const fuse = new Fuse(validUsers, this.userFuseOptions);
      const results = fuse.search(query);

      // Format results
      const formattedResults = results.map(result => ({
        pubkey: result.item.pubkey,
        name: result.item.name || result.item.display_name || 'Anonymous',
        display_name: result.item.display_name,
        about: result.item.about,
        picture: result.item.picture,
        nip05: result.item.nip05,
        lud16: result.item.lud16,
        created_at: result.item.created_at,
        score: result.score,
        matches: result.matches,
        relevance: this.calculateUserRelevance(result.item, result.score, result.matches)
      }));

      // Sort by relevance
      formattedResults.sort((a, b) => b.relevance - a.relevance);

      // Cache results
      if (useCache) {
        await db.cacheSearchResults(cacheKey, formattedResults, 600000); // 10 minutes cache
      }

      return this.paginateResults(formattedResults, limit, offset);

    } catch (error) {
      console.error('User search error:', error);
      throw new Error(`User search failed: ${error.message}`);
    }
  }

  async searchThreadsByAuthor(authorPubkey, options = {}) {
    const { limit = 20, offset = 0, kinds = [30023, 1] } = options;

    try {
      const filters = {
        kinds,
        authors: [authorPubkey],
        limit
      };

      const events = await getEvents(filters);
      const processedEvents = await this.processEventsForSearch(events);

      return this.paginateResults(processedEvents, limit, offset);

    } catch (error) {
      console.error('Author search error:', error);
      throw new Error(`Author search failed: ${error.message}`);
    }
  }

  async searchByTag(tag, options = {}) {
    const { limit = 20, offset = 0, kinds = [30023, 1] } = options;

    try {
      const filters = {
        kinds,
        '#t': [tag],
        limit
      };

      const events = await getEvents(filters);
      const processedEvents = await this.processEventsForSearch(events);

      return this.paginateResults(processedEvents, limit, offset);

    } catch (error) {
      console.error('Tag search error:', error);
      throw new Error(`Tag search failed: ${error.message}`);
    }
  }

  async processEventsForSearch(events) {
    const processedEvents = await Promise.all(events.map(async (event) => {
      let authorInfo = { name: 'Unknown', picture: null };

      try {
        // Try to get cached profile first
        authorInfo = await db.getCachedProfile(event.pubkey) || authorInfo;

        // If not cached, fetch and cache
        if (!authorInfo.name || authorInfo.name === 'Unknown') {
          const profile = await getUserProfile(event.pubkey);
          authorInfo = {
            name: profile.name || profile.display_name || `Anonymous ${event.pubkey.substring(0, 8)}...`,
            picture: profile.picture,
            displayName: profile.display_name
          };
          await db.cacheProfile(event.pubkey, profile);
        }
      } catch (error) {
        console.warn('Failed to get author info:', error);
      }

      // Extract title from event
      let title = '';
      if (event.kind === 30023) {
        const titleTag = event.tags.find(tag => tag[0] === 'title');
        title = titleTag ? titleTag[1] : event.content.split('\n')[0].substring(0, 100);
      }

      return {
        id: event.id,
        kind: event.kind,
        content: event.content,
        title,
        author: event.pubkey,
        authorName: authorInfo.name,
        authorPicture: authorInfo.picture,
        created_at: event.created_at,
        tags: event.tags.map(tag => tag[1]).filter(Boolean),
        room: this.extractRoomInfo(event)
      };
    }));

    return processedEvents;
  }

  createHighlightedSnippets(content, matches) {
    if (!matches || matches.length === 0) return [];

    const snippets = [];
    const maxSnippetLength = 150;
    const snippetCount = Math.min(3, matches.length);

    for (let i = 0; i < snippetCount; i++) {
      const match = matches[i];
      if (match.indices && match.indices.length > 0) {
        const [startIndex, endIndex] = match.indices[0];

        // Extract context around the match
        const contextStart = Math.max(0, startIndex - 50);
        const contextEnd = Math.min(content.length, endIndex + 50);

        let snippet = content.substring(contextStart, contextEnd);

        // Add ellipsis if needed
        if (contextStart > 0) snippet = '...' + snippet;
        if (contextEnd < content.length) snippet = snippet + '...';

        // Highlight the matched text
        const highlightedMatch = content.substring(startIndex, endIndex);
        snippet = snippet.replace(highlightedMatch, `<mark>${highlightedMatch}</mark>`);

        snippets.push(snippet);
      }
    }

    return snippets;
  }

  calculateRelevance(event, score, matches) {
    let relevance = 1 - score; // Invert score so higher is better

    // Boost recent content
    const now = Math.floor(Date.now() / 1000);
    const ageInHours = (now - event.created_at) / 3600;
    const recencyBoost = Math.max(0, 1 - (ageInHours / 168)); // Decay over a week
    relevance += recencyBoost * 0.2;

    // Boost content with more matches
    if (matches && matches.length > 1) {
      relevance += Math.min(matches.length * 0.05, 0.3);
    }

    // Boost forum threads over replies
    if (event.kind === 30023) {
      relevance += 0.1;
    }

    return Math.min(relevance, 1.0); // Cap at 1.0
  }

  calculateUserRelevance(user, score, matches) {
    let relevance = 1 - score;

    // Boost users with complete profiles
    const completeness = [
      user.name,
      user.display_name,
      user.about,
      user.picture,
      user.nip05
    ].filter(Boolean).length / 5;

    relevance += completeness * 0.2;

    // Boost recently active users
    const now = Math.floor(Date.now() / 1000);
    const ageInDays = (now - user.created_at) / 86400;
    const activityBoost = Math.max(0, 1 - (ageInDays / 30)); // Decay over 30 days
    relevance += activityBoost * 0.1;

    return Math.min(relevance, 1.0);
  }

  extractRoomInfo(event) {
    const dTag = event.tags.find(tag => tag[0] === 'd');
    if (dTag) {
      return {
        id: dTag[1],
        name: dTag[1] // Would need to look up room name from config
      };
    }
    return null;
  }

  paginateResults(results, limit, offset) {
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      results: paginatedResults,
      pagination: {
        total: results.length,
        limit,
        offset,
        hasMore: offset + limit < results.length
      }
    };
  }

  // Advanced search with multiple filters
  async advancedSearch(params) {
    const {
      query,
      authors = [],
      kinds = [30023, 1],
      tags = [],
      rooms = [],
      dateRange = { start: null, end: null },
      sortBy = 'relevance',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = params;

    try {
      let filters = {
        kinds,
        limit: 500
      };

      if (authors.length > 0) {
        filters.authors = authors;
      }

      if (tags.length > 0) {
        filters['#t'] = tags;
      }

      if (rooms.length > 0) {
        filters['#d'] = rooms;
      }

      if (dateRange.start) {
        filters.since = Math.floor(new Date(dateRange.start).getTime() / 1000);
      }

      if (dateRange.end) {
        filters.until = Math.floor(new Date(dateRange.end).getTime() / 1000);
      }

      const events = await getEvents(filters);
      let processedEvents = await this.processEventsForSearch(events);

      // Apply text search if query provided
      if (query && query.trim()) {
        const fuse = new Fuse(processedEvents, this.fuseOptions);
        const searchResults = fuse.search(query);
        processedEvents = searchResults.map(result => ({
          ...result.item,
          searchScore: result.score,
          searchMatches: result.matches
        }));
      }

      // Sort results
      processedEvents.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'relevance':
            const aRelevance = a.searchScore !== undefined ? 1 - a.searchScore : 0;
            const bRelevance = b.searchScore !== undefined ? 1 - b.searchScore : 0;
            comparison = aRelevance - bRelevance;
            break;
          case 'created_at':
            comparison = a.created_at - b.created_at;
            break;
          case 'author':
            comparison = a.authorName.localeCompare(b.authorName);
            break;
          default:
            comparison = 0;
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });

      return this.paginateResults(processedEvents, limit, offset);

    } catch (error) {
      console.error('Advanced search error:', error);
      throw new Error(`Advanced search failed: ${error.message}`);
    }
  }

  // Get search suggestions based on partial query
  async getSearchSuggestions(partialQuery) {
    if (partialQuery.length < 2) return [];

    try {
      const recentSearches = await this.getRecentSearches();
      const filtered = recentSearches.filter(search =>
        search.toLowerCase().includes(partialQuery.toLowerCase())
      );

      // Also suggest popular tags and users (simplified version)
      const filters = {
        kinds: [30023],
        limit: 100
      };

      const events = await getEvents(filters);
      const allTags = new Set();

      events.forEach(event => {
        event.tags.forEach(tag => {
          if (tag[0] === 't' && tag[1]) {
            allTags.add(tag[1]);
          }
        });
      });

      const matchingTags = Array.from(allTags).filter(tag =>
        tag.toLowerCase().includes(partialQuery.toLowerCase())
      ).slice(0, 5);

      return [
        ...filtered.slice(0, 3),
        ...matchingTags
      ].slice(0, 5);

    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }

  // Track search history
  async saveSearch(query, userId = null) {
    if (!query || query.trim().length < 2) return;

    const searchKey = `recent_searches_${userId || 'anonymous'}`;
    let recentSearches = [];

    try {
      const cached = await db.getCachedSearchResults(searchKey);
      if (cached) {
        recentSearches = cached;
      }
    } catch {
      // Ignore cache errors
    }

    // Add to recent searches (avoid duplicates)
    const trimmedQuery = query.trim();
    recentSearches = recentSearches.filter(s => s !== trimmedQuery);
    recentSearches.unshift(trimmedQuery);
    recentSearches = recentSearches.slice(0, 20); // Keep only 20 recent searches

    await db.cacheSearchResults(searchKey, recentSearches, 86400000); // Cache for 24 hours
  }

  async getRecentSearches(userId = null) {
    const searchKey = `recent_searches_${userId || 'anonymous'}`;

    try {
      const cached = await db.getCachedSearchResults(searchKey);
      return cached || [];
    } catch {
      return [];
    }
  }
}

export default new SearchManager();
