"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useNostr } from "../context/NostrContext";
import { useNostrAuth } from "../context/NostrAuthContext";
import {
  initializePool,
  liveSubscribe,
  formatPubkey,
  verifyZapReceipt,
} from "../lib/nostrClient";
import db, { liveZapsForEvent } from "../lib/storage/indexedDB";

export default function ThreadCard({ thread, roomId }) {
  const { getProfile } = useNostr();
  const { user } = useNostrAuth();
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Zap totals (sats) for this thread and subscription refs
  const [zapTotal, setZapTotal] = useState(0);
  const zapDbSubRef = useRef(null);
  const poolSubRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const fetchAuthorAndSubscribeZaps = async () => {
      try {
        if (thread.pubkey) {
          const profile = await getProfile(thread.pubkey);
          if (mounted) setAuthor(profile);
        }
      } catch (err) {
        console.warn("ThreadCard: failed to fetch author", err);
      } finally {
        if (mounted) setLoading(false);
      }

      // Initial read of zap totals from local DB cache (fast)
      try {
        const summary = await db.getZapTotalForEvent(thread.id);
        if (mounted) setZapTotal(summary?.totalAmount || 0);
      } catch (err) {
        // ignore DB read errors
      }

      // Subscribe to live DB updates for zaps for this event (reactive)
      try {
        if (zapDbSubRef.current) {
          try {
            zapDbSubRef.current.unsubscribe();
          } catch (e) {}
          zapDbSubRef.current = null;
        }
        const dbSub = liveZapsForEvent(thread.id).subscribe((zaps) => {
          try {
            const sum = (zaps || []).reduce((s, z) => s + (z.amount || 0), 0);
            setZapTotal(sum);
          } catch (e) {
            console.error("Error computing live zap total:", e);
          }
        });
        zapDbSubRef.current = dbSub;
      } catch (err) {
        // ignore live db subscription errors
      }

      // Set up a relay subscription for new zap receipts (kind 9735) tied to this event.
      // We use the app's pool + liveSubscribe helper for deduplication & keep-alive.
      try {
        const pool = await initializePool();
        // Subscribe to kind 9735 where e-tag matches this thread id
        const sub = liveSubscribe(
          pool,
          undefined,
          [{ kinds: [9735], "#e": [thread.id], limit: 50 }],
          async (event) => {
            try {
              // Basic verification and extraction
              const verification = verifyZapReceipt(event);
              if (verification && verification.isValid) {
                // Persist to local DB for aggregation and UI
                await db.addZapReceipt({
                  eventId: verification.eventId || thread.id,
                  senderPubkey: verification.sender || null,
                  recipientPubkey: verification.recipient || null,
                  amount: verification.amount || 0,
                  bolt11: verification.bolt11 || null,
                  preimage: verification.preimage || null,
                  timestamp: Date.now(),
                });
                // local DB live query will update zapTotal automatically
              }
            } catch (err) {
              console.error(
                "ThreadCard: error handling incoming zap event",
                err,
              );
            }
          },
          { dedupe: true, keepAlive: true, heartbeatMs: 30 * 1000 },
        );
        poolSubRef.current = sub;
      } catch (err) {
        console.warn("ThreadCard: failed to subscribe to zap receipts", err);
      }
    };

    fetchAuthorAndSubscribeZaps();

    return () => {
      mounted = false;
      try {
        if (
          zapDbSubRef.current &&
          typeof zapDbSubRef.current.unsubscribe === "function"
        ) {
          zapDbSubRef.current.unsubscribe();
        }
      } catch (e) {}
      try {
        if (
          poolSubRef.current &&
          typeof poolSubRef.current.unsubscribe === "function"
        ) {
          poolSubRef.current.unsubscribe();
        } else if (
          poolSubRef.current &&
          typeof poolSubRef.current.unsubscribe === "undefined" &&
          typeof poolSubRef.current.unsubscribe === "function"
        ) {
          poolSubRef.current.unsubscribe();
        } else if (
          poolSubRef.current &&
          typeof poolSubRef.current.unsubscribe === "function"
        ) {
          poolSubRef.current.unsubscribe();
        } else if (
          poolSubRef.current &&
          typeof poolSubRef.current === "object" &&
          typeof poolSubRef.current.unsubscribe === "function"
        ) {
          poolSubRef.current.unsubscribe();
        }
      } catch (e) {}
    };
  }, [thread.pubkey, getProfile, thread.id]);

  const getThreadTitle = () => {
    // Try to get title from tags first
    const titleTag = thread.tags.find((tag) => tag[0] === "title");
    if (titleTag && titleTag[1]) {
      return titleTag[1];
    }

    // Fallback to first line of content
    const lines = thread.content.split("\n").filter((line) => line.trim());
    if (lines.length > 0) {
      return lines[0].replace(/^#+\s*/, "").substring(0, 100);
    }

    return "Untitled Thread";
  };

  const getContentPreview = () => {
    const content = thread.content || "";
    const lines = content.split("\n").filter((line) => line.trim());

    // Skip the first line if it's likely a title
    const titleLine = getThreadTitle();
    const startIndex = lines[0]?.includes(titleLine) ? 1 : 0;

    const previewLines = lines.slice(startIndex).join(" ").substring(0, 150);
    return previewLines + (previewLines.length >= 150 ? "..." : "");
  };

  const formatTimeAgo = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getReplyCount = () => {
    const replyTag = thread.tags.find((tag) => tag[0] === "reply_count");
    return replyTag ? parseInt(replyTag[1]) || 0 : 0;
  };

  const getViewCount = () => {
    const viewTag = thread.tags.find((tag) => tag[0] === "view_count");
    return viewTag ? parseInt(viewTag[1]) || 0 : 0;
  };

  const isPinned = () => {
    return thread.tags.some((tag) => tag[0] === "pinned" && tag[1] === "true");
  };

  const isLocked = () => {
    return thread.tags.some((tag) => tag[0] === "locked" && tag[1] === "true");
  };

  const title = getThreadTitle();
  const replyCount = getReplyCount();
  const viewCount = getViewCount();

  return (
    <Link href={`/room/${roomId}/thread/${thread.id}`}>
      <div className="block modern-card modern-card-hover p-7 border border-gray-200/50 hover:border-blue-300/70 cursor-pointer group/thread">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Enhanced Author Avatar */}
            <div className="avatar placeholder relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 ring-2 ring-white shadow-md group-hover/thread:ring-blue-500/30 transition-all duration-300">
                <span className="text-base font-medium">
                  {author?.picture ? (
                    <img
                      src={author.picture}
                      alt={author?.name || "Author"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      {author?.name?.[0]?.toUpperCase() ||
                        thread.pubkey?.substring(0, 2)?.toUpperCase()}
                    </div>
                  )}
                </span>
                {author?.nip05 && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-base text-gray-800 mb-1">
                {loading ? (
                  <div className="w-24 h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded loading-skeleton"></div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="truncate">
                      {author?.name || author?.display_name || "Anonymous"}
                    </span>
                    {author?.nip05 && (
                      <span className="modern-badge-success text-xs">✓</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {formatTimeAgo(thread.created_at)}
              </div>
            </div>
          </div>

          {/* Enhanced Status Badges */}
          <div className="flex items-center space-x-2">
            {isPinned() && (
              <span className="modern-badge-warning animate-pulse">
                📌 Pinned
              </span>
            )}
            {isLocked() && (
              <span className="modern-badge-error">🔒 Locked</span>
            )}
          </div>
        </div>

        {/* Enhanced Thread Title */}
        <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover/thread:text-blue-600 transition-colors line-clamp-2 leading-tight">
          {title}
        </h3>

        {/* Enhanced Content Preview */}
        <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
          {getContentPreview()}
        </p>

        {/* Enhanced Thread Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 group/stat">
              <svg
                className="w-5 h-5 text-gray-400 group-hover/stat:text-blue-500 transition-colors"
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
              <span className="font-medium">
                {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </span>
            </div>

            {viewCount > 0 && (
              <div className="flex items-center space-x-2 group/stat">
                <svg
                  className="w-5 h-5 text-gray-400 group-hover/stat:text-purple-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span className="font-medium">
                  {viewCount} {viewCount === 1 ? "view" : "views"}
                </span>
              </div>
            )}

            {/* Enhanced Zap totals */}
            <div className="flex items-center space-x-2 group/stat">
              <svg
                className="w-5 h-5 text-yellow-500 group-hover/stat:text-yellow-600 transition-colors"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M11.3 1L3 12h6l-1 7 8.3-11H11l.3-6z" />
              </svg>
              <span
                className={`font-medium ${zapTotal > 0 ? "text-yellow-600" : "text-gray-500"}`}
              >
                {zapTotal ? `${zapTotal.toLocaleString()} sats` : "0 sats"}
              </span>
            </div>
          </div>

          {/* Enhanced Last Activity */}
          <div className="flex items-center space-x-2 text-xs text-gray-400">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 000 16z"
              />
            </svg>
            <span>{formatTimeAgo(thread.created_at)}</span>
          </div>
        </div>

        {/* Enhanced Hover indicator */}
        <div className="mt-4 pt-3 border-t border-gray-100 text-center">
          <div className="text-sm text-blue-600 font-medium opacity-0 group-hover/thread:opacity-100 transition-all duration-300 transform translate-y-1 group-hover/thread:translate-y-0">
            Read full thread →
          </div>
        </div>
      </div>
    </Link>
  );
}
