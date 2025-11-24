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
import ReactionButton from "../reactions/ReactionButton";
import ZapButton from "../zaps/ZapButton";
import RichTextEditor from "../../RichTextEditor";

const EnhancedThreadView = ({ events, onReply, currentPubkey, threadId }) => {
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  const [profiles, setProfiles] = useState(new Map());
  const [loadingMore, setLoadingMore] = useState(false);
  const [allReplies, setAllReplies] = useState(new Map());
  const [replyCounts, setReplyCounts] = useState({});
  const [replyingTo, setReplyingTo] = useState(null); // event ID
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loadingRef = useRef(false);
  const editorApiRef = useRef(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Optimize thread structure and sort chronologically (Oldest first)
  const optimizedThreads = useMemo(() => {
    const threads = optimizeThreadStructure(events);

    // Recursive sort function
    const sortThreads = (items) => {
      // Sort by created_at ascending (Oldest first)
      items.sort((a, b) => a.created_at - b.created_at);

      // Recursively sort replies
      items.forEach(item => {
        if (item.replies && item.replies.length > 0) {
          sortThreads(item.replies);
        }
      });
      return items;
    };

    return sortThreads([...threads]);
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

  // Upload helper with progress reporting; expects server endpoint /api/uploads/images
  const uploadImage = (file, onProgress) =>
    new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append("image", file);
      xhr.open("POST", "/api/uploads/images");
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res && res.url) {
              resolve({ url: res.url });
              return;
            }
          } catch (e) {
            // parse error -> fallback
          }
        }
        resolve({ url: URL.createObjectURL(file) });
      };
      xhr.onerror = () => {
        resolve({ url: URL.createObjectURL(file) });
      };
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.send(form);
    });

  const handleUploadFromEditor = async (file, uploadId) => {
    const id = Math.random().toString(36).slice(2);
    const previewUrl = URL.createObjectURL(file);
    setImages((prev) => [
      ...prev,
      {
        id,
        file,
        previewUrl,
        uploading: true,
        progress: 0,
        url: null,
        uploadId,
      },
    ]);
    setUploading(true);

    const result = await uploadImage(file, (p) => {
      setImages((prev) =>
        prev.map((it) =>
          it.uploadId === uploadId ? { ...it, progress: p } : it,
        ),
      );
    });

    setImages((prev) =>
      prev.map((it) =>
        it.uploadId === uploadId
          ? { ...it, uploading: false, progress: 100, url: result.url }
          : it,
      ),
    );

    try {
      if (
        editorApiRef.current &&
        typeof editorApiRef.current.replaceImageSrc === "function"
      ) {
        editorApiRef.current.replaceImageSrc(uploadId, result.url);
      } else {
        setReplyContent((prev) =>
          prev.replace(
            new RegExp(`src=["']data:[^"']+["']`),
            `src="${result.url}"`,
          ),
        );
      }
    } catch (e) {
      console.error("Failed to replace preview with uploaded image url:", e);
    } finally {
      setUploading(false);
    }
  };

  const hasValidContent = (content) => {
    const plainText = content.replace(/<[^>]+>/g, "").trim();
    return plainText.length > 0 || content.includes("<img");
  };

  const handleInlineReplySubmit = async (event) => {
    if (!hasValidContent(replyContent)) return;

    setIsSubmitting(true);
    try {
      await onReply(event, replyContent);
      setReplyingTo(null);
      setReplyContent("");
      // Auto expand the thread to show the new reply (if we could predict it)
      if (!expandedThreads.has(event.id)) {
        toggleThread(event.id);
      }
    } catch (error) {
      console.error("Failed to reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time ago helper (Thai)
  const formatThaiTimeAgo = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return "เมื่อสักครู่";
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} วันที่แล้ว`;

    return new Date(timestamp * 1000).toLocaleDateString("th-TH");
  };

  const renderEvent = (
    event,
    index,
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
    const replyCount = replyCounts[event.id] || 0;
    const hasMoreReplies =
      allReplies.get(event.id)?.length > (event.replies?.length || 0);
    const isReplying = replyingTo === event.id;

    return (
      <div
        key={event.id}
        className={`relative ${depth > 0 ? "mt-4" : "mb-6"}`}
      >
        {/* Thread line connector for nested replies */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200 -ml-4" />
        )}

        {/* Event card */}
        <div
          className={`
          modern-card p-6
          ${depth > 0 ? "ml-8 bg-gray-50/50" : "bg-white"}
          transition-all duration-200
          ${currentPubkey === event.pubkey ? "ring-2 ring-blue-500/20" : ""}
        `}
        >
          {/* Comment Number - Only for top level */}
          {depth === 0 && (
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                ความคิดเห็นที่ {index + 1}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-6 text-gray-800">
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {parseMentions(event.content, profiles)}
            </p>
          </div>

          {/* Footer: User Info & Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {/* Left: Actions & User Info */}
            <div className="flex items-center gap-6">
              {/* Reactions */}
              <ReactionButton
                event={event}
                currentPubkey={currentPubkey}
              />

              {/* Zap Button */}
              <ZapButton
                targetEvent={event}
                recipientPubkey={event.pubkey}
                currentPubkey={currentPubkey}
              />

              <div className="h-4 w-px bg-gray-200"></div>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                    {profile.picture ? (
                      <img
                        src={profile.picture}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center h-full text-sm font-bold">
                        {profile.name?.[0]?.toUpperCase() ||
                          event.pubkey.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (window.showUserProfile) {
                          window.showUserProfile(event.pubkey);
                        }
                      }}
                      className="font-bold text-gray-900 hover:text-blue-600 transition-colors text-sm"
                    >
                      {profile.display_name || profile.name || "Anonymous"}
                    </button>
                    {/* Verified Icon Placeholder */}
                    {profile.nip05 && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {formatThaiTimeAgo(event.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Reply Action */}
            <div className="flex items-center space-x-4">
              {onReply && (
                <button
                  onClick={() => {
                    if (replyingTo === event.id) {
                      setReplyingTo(null);
                      setReplyContent("");
                    } else {
                      setReplyingTo(event.id);
                      setReplyContent("");
                    }
                  }}
                  className={`
                    text-sm font-medium flex items-center space-x-1.5 transition-colors px-3 py-1.5 rounded-lg
                    ${replyingTo === event.id ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"}
                  `}
                >
                  <svg
                    className="w-4 h-4 transform scale-x-[-1]"
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
                  <span>{replyingTo === event.id ? "ยกเลิก" : "ตอบกลับ"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Inline Reply Form */}
          {isReplying && (
            <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
              <div className="space-y-4">
                <RichTextEditor
                  ref={editorApiRef}
                  value={replyContent}
                  onChange={setReplyContent}
                  disabled={isSubmitting}
                  onUpload={handleUploadFromEditor}
                  placeholder="เขียนความคิดเห็นของคุณ..."
                />
                <div className="flex items-center justify-between mt-2 px-1">
                  <div className="text-xs text-gray-400">
                    Supported: JPG, PNG, GIF, WebP
                  </div>
                  {uploading && (
                    <div className="flex items-center space-x-2 text-xs text-blue-600 font-medium animate-pulse">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                      <span>Uploading image...</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => handleInlineReplySubmit(event)}
                    disabled={isSubmitting || !hasValidContent(replyContent)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="loading loading-spinner loading-xs"></div>
                        <span>กำลังส่ง...</span>
                      </>
                    ) : (
                      <span>ส่งความคิดเห็น</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Expand/Collapse Replies */}
          {(event.replies?.length > 0 || replyCount > 0) && (
            <div className="mt-4 pt-2 border-t border-gray-50">
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
                className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center space-x-1 transition-colors mt-2"
              >
                <span>
                  {isExpanded ? "ซ่อน" : "ดู"} {replyCount} ความคิดเห็นย่อย
                </span>
                <svg
                  className={`w-3 h-3 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
            </div>
          )}
        </div>

        {/* Loading indicator for more replies */}
        {isExpanded && loadingMore && parentEventId === event.id && (
          <div className="ml-8 mb-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="loading loading-spinner loading-sm text-blue-500"></div>
                <span className="text-sm text-gray-500">
                  กำลังโหลด...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {isExpanded && event.replies && (
          <div className="mt-4">
            {event.replies.map((reply, replyIndex) =>
              renderEvent(
                reply,
                replyIndex, // Nested index
                depth + 1,
                replyIndex === event.replies.length - 1,
                event.id,
              ),
            )}
          </div>
        )}

        {/* Load more replies button */}
        {isExpanded && hasMoreReplies && !loadingMore && (
          <div className="ml-8 mb-3">
            <button
              onClick={() => loadMoreReplies(event.id)}
              className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 w-full text-center text-sm text-blue-600 hover:text-blue-700 transition-colors shadow-sm font-medium"
            >
              โหลดเพิ่มเติม...
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

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="bg-white p-8 rounded-2xl shadow-sm inline-block">
          <svg
            className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-300"
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
          <p className="text-lg font-medium text-gray-500">ยังไม่มีความคิดเห็น</p>
          <p className="text-sm text-gray-400 mt-1">เป็นคนแรกที่เริ่มบทสนทนานี้!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-thread-view">
      <div className="mb-6 flex items-center space-x-2 text-gray-600 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="font-semibold">{optimizedThreads.length} ความคิดเห็น</span>
      </div>

      <div className="space-y-2">
        {optimizedThreads.map((thread, index) => renderEvent(thread, index))}
      </div>

      {loadingMore && (
        <div className="text-center py-8">
          <div className="loading loading-spinner loading-md text-blue-500"></div>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            กำลังโหลด...
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedThreadView;
