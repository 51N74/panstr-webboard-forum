"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  parseThread,
  optimizeThreadStructure,
  getUserProfile,
  formatPubkey,
  getEvents,
} from "../../../lib/nostrClient";
import db from "../../../lib/storage/indexedDB";

const EnhancedThreadView = ({ events, onReply, currentPubkey, threadId }) => {
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  const [profiles, setProfiles] = useState(new Map());
  const [loadingMore, setLoadingMore] = useState(false);
  const [allReplies, setAllReplies] = useState(new Map());
  const [replyCounts, setReplyCounts] = useState(new Map());
  const loadingRef = useRef(false);

  // Optimize thread structure
  const optimizedThreads = useMemo(() => {
    return optimizeThreadStructure(events);
  }, [events]);

  // Load profiles for all participants
  useEffect(() => {
    const loadProfiles = async () => {
      const uniquePubkeys = new Set();

      // Extract all unique pubkeys from events
      events.forEach((event) => {
        uniquePubkeys.add(event.pubkey);
        const parsed = parseThread(event);
        parsed.profiles.forEach((profile) => {
          uniquePubkeys.add(profile.pubkey);
        });
      });

      // Load profiles with caching
      const profilePromises = Array.from(uniquePubkeys).map(async (pubkey) => {
        try {
          // Try cache first
          let profile = await db.getCachedProfile(pubkey);

          if (!profile) {
            profile = await getUserProfile(pubkey);
            // Cache the profile
            await db.cacheProfile(pubkey, profile);
          }

          return [pubkey, profile];
        } catch (error) {
          console.warn(`Failed to load profile for ${pubkey}:`, error);
          return [pubkey, { name: formatPubkey(pubkey), pubkey }];
        }
      });

      const profileResults = await Promise.all(profilePromises);
      const profileMap = new Map(profileResults);
      setProfiles(profileMap);
    };

    if (events.length > 0) {
      loadProfiles();
    }
  }, [events]);

  // Load additional replies for expanded threads
  const loadMoreReplies = useCallback(
    async (parentEventId, offset = 0) => {
      if (loadingRef.current || !threadId) return;

      loadingRef.current = true;
      setLoadingMore(true);

      try {
        const filters = {
          kinds: [1],
          "#e": [parentEventId],
          limit: 20,
          ...(offset > 0 && { until: offset }),
        };

        const additionalReplies = await getEvents(filters);

        if (additionalReplies.length > 0) {
          setAllReplies((prev) => {
            const newReplies = new Map(prev);
            const existingReplies = newReplies.get(parentEventId) || [];
            newReplies.set(parentEventId, [
              ...existingReplies,
              ...additionalReplies,
            ]);
            return newReplies;
          });

          // Update reply counts
          const counts = await calculateReplyCounts([
            parentEventId,
            ...additionalReplies.map((r) => r.id),
          ]);
          setReplyCounts((prev) => ({ ...prev, ...counts }));
        }
      } catch (error) {
        console.error("Error loading more replies:", error);
      } finally {
        loadingRef.current = false;
        setLoadingMore(false);
      }
    },
    [threadId],
  );

  // Calculate reply counts for events
  const calculateReplyCounts = useCallback(async (eventIds) => {
    const counts = {};

    for (const eventId of eventIds) {
      try {
        const replyFilters = {
          kinds: [1],
          "#e": [eventId],
          limit: 1000,
        };
        const replies = await getEvents(replyFilters);
        counts[eventId] = replies.length;
      } catch (error) {
        counts[eventId] = 0;
      }
    }

    return counts;
  }, []);

  // Initialize reply counts for current events
  useEffect(() => {
    const eventIds = events.map((e) => e.id);
    calculateReplyCounts(eventIds).then(setReplyCounts);
  }, [events, calculateReplyCounts]);

  const toggleThread = (threadId) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const renderEvent = (
    event,
    depth = 0,
    isLast = false,
    parentEventId = null,
  ) => {
    const parsed = parseThread(event);
    const profile = profiles.get(event.pubkey) || {
      name: "Unknown",
      pubkey: event.pubkey,
    };
    const isExpanded = expandedThreads.has(event.id);
    const replyCount = replyCounts.get(event.id) || 0;
    const hasMoreReplies =
      allReplies.get(event.id)?.length > (event.replies?.length || 0);

    return (
      <div key={event.id} className={`relative ${depth > 0 ? "ml-6" : ""}`}>
        {/* Thread line connector */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-base-300 -ml-3" />
        )}

        {/* Event card */}
        <div
          className={`
          bg-base-100 rounded-lg shadow-sm border border-base-300 p-4 mb-3
          ${isLast ? "" : "border-b-2"}
          ${depth > 0 ? "ml-6" : ""}
          transition-all duration-200 hover:shadow-md
          ${currentPubkey === event.pubkey ? "border-primary/30" : ""}
        `}
        >
          {/* Header with profile info */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="avatar">
                <div className="w-10 h-10 rounded-full">
                  {profile.picture ? (
                    <img
                      src={profile.picture}
                      alt={profile.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-neutral text-neutral-content flex items-center justify-center h-full">
                      {profile.name?.[0]?.toUpperCase() ||
                        event.pubkey.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button
                  onClick={() => {
                    // Trigger profile modal
                    if (window.showUserProfile) {
                      window.showUserProfile(event.pubkey);
                    }
                  }}
                  className="font-semibold text-base-content hover:text-primary transition-colors text-left"
                >
                  {profile.display_name || profile.name || "Anonymous"}
                </button>

                {profile.name && profile.name !== profile.display_name && (
                  <div className="text-sm text-base-content/60">
                    @{profile.name}
                  </div>
                )}

                <div className="text-xs text-base-content/50">
                  {formatPubkey(profile.pubkey)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-base-content/60">
              {parsed.depth > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                  Depth {parsed.depth}
                </span>
              )}
              {currentPubkey === event.pubkey && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  You
                </span>
              )}
              <span title={new Date(event.created_at * 1000).toLocaleString()}>
                {formatTimeAgo(event.created_at)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none mb-3">
            <p className="whitespace-pre-wrap break-words text-base-content/90">
              {parseMentions(event.content, profiles)}
            </p>
          </div>

          {/* Thread metadata */}
          <div className="flex flex-wrap gap-2 mb-3">
            {parsed.root && parsed.root.id !== threadId && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                Root: {parsed.root.id.slice(0, 8)}...
              </span>
            )}
            {parsed.reply && parsed.reply.id !== threadId && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                Reply to: {parsed.reply.id.slice(0, 8)}...
              </span>
            )}
            {parsed.mentions.length > 0 && (
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                {parsed.mentions.length} mention
                {parsed.mentions.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Mentions */}
          {parsed.mentions.length > 0 && (
            <div className="mb-3">
              <div className="text-sm text-base-content/60 mb-1">Mentions:</div>
              <div className="flex flex-wrap gap-1">
                {parsed.mentions.map((mention, index) => {
                  const mentionProfile = profiles.get(mention.pubkey) || {
                    name: formatPubkey(mention.pubkey),
                    pubkey: mention.pubkey,
                  };
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (window.showUserProfile) {
                          window.showUserProfile(mention.pubkey);
                        }
                      }}
                      className="bg-base-200 text-base-content/80 px-2 py-1 rounded text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {mentionProfile.display_name || mentionProfile.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-base-200">
            <div className="flex items-center space-x-4">
              {onReply && (
                <button
                  onClick={() => onReply(event)}
                  className="text-primary hover:text-primary/80 text-sm font-medium flex items-center space-x-1 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  <span>Reply</span>
                </button>
              )}

              {replyCount > 0 && (
                <span className="text-sm text-base-content/60">
                  {replyCount} {replyCount === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>

            {(event.replies?.length > 0 || replyCount > 0) && (
              <button
                onClick={() => {
                  toggleThread(event.id);
                  if (
                    !isExpanded &&
                    replyCount > (event.replies?.length || 0)
                  ) {
                    loadMoreReplies(event.id);
                  }
                }}
                className="text-base-content/60 hover:text-base-content text-sm flex items-center space-x-1 transition-colors"
              >
                <span>
                  {isExpanded ? "Hide" : "Show"} {replyCount} repl
                  {replyCount === 1 ? "y" : "ies"}
                </span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Loading indicator for more replies */}
        {isExpanded && loadingMore && parentEventId === event.id && (
          <div className="ml-6 mb-3">
            <div className="bg-base-100 rounded-lg border border-base-300 p-4">
              <div className="flex items-center space-x-2">
                <div className="loading loading-spinner loading-sm"></div>
                <span className="text-sm text-base-content/60">
                  Loading more replies...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {isExpanded && event.replies && (
          <div className="mt-3">
            {event.replies.map((reply, index) =>
              renderEvent(
                reply,
                depth + 1,
                index === event.replies.length - 1,
                event.id,
              ),
            )}
          </div>
        )}

        {/* Load more replies button */}
        {isExpanded && hasMoreReplies && !loadingMore && (
          <div className="ml-6 mb-3">
            <button
              onClick={() => loadMoreReplies(event.id)}
              className="bg-base-100 hover:bg-base-200 border border-base-300 rounded-lg p-3 w-full text-center text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Load more replies...
            </button>
          </div>
        )}
      </div>
    );
  };

  // Helper function to parse mentions in content
  const parseMentions = (content, profileMap) => {
    // Simple mention parsing - replace #[0] with profile names
    return content.replace(/#\[(\d+)\]/g, (match, index) => {
      // This would need to be enhanced to properly map to the actual p-tags
      const profile = Array.from(profileMap.values())[parseInt(index)];
      return profile ? `@${profile.display_name || profile.name}` : match;
    });
  };

  // Format time ago helper
  const formatTimeAgo = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/50">
        <svg
          className="w-12 h-12 mx-auto mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p>No threads to display</p>
      </div>
    );
  }

  return (
    <div className="enhanced-thread-view">
      <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <h3 className="text-sm font-semibold text-primary mb-1">
          Enhanced NIP-10 Threading
        </h3>
        <p className="text-xs text-primary/80">
          Showing {optimizedThreads.length} thread
          {optimizedThreads.length !== 1 ? "s" : ""} with hierarchical replies,
          batch loading, and improved marker support
        </p>
      </div>

      <div className="space-y-4">
        {optimizedThreads.map((thread) => renderEvent(thread))}
      </div>

      {loadingMore && (
        <div className="text-center py-4">
          <div className="loading loading-spinner loading-md"></div>
          <p className="text-sm text-base-content/60 mt-2">
            Loading more replies...
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedThreadView;
