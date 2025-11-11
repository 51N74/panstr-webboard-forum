import Dexie, { liveQuery } from "dexie";

class ForumDatabase extends Dexie {
  constructor() {
    super("PanstrForumDB");

    // Define schema
    this.version(1).stores({
      // Thread-related data
      threadStats:
        "++id, threadId, viewCount, lastVisited, replyCount, isRead, userId",
      bookmarks:
        "++id, threadId, userId, title, content, author, timestamp, tags",
      drafts:
        "++id, userId, threadId, content, title, tags, lastModified, isReply",

      // User preferences
      userPreferences:
        "++id, userId, theme, fontSize, layout, notifications, [userId+key]",

      // Notification data
      notifications:
        "++id, userId, type, eventId, message, isRead, timestamp, data",
      notificationSettings:
        "++id, userId, enabled, emailPush, inApp, mentions, replies, zaps",

      // Zap receipts and analytics (NIP-57)
      // zapReceipts: indexed by eventId and recipientPubkey to allow aggregation and reconciliation
      zapReceipts:
        "++id, eventId, senderPubkey, recipientPubkey, amount, bolt11, preimage, timestamp, [eventId+recipientPubkey]",
      // zapsSummary keeps a quick-lookup aggregated summary for UI (total zaps per event)
      zapsSummary: "++id, eventId, totalAmount, zapCount, lastUpdated",

      // Moderation reports (kind 1984) and local hide toggles
      reports:
        "++id, eventId, reporterPubkey, reason, evidence, createdAt, isHandled",
      localHidden: "++id, userId, eventId, hiddenAt",

      // Board and user statistics (cached)
      boardStats:
        "++id, boardId, totalThreads, activeThreads, uniqueAuthors, topUsers, heatmap, lastCalculated",
      userZapTotals: "++id, pubkey, totalReceived, totalSent, lastUpdated",

      // Search & profile cache
      searchCache: "++id, query, results, timestamp, ttl",
      profileCache: "++id, pubkey, profile, timestamp, ttl",

      // Read status
      readStatus: "++id, userId, threadId, eventId, isRead, timestamp",
    });
  }

  // Thread statistics methods
  async incrementViewCount(threadId, userId = null) {
    const existing = await this.threadStats.where({ threadId, userId }).first();

    if (existing) {
      const now = Date.now();
      // Only increment if last visit was more than 5 minutes ago
      if (now - existing.lastVisited > 5 * 60 * 1000) {
        return this.threadStats.update(existing.id, {
          viewCount: existing.viewCount + 1,
          lastVisited: now,
        });
      }
      // Update lastVisited timestamp even if not incrementing viewCount to keep recency
      return this.threadStats.update(existing.id, { lastVisited: now });
    } else {
      return this.threadStats.add({
        threadId,
        userId,
        viewCount: 1,
        lastVisited: Date.now(),
        replyCount: 0,
        isRead: false,
      });
    }
  }

  async getViewCount(threadId) {
    const stats = await this.threadStats.where({ threadId }).toArray();
    return stats.reduce((total, stat) => total + stat.viewCount, 0);
  }

  async markThreadAsRead(threadId, userId) {
    return this.threadStats.where({ threadId, userId }).modify({
      isRead: true,
      lastVisited: Date.now(),
    });
  }

  async isThreadRead(threadId, userId) {
    const stat = await this.threadStats.where({ threadId, userId }).first();
    return stat?.isRead || false;
  }

  async updateReplyCount(threadId, count) {
    return this.threadStats.where({ threadId }).modify({
      replyCount: count,
    });
  }

  //
  // Zap (NIP-57) methods
  //

  // Add a zap receipt to the DB. zap object should include:
  // { eventId, senderPubkey, recipientPubkey, amount, bolt11, preimage, timestamp }
  async addZapReceipt(zap) {
    if (!zap || !zap.eventId) throw new Error("Invalid zap payload");
    const entry = {
      eventId: zap.eventId,
      senderPubkey: zap.senderPubkey || null,
      recipientPubkey: zap.recipientPubkey || null,
      amount: zap.amount || 0,
      bolt11: zap.bolt11 || null,
      preimage: zap.preimage || null,
      timestamp: zap.timestamp || Date.now(),
    };
    const id = await this.zapReceipts.add(entry);

    // Update aggregated summary for quick UI reads
    await this._recalculateZapSummaryForEvent(zap.eventId);

    // Also update user totals for recipient/sender
    if (entry.recipientPubkey)
      await this._recalculateUserZapTotals(entry.recipientPubkey);
    if (entry.senderPubkey)
      await this._recalculateUserZapTotals(entry.senderPubkey);

    return id;
  }

  // Internal: recompute zapsSummary for an event
  async _recalculateZapSummaryForEvent(eventId) {
    const receipts = await this.zapReceipts.where({ eventId }).toArray();
    const totalAmount = receipts.reduce((s, r) => s + (r.amount || 0), 0);
    const zapCount = receipts.length;

    // Upsert into zapsSummary
    const existing = await this.zapsSummary.where({ eventId }).first();
    const payload = {
      eventId,
      totalAmount,
      zapCount,
      lastUpdated: Date.now(),
    };

    if (existing) {
      await this.zapsSummary.update(existing.id, payload);
    } else {
      await this.zapsSummary.add(payload);
    }

    return payload;
  }

  async getZapReceiptsForEvent(eventId) {
    return this.zapReceipts.where({ eventId }).reverse().toArray();
  }

  async getZapTotalForEvent(eventId) {
    const summary = await this.zapsSummary.where({ eventId }).first();
    if (summary)
      return {
        totalAmount: summary.totalAmount || 0,
        zapCount: summary.zapCount || 0,
      };
    // Fallback to calculating on the fly
    const receipts = await this.zapReceipts.where({ eventId }).toArray();
    const total = receipts.reduce((s, r) => s + (r.amount || 0), 0);
    return { totalAmount: total, zapCount: receipts.length };
  }

  // User-level zap totals (cached)
  async _recalculateUserZapTotals(pubkey) {
    if (!pubkey) return null;
    // totalReceived: sum of amounts where recipientPubkey === pubkey
    const received = await this.zapReceipts
      .where({ recipientPubkey: pubkey })
      .toArray();
    const totalReceived = received.reduce((s, r) => s + (r.amount || 0), 0);

    // totalSent: sum of amounts where senderPubkey === pubkey
    const sent = await this.zapReceipts
      .where({ senderPubkey: pubkey })
      .toArray();
    const totalSent = sent.reduce((s, r) => s + (r.amount || 0), 0);

    const existing = await this.userZapTotals.where({ pubkey }).first();
    const payload = {
      pubkey,
      totalReceived,
      totalSent,
      lastUpdated: Date.now(),
    };

    if (existing) {
      await this.userZapTotals.update(existing.id, payload);
    } else {
      await this.userZapTotals.add(payload);
    }

    return payload;
  }

  async getUserZapTotals(pubkey) {
    const existing = await this.userZapTotals.where({ pubkey }).first();
    if (existing) return existing;
    // If not present, compute and store
    return this._recalculateUserZapTotals(pubkey);
  }

  //
  // Moderation / Reporting methods (client-side)
  //

  // report: { eventId, reporterPubkey, reason, evidence (optional), createdAt }
  async addReport(report) {
    if (!report || !report.eventId || !report.reporterPubkey)
      throw new Error("Invalid report payload");
    const entry = {
      eventId: report.eventId,
      reporterPubkey: report.reporterPubkey,
      reason: report.reason || "",
      evidence: report.evidence || null,
      createdAt: report.createdAt || Date.now(),
      isHandled: false,
    };
    return this.reports.add(entry);
  }

  async getReportsForEvent(eventId) {
    return this.reports.where({ eventId }).reverse().toArray();
  }

  async markReportHandled(reportId, handled = true) {
    return this.reports.update(reportId, { isHandled: handled });
  }

  // Local hide toggle allows user to hide reported content locally (no global suppression)
  async hideContentLocally(userId, eventId) {
    if (!userId || !eventId) throw new Error("userId and eventId required");
    const existing = await this.localHidden.where({ userId, eventId }).first();
    if (existing) {
      return this.localHidden.update(existing.id, { hiddenAt: Date.now() });
    }
    return this.localHidden.add({ userId, eventId, hiddenAt: Date.now() });
  }

  async isContentHiddenForUser(userId, eventId) {
    const entry = await this.localHidden.where({ userId, eventId }).first();
    return !!entry;
  }

  //
  // Board statistics (cached) - calculated locally and updated periodically
  //

  // Calculate basic board stats from locally available caches: threadStats and profileCache
  async calculateBoardStats(boardId) {
    // Since threads don't store boardId in threadStats by default, caller should pass list of threadIds for board.
    // This method will provide an approximate pipeline if threadIds are present; otherwise it aggregates across all threads.
    const allThreads = await this.threadStats.toArray();
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const totalThreads = allThreads.length;
    const activeThreads = allThreads.filter(
      (t) => (t.lastVisited || 0) >= sevenDaysAgo,
    ).length;
    const uniqueAuthors = new Set(
      allThreads.map((t) => t.userId).filter(Boolean),
    ).size;

    // Derive top 5 users by replyCount and viewCount
    const userMap = {};
    allThreads.forEach((t) => {
      const uid = t.userId || t.threadId;
      if (!userMap[uid]) userMap[uid] = { replies: 0, views: 0 };
      userMap[uid].replies += t.replyCount || 0;
      userMap[uid].views += t.viewCount || 0;
    });

    const topUsers = Object.entries(userMap)
      .map(([uid, data]) => ({
        userId: uid,
        replies: data.replies,
        views: data.views,
      }))
      .sort((a, b) => b.replies + b.views - (a.replies + a.views))
      .slice(0, 5);

    // Simple heatmap: count of thread lastVisited per day for last 30 days
    const heatmap = {};
    const thirtyDays = 30;
    for (let i = 0; i < thirtyDays; i++) {
      const day = new Date(now - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      heatmap[day] = 0;
    }

    allThreads.forEach((t) => {
      const d = new Date(t.lastVisited || t.createdAt || now)
        .toISOString()
        .slice(0, 10);
      if (heatmap[d] !== undefined) heatmap[d] += 1;
    });

    const payload = {
      boardId: boardId || "global",
      totalThreads,
      activeThreads,
      uniqueAuthors,
      topUsers,
      heatmap,
      lastCalculated: Date.now(),
    };

    // Upsert boardStats (boardId is unique in this DB model)
    const existing = await this.boardStats
      .where({ boardId: payload.boardId })
      .first();
    if (existing) {
      await this.boardStats.update(existing.id, payload);
    } else {
      await this.boardStats.add(payload);
    }

    return payload;
  }

  async getBoardStats(boardId) {
    const existing = await this.boardStats
      .where({ boardId: boardId || "global" })
      .first();
    if (existing) return existing;
    return this.calculateBoardStats(boardId);
  }

  // Bookmark methods
  async addBookmark(userId, threadData) {
    return this.bookmarks.add({
      userId,
      threadId: threadData.id,
      title: threadData.title || threadData.content?.substring(0, 50) + "...",
      content: threadData.content?.substring(0, 200) + "...",
      author: threadData.author,
      timestamp: Date.now(),
      tags: threadData.tags || [],
    });
  }

  async removeBookmark(userId, threadId) {
    return this.bookmarks.where({ userId, threadId }).delete();
  }

  async getBookmarks(userId, limit = 50, offset = 0) {
    return this.bookmarks
      .where({ userId })
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  }

  async isBookmarked(userId, threadId) {
    const bookmark = await this.bookmarks.where({ userId, threadId }).first();
    return !!bookmark;
  }

  // Draft methods
  async saveDraft(
    userId,
    threadId,
    content,
    title = "",
    tags = [],
    isReply = false,
  ) {
    const existing = await this.drafts
      .where({ userId, threadId, isReply })
      .first();

    const draftData = {
      userId,
      threadId,
      content,
      title,
      tags,
      lastModified: Date.now(),
      isReply,
    };

    if (existing) {
      return this.drafts.update(existing.id, draftData);
    } else {
      return this.drafts.add(draftData);
    }
  }

  async getDraft(userId, threadId, isReply = false) {
    return this.drafts.where({ userId, threadId, isReply }).first();
  }

  async deleteDraft(userId, threadId, isReply = false) {
    return this.drafts.where({ userId, threadId, isReply }).delete();
  }

  async getAllDrafts(userId) {
    return this.drafts.where({ userId }).toArray();
  }

  // User preferences methods
  async setPreference(userId, key, value) {
    const existing = await this.userPreferences.where({ userId, key }).first();

    if (existing) {
      return this.userPreferences.update(existing.id, { value });
    } else {
      return this.userPreferences.add({
        userId,
        key,
        value,
      });
    }
  }

  async getPreference(userId, key, defaultValue = null) {
    const pref = await this.userPreferences.where({ userId, key }).first();
    return pref ? pref.value : defaultValue;
  }

  async getUserPreferences(userId) {
    const prefs = await this.userPreferences.where({ userId }).toArray();
    const result = {};
    prefs.forEach((pref) => {
      result[pref.key] = pref.value;
    });
    return result;
  }

  // Notification methods
  async addNotification(userId, type, eventId, message, data = {}) {
    return this.notifications.add({
      userId,
      type, // 'reply', 'mention', 'zap', etc.
      eventId,
      message,
      data,
      isRead: false,
      timestamp: Date.now(),
    });
  }

  async getNotifications(userId, limit = 20, unreadOnly = false) {
    let query = this.notifications.where({ userId });

    if (unreadOnly) {
      query = query.filter((notif) => !notif.isRead);
    }

    return query.reverse().limit(limit).toArray();
  }

  async markNotificationAsRead(notifId) {
    return this.notifications.update(notifId, { isRead: true });
  }

  async markAllNotificationsAsRead(userId) {
    return this.notifications.where({ userId }).modify({ isRead: true });
  }

  async getUnreadCount(userId) {
    return this.notifications
      .where({ userId })
      .filter((notif) => !notif.isRead)
      .count();
  }

  async deleteNotification(notifId) {
    return this.notifications.delete(notifId);
  }

  // Search cache methods
  async cacheSearchResults(query, results, ttl = 3600000) {
    // 1 hour default TTL
    // Remove old cached results for the same query
    await this.searchCache.where({ query }).delete();

    return this.searchCache.add({
      query,
      results,
      timestamp: Date.now(),
      ttl, // Time to live in milliseconds
    });
  }

  async getCachedSearchResults(query) {
    const cached = await this.searchCache.where({ query }).first();

    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > cached.ttl) {
      // Cache expired, remove it
      this.searchCache.delete(cached.id);
      return null;
    }

    return cached.results;
  }

  // Profile cache methods
  async cacheProfile(pubkey, profile, ttl = 1800000) {
    // 30 minutes default TTL
    // Remove old cached profile
    await this.profileCache.where({ pubkey }).delete();

    return this.profileCache.add({
      pubkey,
      profile,
      timestamp: Date.now(),
      ttl,
    });
  }

  async getCachedProfile(pubkey) {
    const cached = await this.profileCache.where({ pubkey }).first();

    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > cached.ttl) {
      // Cache expired, remove it
      this.profileCache.delete(cached.id);
      return null;
    }

    return cached.profile;
  }

  // Cleanup expired cache entries
  async cleanupExpiredCache() {
    const now = Date.now();

    // Clean expired search cache
    const expiredSearch = await this.searchCache
      .filter((item) => now - item.timestamp > item.ttl)
      .toArray();

    await this.searchCache.bulkDelete(expiredSearch.map((item) => item.id));

    // Clean expired profile cache
    const expiredProfiles = await this.profileCache
      .filter((item) => now - item.timestamp > item.ttl)
      .toArray();

    await this.profileCache.bulkDelete(expiredProfiles.map((item) => item.id));

    return {
      searchCleaned: expiredSearch.length,
      profilesCleaned: expiredProfiles.length,
    };
  }

  // Export/Import data for backup
  async exportUserData(userId) {
    const bookmarks = await this.getBookmarks(userId);
    const drafts = await this.getAllDrafts(userId);
    const preferences = await this.getUserPreferences(userId);
    const notifications = await this.getNotifications(userId);

    return {
      userId,
      exportDate: Date.now(),
      bookmarks,
      drafts,
      preferences,
      notifications,
    };
  }

  async importUserData(userId, data) {
    const { bookmarks, drafts, preferences } = data;

    // Clear existing data
    await this.transaction(
      "rw",
      this.bookmarks,
      this.drafts,
      this.userPreferences,
      async () => {
        await this.bookmarks.where({ userId }).delete();
        await this.drafts.where({ userId }).delete();
        await this.userPreferences.where({ userId }).delete();

        // Import bookmarks
        if (bookmarks && bookmarks.length > 0) {
          await this.bookmarks.bulkAdd(
            bookmarks.map((b) => ({ ...b, userId })),
          );
        }

        // Import drafts
        if (drafts && drafts.length > 0) {
          await this.drafts.bulkAdd(drafts.map((d) => ({ ...d, userId })));
        }

        // Import preferences
        if (preferences) {
          const prefEntries = Object.entries(preferences).map(
            ([key, value]) => ({
              userId,
              key,
              value,
            }),
          );
          await this.userPreferences.bulkAdd(prefEntries);
        }
      },
    );
  }
}

// Create and export database instance
const db = new ForumDatabase();

// Initialize database and cleanup expired cache on app start
db.open()
  .then(() => {
    console.log("Database opened successfully");
    // Cleanup expired cache entries
    db.cleanupExpiredCache().then((result) => {
      console.log("Cache cleanup completed:", result);
    });
  })
  .catch((error) => {
    console.error("Database failed to open:", error);
  });

export default db;

// Export live queries for reactive updates
export const liveBookmarks = (userId) =>
  liveQuery(() => db.bookmarks.where({ userId }).reverse().limit(20).toArray());

export const liveNotifications = (userId) =>
  liveQuery(() =>
    db.notifications
      .where({ userId })
      .filter((notif) => !notif.isRead)
      .toArray(),
  );

export const liveUnreadCount = (userId) =>
  liveQuery(() =>
    db.notifications
      .where({ userId })
      .filter((notif) => !notif.isRead)
      .count(),
  );
