"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useNostr } from "../context/NostrContext";

export default function ThreadCard({ thread, roomId }) {
  const { getProfile } = useNostr();
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthor = async () => {
      if (thread.pubkey) {
        const profile = await getProfile(thread.pubkey);
        setAuthor(profile);
      }
      setLoading(false);
    };

    fetchAuthor();
  }, [thread.pubkey, getProfile]);

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
      <div className="block p-6 bg-base-100 rounded-lg border border-base-300 hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Author Avatar */}
            <div className="avatar placeholder">
              <div className="w-10 h-10 rounded-full bg-neutral text-neutral-content">
                <span className="text-sm">
                  {author?.picture ? (
                    <img
                      src={author.picture}
                      alt={author?.name || "Author"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    author?.name?.[0]?.toUpperCase() ||
                    thread.pubkey?.substring(0, 2)?.toUpperCase()
                  )}
                </span>
              </div>
            </div>

            <div>
              <div className="font-medium text-sm text-base-content">
                {loading ? (
                  <div className="w-20 h-4 bg-base-300 rounded animate-pulse"></div>
                ) : (
                  author?.name ||
                  author?.display_name ||
                  `Anonymous ${thread.pubkey?.substring(0, 8)}...`
                )}
              </div>
              <div className="text-xs text-base-content/60">
                {formatTimeAgo(thread.created_at)}
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center space-x-2">
            {isPinned() && (
              <span className="badge badge-warning badge-xs">📌 Pinned</span>
            )}
            {isLocked() && (
              <span className="badge badge-error badge-xs">🔒 Locked</span>
            )}
          </div>
        </div>

        {/* Thread Title */}
        <h3 className="font-semibold text-lg text-base-content mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Content Preview */}
        <p className="text-sm text-base-content/70 mb-4 line-clamp-2">
          {getContentPreview()}
        </p>

        {/* Thread Stats */}
        <div className="flex items-center justify-between text-xs text-base-content/60">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>
                {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </span>
            </div>

            {viewCount > 0 && (
              <div className="flex items-center space-x-1">
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span>
                  {viewCount} {viewCount === 1 ? "view" : "views"}
                </span>
              </div>
            )}
          </div>

          {/* Last Activity */}
          <div className="flex items-center space-x-1">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formatTimeAgo(thread.created_at)}</span>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Click to read thread →
        </div>
      </div>
    </Link>
  );
}
