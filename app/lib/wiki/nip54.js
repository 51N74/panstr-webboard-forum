/**
 * NIP-54 Wiki System Implementation
 * Collaborative document editing with version control and categorization
 */

import { getPool, publishToPool, queryEvents } from '../nostrClient.js';

// NIP-54 Event Kinds
export const NIP54_KINDS = {
  WIKI_PAGE: 30810,           // Wiki page creation/edit
  WIKI_PAGE_VERSION: 30811,   // Wiki page version history
  WIKI_CATEGORY: 30812,       // Wiki category definition
  WIKI_RENAME: 30813,         // Wiki page rename
  WIKI_DELETE: 30814,         // Wiki page deletion
  WIKI_COLLABORATION: 30815,  // Wiki collaboration request
  WIKI_COMMENT: 30816,         // Wiki page comments
  WIKI_TAG: 30817,            // Wiki page tagging
  WIKI_INDEX: 30818,          // Wiki index/navigation
  WIKI_TEMPLATE: 30819        // Wiki page templates
};

// Page Status
export const PAGE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
  UNDER_REVIEW: 'under_review'
};

// Collaboration Status
export const COLLABORATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active'
};

// Edit Types
export const EDIT_TYPES = {
  CREATE: 'create',
  EDIT: 'edit',
  MINOR_EDIT: 'minor_edit',
  REVERT: 'revert',
  MERGE: 'merge'
};

/**
 * Create a new wiki page
 */
export function createWikiPage(pageData, authorPubkey) {
  const pageId = generatePageId(pageData.title);

  return {
    kind: NIP54_KINDS.WIKI_PAGE,
    content: JSON.stringify({
      title: pageData.title,
      content: pageData.content,
      summary: pageData.summary || '',
      category: pageData.category || '',
      tags: pageData.tags || [],
      status: pageData.status || PAGE_STATUS.DRAFT,
      language: pageData.language || 'en',
      template: pageData.template || '',
      metadata: pageData.metadata || {},
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000)
    }),
    tags: [
      ['d', pageId],
      ['title', pageData.title],
      ['author', authorPubkey],
      ['category', pageData.category || 'general'],
      ['status', pageData.status || PAGE_STATUS.DRAFT],
      ['language', pageData.language || 'en'],
      ['version', '1'],
      ['created_at', Math.floor(Date.now() / 1000).toString()],
      ...pageData.tags?.map(tag => ['t', tag]) || []
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create a wiki page version
 */
export function createWikiPageVersion(pageId, versionData, authorPubkey, parentVersion = null) {
  const versionNumber = versionData.versionNumber || generateVersionNumber();

  return {
    kind: NIP54_KINDS.WIKI_PAGE_VERSION,
    content: JSON.stringify({
      page_id: pageId,
      version_number: versionNumber,
      title: versionData.title,
      content: versionData.content,
      edit_summary: versionData.editSummary || '',
      edit_type: versionData.editType || EDIT_TYPES.EDIT,
      changes: versionData.changes || {},
      parent_version: parentVersion,
      author_pubkey: authorPubkey,
      created_at: Math.floor(Date.now() / 1000),
      word_count: versionData.content ? versionData.content.split(/\s+/).length : 0,
      character_count: versionData.content ? versionData.content.length : 0
    }),
    tags: [
      ['d', `${pageId}_v${versionNumber}`],
      ['page_id', pageId],
      ['version', versionNumber.toString()],
      ['author', authorPubkey],
      ['edit_type', versionData.editType || EDIT_TYPES.EDIT],
      ['parent_version', parentVersion || ''],
      ['created_at', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create wiki category definition
 */
export function createWikiCategory(categoryData, creatorPubkey) {
  const categoryId = generateCategoryId(categoryData.name);

  return {
    kind: NIP54_KINDS.WIKI_CATEGORY,
    content: JSON.stringify({
      name: categoryData.name,
      description: categoryData.description || '',
      parent_category: categoryData.parentCategory || '',
      color: categoryData.color || '#007bff',
      icon: categoryData.icon || '',
      sort_order: categoryData.sortOrder || 0,
      is_private: categoryData.isPrivate || false,
      allowed_editors: categoryData.allowedEditors || [],
      metadata: categoryData.metadata || {},
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000)
    }),
    tags: [
      ['d', categoryId],
      ['name', categoryData.name],
      ['creator', creatorPubkey],
      ['parent_category', categoryData.parentCategory || ''],
      ['color', categoryData.color || '#007bff'],
      ['created_at', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create wiki page rename event
 */
export function createWikiRename(pageId, oldTitle, newTitle, authorPubkey, reason = '') {
  return {
    kind: NIP54_KINDS.WIKI_RENAME,
    content: JSON.stringify({
      page_id: pageId,
      old_title: oldTitle,
      new_title: newTitle,
      reason: reason,
      author_pubkey: authorPubkey,
      renamed_at: Math.floor(Date.now() / 1000)
    }),
    tags: [
      ['d', generateRenameId(pageId)],
      ['page_id', pageId],
      ['old_title', oldTitle],
      ['new_title', newTitle],
      ['author', authorPubkey],
      ['renamed_at', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create wiki page deletion event
 */
export function createWikiDelete(pageId, title, authorPubkey, reason = '') {
  return {
    kind: NIP54_KINDS.WIKI_DELETE,
    content: JSON.stringify({
      page_id: pageId,
      title: title,
      reason: reason,
      author_pubkey: authorPubkey,
      deleted_at: Math.floor(Date.now() / 1000),
      is_permanent: false // Can be undeleted
    }),
    tags: [
      ['d', generateDeleteId(pageId)],
      ['page_id', pageId],
      ['title', title],
      ['author', authorPubkey],
      ['deleted_at', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create wiki collaboration request
 */
export function createWikiCollaboration(pageId, requestData, requesterPubkey) {
  return {
    kind: NIP54_KINDS.WIKI_COLLABORATION,
    content: JSON.stringify({
      page_id: pageId,
      requester_pubkey: requesterPubkey,
      request_type: requestData.requestType, // 'edit_access', 'review', 'merge_request'
      proposed_changes: requestData.proposedChanges || {},
      message: requestData.message || '',
      status: COLLABORATION_STATUS.PENDING,
      requested_at: Math.floor(Date.now() / 1000),
      expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }),
    tags: [
      ['d', generateCollaborationId(pageId, requesterPubkey)],
      ['page_id', pageId],
      ['requester', requesterPubkey],
      ['request_type', requestData.requestType],
      ['status', COLLABORATION_STATUS.PENDING],
      ['requested_at', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create wiki page comment
 */
export function createWikiComment(pageId, commentData, authorPubkey, parentComment = null) {
  return {
    kind: NIP54_KINDS.WIKI_COMMENT,
    content: JSON.stringify({
      page_id: pageId,
      comment: commentData.comment,
      section: commentData.section || '',
      line_number: commentData.lineNumber || null,
      parent_comment: parentComment,
      author_pubkey: authorPubkey,
      created_at: Math.floor(Date.now() / 1000),
      is_resolved: false
    }),
    tags: [
      ['d', generateCommentId(pageId, authorPubkey)],
      ['page_id', pageId],
      ['author', authorPubkey],
      ['section', commentData.section || ''],
      ...(parentComment ? [['parent_comment', parentComment]] : []),
      ['created_at', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create wiki page tagging event
 */
export function createWikiTag(pageId, tags, authorPubkey) {
  return {
    kind: NIP54_KINDS.WIKI_TAG,
    content: JSON.stringify({
      page_id: pageId,
      tags: tags,
      author_pubkey: authorPubkey,
      tagged_at: Math.floor(Date.now() / 1000)
    }),
    tags: [
      ['d', generateTagId(pageId)],
      ['page_id', pageId],
      ['author', authorPubkey],
      ...tags.map(tag => ['t', tag]),
      ['tagged_at', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create wiki index/navigation event
 */
export function createWikiIndex(indexData, creatorPubkey) {
  return {
    kind: NIP54_KINDS.WIKI_INDEX,
    content: JSON.stringify({
      title: indexData.title,
      description: indexData.description || '',
      structure: indexData.structure || [],
      featured_pages: indexData.featuredPages || [],
      recent_changes: indexData.recentChanges || [],
      statistics: indexData.statistics || {},
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000)
    }),
    tags: [
      ['d', 'wiki_index'],
      ['creator', creatorPubkey],
      ['updated_at', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create wiki page template
 */
export function createWikiTemplate(templateData, creatorPubkey) {
  const templateId = generateTemplateId(templateData.name);

  return {
    kind: NIP54_KINDS.WIKI_TEMPLATE,
    content: JSON.stringify({
      name: templateData.name,
      description: templateData.description || '',
      content: templateData.content,
      variables: templateData.variables || [],
      category: templateData.category || 'general',
      is_public: templateData.isPublic !== false,
      creator_pubkey: creatorPubkey,
      created_at: Math.floor(Date.now() / 1000),
      usage_count: 0
    }),
    tags: [
      ['d', templateId],
      ['name', templateData.name],
      ['creator', creatorPubkey],
      ['category', templateData.category || 'general'],
      ['public', templateData.isPublic !== false ? 'true' : 'false'],
      ['created_at', Math.floor(Date.now() / 1000).toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Publish wiki page
 */
export async function publishWikiPage(pageData, authorPrivateKey) {
  const authorPubkey = await getPubkeyFromPrivateKey(authorPrivateKey);
  const event = createWikiPage(pageData, authorPubkey);
  return await publishToPool([event], authorPrivateKey);
}

/**
 * Get wiki pages
 */
export async function getWikiPages(category = null, status = null, relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP54_KINDS.WIKI_PAGE],
    limit: 100
  };

  if (category) {
    filter['#category'] = [category];
  }

  if (status) {
    filter['#status'] = [status];
  }

  const events = await queryEvents(filter, relays);
  return events.map(event => ({
    id: event.id,
    pageId: event.tags.find(tag => tag[0] === 'd')?.[1],
    title: event.tags.find(tag => tag[0] === 'title')?.[1],
    author: event.tags.find(tag => tag[0] === 'author')?.[1],
    category: event.tags.find(tag => tag[0] === 'category')?.[1],
    status: event.tags.find(tag => tag[0] === 'status')?.[1],
    page: JSON.parse(event.content),
    created_at: event.created_at
  }));
}

/**
 * Get wiki page versions
 */
export async function getWikiPageVersions(pageId, relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP54_KINDS.WIKI_PAGE_VERSION],
    '#page_id': [pageId],
    limit: 50
  };

  const events = await queryEvents(filter, relays);
  return events.map(event => ({
    id: event.id,
    versionId: event.tags.find(tag => tag[0] === 'd')?.[1],
    pageId: event.tags.find(tag => tag[0] === 'page_id')?.[1],
    version: event.tags.find(tag => tag[0] === 'version')?.[1],
    author: event.tags.find(tag => tag[0] === 'author')?.[1],
    editType: event.tags.find(tag => tag[0] === 'edit_type')?.[1],
    versionData: JSON.parse(event.content),
    created_at: event.created_at
  })).sort((a, b) => b.version.localeCompare(a.version));
}

/**
 * Get wiki categories
 */
export async function getWikiCategories(relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP54_KINDS.WIKI_CATEGORY],
    limit: 100
  };

  const events = await queryEvents(filter, relays);
  return events.map(event => ({
    id: event.id,
    categoryId: event.tags.find(tag => tag[0] === 'd')?.[1],
    name: event.tags.find(tag => tag[0] === 'name')?.[1],
    creator: event.tags.find(tag => tag[0] === 'creator')?.[1],
    parentCategory: event.tags.find(tag => tag[0] === 'parent_category')?.[1],
    color: event.tags.find(tag => tag[0] === 'color')?.[1],
    category: JSON.parse(event.content),
    created_at: event.created_at
  }));
}

/**
 * Get wiki comments for page
 */
export async function getWikiComments(pageId, relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP54_KINDS.WIKI_COMMENT],
    '#page_id': [pageId],
    limit: 100
  };

  const events = await queryEvents(filter, relays);
  return events.map(event => ({
    id: event.id,
    commentId: event.tags.find(tag => tag[0] === 'd')?.[1],
    pageId: event.tags.find(tag => tag[0] === 'page_id')?.[1],
    author: event.tags.find(tag => tag[0] === 'author')?.[1],
    section: event.tags.find(tag => tag[0] === 'section')?.[1],
    parentComment: event.tags.find(tag => tag[0] === 'parent_comment')?.[1],
    comment: JSON.parse(event.content),
    created_at: event.created_at
  }));
}

/**
 * Search wiki pages
 */
export async function searchWikiPages(query, category = null, relays = null) {
  const allPages = await getWikiPages(category, PAGE_STATUS.PUBLISHED, relays);

  const searchResults = allPages.filter(page => {
    const searchText = `${page.title} ${page.page.content} ${page.page.summary}`.toLowerCase();
    const searchTerms = query.toLowerCase().split(/\s+/);

    return searchTerms.every(term => searchText.includes(term));
  });

  return searchResults.map(page => ({
    ...page,
    relevanceScore: calculateRelevanceScore(page, query)
  })).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Get wiki templates
 */
export async function getWikiTemplates(category = null, relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP54_KINDS.WIKI_TEMPLATE],
    limit: 50
  };

  if (category) {
    filter['#category'] = [category];
  }

  const events = await queryEvents(filter, relays);
  return events.map(event => ({
    id: event.id,
    templateId: event.tags.find(tag => tag[0] === 'd')?.[1],
    name: event.tags.find(tag => tag[0] === 'name')?.[1],
    creator: event.tags.find(tag => tag[0] === 'creator')?.[1],
    category: event.tags.find(tag => tag[0] === 'category')?.[1],
    isPublic: event.tags.find(tag => tag[0] === 'public')?.[1] === 'true',
    template: JSON.parse(event.content),
    created_at: event.created_at
  }));
}

/**
 * Calculate wiki statistics
 */
export function calculateWikiStatistics(pages, versions, comments) {
  return {
    totalPages: pages.length,
    publishedPages: pages.filter(p => p.status === PAGE_STATUS.PUBLISHED).length,
    draftPages: pages.filter(p => p.status === PAGE_STATUS.DRAFT).length,
    totalVersions: versions.length,
    totalComments: comments.length,
    averageVersionsPerPage: pages.length > 0 ? versions.length / pages.length : 0,
    mostActiveAuthors: getMostActiveAuthors(pages, versions),
    recentlyUpdated: getRecentlyUpdatedPages(pages, versions),
    categoryDistribution: getCategoryDistribution(pages),
    totalWords: pages.reduce((sum, page) => sum + (page.page.content ? page.page.content.split(/\s+/).length : 0), 0)
  };
}

/**
 * Helper Functions
 */

function generatePageId(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 9);
}

function generateCategoryId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 9);
}

function generateVersionNumber() {
  return Date.now().toString().substring(0, 10);
}

function generateRenameId(pageId) {
  return 'rename_' + pageId + '_' + Date.now();
}

function generateDeleteId(pageId) {
  return 'delete_' + pageId + '_' + Date.now();
}

function generateCollaborationId(pageId, requesterPubkey) {
  return 'collab_' + pageId + '_' + requesterPubkey.substring(0, 8);
}

function generateCommentId(pageId, authorPubkey) {
  return 'comment_' + pageId + '_' + authorPubkey.substring(0, 8) + '_' + Date.now();
}

function generateTagId(pageId) {
  return 'tags_' + pageId + '_' + Date.now();
}

function generateTemplateId(name) {
  return 'template_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 9);
}

async function getPubkeyFromPrivateKey(privateKey) {
  // This should use nostr-tools to derive pubkey from private key
  // For now, returning a placeholder implementation
  return typeof privateKey === 'string' ? privateKey : 'unknown';
}

function calculateRelevanceScore(page, query) {
  const title = page.title.toLowerCase();
  const content = page.page.content.toLowerCase();
  const summary = (page.page.summary || '').toLowerCase();
  const searchQuery = query.toLowerCase();

  let score = 0;

  // Title matches are most important
  if (title.includes(searchQuery)) {
    score += 10;
  }

  // Summary matches
  if (summary.includes(searchQuery)) {
    score += 5;
  }

  // Content matches
  if (content.includes(searchQuery)) {
    score += 2;
  }

  // Boost recent pages
  const ageInDays = (Date.now() / 1000 - page.created_at) / (24 * 60 * 60);
  score += Math.max(0, 5 - ageInDays / 30); // Decay over time

  return score;
}

function getMostActiveAuthors(pages, versions) {
  const authorCounts = {};

  versions.forEach(version => {
    if (!authorCounts[version.author]) {
      authorCounts[version.author] = 0;
    }
    authorCounts[version.author]++;
  });

  return Object.entries(authorCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([author, count]) => ({ author, count }));
}

function getRecentlyUpdatedPages(pages, versions) {
  const latestVersions = {};

  versions.forEach(version => {
    if (!latestVersions[version.pageId] || version.created_at > latestVersions[version.pageId].created_at) {
      latestVersions[version.pageId] = version;
    }
  });

  return Object.entries(latestVersions)
    .sort(([,a], [,b]) => b.created_at - a.created_at)
    .slice(0, 10)
    .map(([pageId, version]) => ({ pageId, version }));
}

function getCategoryDistribution(pages) {
  const distribution = {};

  pages.forEach(page => {
    if (!distribution[page.category]) {
      distribution[page.category] = 0;
    }
    distribution[page.category]++;
  });

  return distribution;
}
