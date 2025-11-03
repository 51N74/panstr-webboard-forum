"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import NostrWidget from "../../components/NostrWidget";
import {
  initializePool,
  queryEvents,
  formatPubkey,
  getAllRelays,
  testRelay,
} from "../../lib/nostrClient";

export default function GeneralForum() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [threadEvent, setThreadEvent] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyToEvent, setReplyToEvent] = useState(null);
  const [relayStatuses, setRelayStatuses] = useState({});
  const [pool, setPool] = useState(null);

  // Load general forum events
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const poolInstance = await initializePool();
        setPool(poolInstance);

        // Query events with general forum tags
        const forumEvents = await queryEvents(poolInstance, undefined, {
          kinds: [1],
          "#t": ["general", "forum"],
          limit: 50,
          since: Math.floor(Date.now() / 1000) - 86400, // Last 24 hours
        });

        setEvents(forumEvents);

        // Test relay connections
        const relays = getAllRelays();
        const statuses = {};
        await Promise.all(
          relays.map(async (relay) => {
            const status = await testRelay(relay);
            statuses[relay] = status;
          })
        );
        setRelayStatuses(statuses);
      } catch (error) {
        console.error("Failed to load forum events:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Auto-refresh events
  useEffect(() => {
    if (!pool) return;

    const interval = setInterval(async () => {
      try {
        const newEvents = await queryEvents(pool, undefined, {
          kinds: [1],
          "#t": ["general", "forum"],
          limit: 10,
          since: Math.floor(Date.now() / 1000) - 300, // Last 5 minutes
        });

        if (newEvents.length > 0) {
          setEvents((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const uniqueNewEvents = newEvents.filter(
              (e) => !existingIds.has(e.id)
            );
            return [...uniqueNewEvents, ...prev].slice(0, 100);
          });
        }
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [pool]);

  const handleReply = useCallback((event) => {
    setReplyToEvent(event);
    setReplyContent("");
    setShowReplyModal(true);
  }, []);

  const handleSendReply = useCallback(async () => {
    if (!replyContent.trim() || !replyToEvent) return;

    try {
      const { createReplyEvent, publishToPool } = await import(
        "../../lib/nostrClient"
      );

      // Create reply event
      const replyEvent = createReplyEvent(
        replyToEvent,
        replyContent,
        null, // Will use browser extension or current key
        [["t", "general"], ["t", "forum"]]
      );

      // Publish reply
      const publishedEvent = await publishToPool(
        pool,
        undefined,
        null, // Will use browser extension or current key
        replyEvent.content,
        replyEvent
      );

      console.log("Reply published:", publishedEvent);

      // Close modal and reset
      setShowReplyModal(false);
      setReplyToEvent(null);
      setReplyContent("");
    } catch (error) {
      console.error("Failed to send reply:", error);
      alert("Failed to send reply: " + error.message);
    }
  }, [replyContent, replyToEvent, pool]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const formatContent = (content, maxLength = 200) => {
    if (!content) return "No content";
    const formatted = content.replace(/\n/g, "<br>");
    return formatted.length > maxLength
      ? formatted.substring(0, maxLength) + "..."
      : formatted;
  };

  const getConnectedCount = () => {
    return Object.values(relayStatuses).filter(
      (status) => status.connected
    ).length;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <nav className="text-sm mb-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            🏠 Home
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-700 font-medium">General Forum</span>
        </nav>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold mb-4">📢 General Discussion</h1>
          <p className="text-gray-600 mb-6">
            General topics, announcements, and community discussions
          </p>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Connected Relays:{" "}
                <span className="font-bold text-green-600">
                  {getConnectedCount()}/{Object.keys(relayStatuses).length}
                </span>
              </div>
              {events.length > 0 && (
                <div className="text-sm text-gray-600">
                  Posts:{" "}
                  <span className="font-bold">{events.length}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Create Post Button */}
          <div className="mb-6">
            <Link
              href="/create?tag=general"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ✍️ Create New Post
            </Link>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Recent Posts</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="border rounded-lg p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {event.pubkey.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatPubkey(event.pubkey, "short")}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(event.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReply(event)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      💬 Reply
                    </button>
                    <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                      ⚡ Zap
                    </button>
                    <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                      🔗 Share
                    </button>
                  </div>
                </div>

                <div className="prose max-w-none mb-4">
                  <div
                    className="text-gray-800"
                    dangerouslySetInnerHTML={{
                      __html: formatContent(event.content),
                    }}
                  />
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {event.tags
                      .filter((tag) => tag[0] === "t")
                      .slice(0, 3)
                      .map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          #{tag[1]}
                        </span>
                      ))}
                    {event.tags.filter((tag) => tag[0] === "t").length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{event.tags.filter((tag) => tag[0] === "t").length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg mb-4">No posts yet</div>
            <p>Be the first to start a discussion!</p>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && replyToEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Reply to Post</h3>
                <div className="text-sm text-gray-600 mt-1">
                  Replying to: {formatPubkey(replyToEvent.pubkey, "short")}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyToEvent(null);
                  setReplyContent("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Original Post Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-2">Original post:</div>
              <div
                className="text-sm text-gray-800"
                dangerouslySetInnerHTML={{
                  __html: formatContent(replyToEvent.content, 300),
                }}
              />
            </div>

            {/* Reply Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Reply
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyToEvent(null);
                    setReplyContent("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={!replyContent.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NostrWidget for posting */}
      <div className="mt-8">
        <NostrWidget />
      </div>
    </div>
  );
}
