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
import ReportModal from "../../ReportModal";
import Toast, { useToast } from "../../Toast";

const EnhancedThreadView = ({ events, onReply, currentPubkey, threadId }) => {
  const { success: showSuccess, error: showError, toasts, removeToast } = useToast();
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
  
  // Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingEvent, setReportingEvent] = useState(null);
  const [lastReportTime, setLastReportTime] = useState(null);

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

  // Report handlers
  const handleReportClick = (e, event) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    // Rate limiting: prevent spam reports
    const now = Date.now();
    if (lastReportTime && now - lastReportTime < 60000) {
      showError('กรุณารอ 1 นาทีก่อนส่งรายงานอีกครั้ง');
      return;
    }
    
    if (!currentPubkey) {
      showError('กรุณาเชื่อมต่อ Nostr เพื่อส่งรายงาน');
      return;
    }
    
    setReportingEvent(event);
    setShowReportModal(true);
  };

  const handleReportSubmit = async ({ eventId, eventType, reason, evidence }) => {
    try {
      const now = Date.now();
      
      // Submit report to IndexedDB
      await db.addReport({
        eventId,
        reporterPubkey: currentPubkey,
        reason,
        evidence,
        createdAt: now,
      });
      
      setLastReportTime(now);
      setShowReportModal(false);
      setReportingEvent(null);
      showSuccess('ส่งรายงานเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Failed to submit report:', error);
      showError('ไม่สามารถส่งรายงานได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Format time ago helper
  const formatTimeAgo = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return new Date(timestamp * 1000).toLocaleDateString();
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
        className={`relative ${depth > 0 ? "mt-4" : "mb-8"}`}
      >
        {/* Thread line connector for nested replies */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-px bg-surface-border -ml-4" />
        )}

        {/* Event card */}
        <div
          className={`
          p-5 rounded-xl border border-surface-border transition-all duration-200
          ${depth > 0 ? "ml-8 bg-surface-muted/30" : "bg-surface shadow-soft"}
          ${currentPubkey === event.pubkey ? "border-accent/30 shadow-minimal" : ""}
        `}
        >
          {/* Header: User Info & Time */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-muted border border-surface-border flex-shrink-0">
                {profile.picture ? (
                  <img
                    src={profile.picture}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="bg-surface-muted text-secondary flex items-center justify-center h-full text-[10px] font-black uppercase">
                    {profile.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (window.showUserProfile) {
                        window.showUserProfile(event.pubkey);
                      }
                    }}
                    className="font-bold text-primary hover:text-accent transition-colors text-xs"
                  >
                    {profile.display_name || profile.name || "Anonymous"}
                  </button>
                  {profile.nip05 && (
                    <span className="material-symbols-outlined text-accent text-sm">verified</span>
                  )}
                  <span className="text-[10px] text-secondary font-medium uppercase tracking-tight">
                    • {formatTimeAgo(event.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[9px] font-black text-secondary/40 uppercase tracking-widest hidden sm:block">
              #{index + 1}
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-6 text-primary leading-relaxed">
            <p className="whitespace-pre-wrap break-words">
              {parseMentions(event.content, profiles)}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-surface-border/50">
            <div className="flex items-center gap-4 sm:gap-6">
              <ReactionButton
                event={event}
                currentPubkey={currentPubkey}
                compact={true}
              />

              <ZapButton
                targetEvent={event}
                recipientPubkey={event.pubkey}
                currentPubkey={currentPubkey}
                compact={true}
              />
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
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
                    text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded
                    ${replyingTo === event.id ? "bg-accent text-white" : "text-secondary hover:text-primary hover:bg-surface-muted"}
                  `}
                >
                  <span className="material-symbols-outlined text-sm">{replyingTo === event.id ? "close" : "reply"}</span>
                  <span className="hidden xs:inline">{replyingTo === event.id ? "Cancel" : "Reply"}</span>
                </button>
              )}
              <button
                onClick={(e) => handleReportClick(e, event)}
                className="text-secondary hover:text-error transition-colors p-1.5 rounded hover:bg-error/5"
                title="Report content"
              >
                <span className="material-symbols-outlined text-lg">flag</span>
              </button>
            </div>
          </div>

          {/* Inline Reply Form */}
          {isReplying && (
            <div className="mt-4 pt-6 border-t border-surface-border animate-fade-in">
              <div className="space-y-4">
                <RichTextEditor
                  ref={editorApiRef}
                  value={replyContent}
                  onChange={setReplyContent}
                  disabled={isSubmitting}
                  onUpload={handleUploadFromEditor}
                  placeholder="Share your thoughts..."
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                  <div className="text-[9px] font-black text-secondary/50 uppercase tracking-widest">
                    Images supported
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent("");
                      }}
                      className="px-4 py-2 text-secondary hover:bg-surface-muted rounded text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleInlineReplySubmit(event)}
                      disabled={isSubmitting || !hasValidContent(replyContent)}
                      className="px-6 py-2 bg-primary text-surface rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? "Posting..." : "Post Reply"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expand/Collapse Replies */}
          {(event.replies?.length > 0 || replyCount > 0) && (
            <div className="mt-2">
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
                className="text-accent hover:underline text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors mt-2"
              >
                <span className="material-symbols-outlined text-sm">{isExpanded ? "expand_less" : "expand_more"}</span>
                {isExpanded ? "Hide" : "Show"} {replyCount} {replyCount === 1 ? "Reply" : "Replies"}
              </button>
            </div>
          )}
        </div>

        {/* Loading indicator for more replies */}
        {isExpanded && loadingMore && parentEventId === event.id && (
          <div className="ml-8 mt-4">
            <div className="flex items-center gap-2 p-3 text-[10px] font-bold text-secondary uppercase tracking-widest">
              <div className="w-3 h-3 border-2 border-accent border-t-transparent animate-spin rounded-full"></div>
              Loading...
            </div>
          </div>
        )}

        {/* Nested replies */}
        {isExpanded && event.replies && (
          <div className="mt-4">
            {event.replies.map((reply, replyIndex) =>
              renderEvent(
                reply,
                replyIndex,
                depth + 1,
                replyIndex === event.replies.length - 1,
                event.id,
              ),
            )}
          </div>
        )}

        {/* Load more replies button */}
        {isExpanded && hasMoreReplies && !loadingMore && (
          <div className="ml-8 mt-4">
            <button
              onClick={() => loadMoreReplies(event.id)}
              className="w-full py-3 bg-surface-muted hover:bg-surface-border text-secondary text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors border border-surface-border/50"
            >
              Load more...
            </button>
          </div>
        )}
      </div>
    );
  };

  // Helper function to parse mentions in content
  const parseMentions = (content, profileMap) => {
    return content.replace(/#\[(\d+)\]/g, (match, index) => {
      const profile = Array.from(profileMap.values())[parseInt(index)];
      return profile ? `@${profile.display_name || profile.name}` : match;
    });
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-surface-border rounded-xl bg-surface-muted/30">
        <span className="material-symbols-outlined text-4xl text-surface-border mb-4">forum</span>
        <p className="text-secondary text-sm font-bold uppercase tracking-widest">No replies yet</p>
        <p className="text-[10px] text-secondary/60 uppercase tracking-tight mt-1">Be the first to join the conversation!</p>
      </div>
    );
  }

  return (
    <div className="enhanced-thread-view">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
          <span className="material-symbols-outlined text-lg text-accent">chat</span>
          {replyCount || events.length} Replies
        </div>
      </div>

      <div className="space-y-4">
        {optimizedThreads.map((thread, index) => renderEvent(thread, index))}
      </div>

      {loadingMore && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent animate-spin rounded-full mx-auto mb-4"></div>
          <p className="text-[10px] font-black text-secondary uppercase tracking-widest">
            Loading...
          </p>
        </div>
      )}

      {/* Report Modal */}
      {reportingEvent && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setReportingEvent(null);
          }}
          onSubmit={handleReportSubmit}
          eventId={reportingEvent.id}
          eventType="reply"
        />
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <Toast
          message={toasts[0]?.message || ''}
          type={toasts[0]?.type || 'info'}
          isOpen={true}
          onClose={() => removeToast(toasts[0]?.id)}
        />
      )}
    </div>
  );
};

export default EnhancedThreadView;
