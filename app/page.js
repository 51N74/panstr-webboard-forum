"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import NostrWidget from "./components/NostrWidget";
import { MOCK_POSTS, MOCK_TRENDING_TAGS } from "./data/mockPosts";
import {
  initializePool,
  getTrendingEvents,
  searchEvents,
  queryEvents,
  formatPubkey,
  getAllRelays,
  testRelay,
} from "./lib/nostrClient";

// SiamstrBox Component for #siamstr tag events
function SiamstrBox() {
  const [siamstrEvents, setSiamstrEvents] = useState([]);
  const [siamstrLoading, setSiamstrLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSiamstrEvents();
  }, []);

  const fetchSiamstrEvents = async () => {
    setSiamstrLoading(true);
    setError(null);

    try {
      const events = await searchEvents("#siamstr", {
        kinds: [1],
        limit: 10,
      });

      setSiamstrEvents(events);
    } catch (err) {
      setError("Failed to fetch #siamstr events");
      console.error("Error fetching #siamstr events:", err);
    } finally {
      setSiamstrLoading(false);
    }
  };

  const formatSiamstrTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div
      className="bg-white rounded-lg border-2 border-purple-300 p-4 w-full"
      style={{ minHeight: "400px" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-purple-800 text-lg">#siamstr Events</h3>
        <button
          onClick={fetchSiamstrEvents}
          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
          disabled={siamstrLoading}
        >
          {siamstrLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Rectangular box with distinct border and defined dimensions */}
      <div className="border-2 border-dashed border-purple-200 rounded-lg p-3 bg-purple-50">
        {siamstrLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center py-4">{error}</div>
        ) : siamstrEvents.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <p>No events found with #siamstr tag</p>
            <p className="text-sm mt-2">Try refreshing to check again</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {siamstrEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white p-3 rounded border border-purple-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-purple-600 font-mono">
                    {formatPubkey(event.pubkey).slice(0, 8)}...
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatSiamstrTime(event.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-800 line-clamp-3">
                  {event.content}
                </p>
                {event.tags && event.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {event.tags
                      .filter((tag) => tag[0] === "t" && tag[1])
                      .map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                        >
                          #{tag[1]}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Official Room Configuration - moved to Header component
import Header, { OFFICIAL_ROOMS } from "./components/Header";

export default function Page() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeRoom, setActiveRoom] = useState(OFFICIAL_ROOMS[0]); // Default to first room
  const [relayCount, setRelayCount] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Load posts for active room on mount and room change
  useEffect(() => {
    loadRoomPosts(activeRoom.tag);
    checkRelays();
  }, [activeRoom]);

  const loadRoomPosts = async (roomTag) => {
    setLoading(true);

    // Use mock data for showcase (in production, this would fetch from Nostr)
    setTimeout(() => {
      const mockPostsForRoom = MOCK_POSTS.filter((post) => {
        const postTag = post.tags.find((tag) => tag[0] === "t")?.[1];
        return postTag === roomTag.substring(1); // Remove # for comparison
      });

      setPosts(mockPostsForRoom);
      setLoading(false);
    }, 500); // Simulate loading delay
  };

  // Original Nostr code (commented for showcase)
  /*
  try {
    const pool = await initializePool();
    // CRITICAL: Client-side filtering for Official Tags only
    const events = await queryEvents(pool, undefined, {
      kinds: [23, 1], // Kind 23 (Long-form) and Kind 1 (Short notes)
      limit: 20,
      since: Math.floor(Date.now() / 1000) - 86400 * 7, // Last week
    });

    // Filter posts that contain the official tag
    const filteredPosts = events.filter(
      (event) =>
        event.tags &&
        event.tags.some(
          (tag) => tag[0] === "t" && tag[1] === roomTag.substring(1),
        ), // Remove # for comparison
    );

    setPosts(filteredPosts);
  } catch (error) {
    console.error(`Failed to load posts for ${roomTag}:`, error);
    setPosts([]);
  } finally {
    setLoading(false);
  }
  */

  const checkRelays = async () => {
    const relays = getAllRelays();
    let connected = 0;

    await Promise.all(
      relays.map(async (relay) => {
        const status = await testRelay(relay);
        if (status.connected) connected++;
      }),
    );

    setRelayCount(connected);
  };

  const formatContent = (content, maxLength = 150) => {
    if (!content) return "ไม่มีเนื้อหา";
    return content.length > maxLength
      ? content.substring(0, maxLength) + "..."
      : content;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "เมื่อสักครู่";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diff / 86400000)} วันที่แล้ว`;
  };

  const getPostTitle = (event) => {
    // For Kind 23 (Long-form), extract title from content or tags
    if (event.kind === 23) {
      const titleMatch = event.content.match(/^#\s+(.+)$/m);
      if (titleMatch) return titleMatch[1];

      const titleTag = event.tags?.find((tag) => tag[0] === "title");
      if (titleTag) return titleTag[1];
    }

    // For Kind 1, use first line or truncate content
    const lines = event.content.split("\n");
    return lines[0].length > 60 ? lines[0].substring(0, 60) + "..." : lines[0];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Posts Feed */}
          <div className="lg:col-span-2">
            {/* Room Header */}
            <div
              className={`bg-gradient-to-r ${activeRoom.gradient} text-white p-6 rounded-xl mb-6`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center space-x-2">
                    <span className="text-3xl">{activeRoom.icon}</span>
                    <span>{activeRoom.name}</span>
                  </h1>
                  <p className="text-white/80 mt-1">{activeRoom.description}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm">
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {posts.length} กระทู้
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {relayCount} Relay เชื่อมต่อ
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>สร้างกระทู้</span>
                </button>
              </div>
            </div>

            {/* Posts List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    roomTag={activeRoom.tag}
                  />
                ))}
              </div>
            ) : (
              <EmptyState room={activeRoom} />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <RoomStats activeRoom={activeRoom} />
              <SiamstrBox />
              <TrendingInRoom roomTag={activeRoom.tag} />
              <NostrWidget />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Post Card Component
function PostCard({ post, roomTag }) {
  const formatPubkey = (pubkey, type = "short") => {
    if (type === "short") {
      return (
        pubkey.substring(0, 8) + "..." + pubkey.substring(pubkey.length - 4)
      );
    }
    return pubkey;
  };

  const getPostTitle = (event) => {
    if (event.kind === 23) {
      const titleMatch = event.content.match(/^#\s+(.+)$/m);
      if (titleMatch) return titleMatch[1];
      const titleTag = event.tags?.find((tag) => tag[0] === "title");
      if (titleTag) return titleTag[1];
    }
    const lines = event.content.split("\n");
    return lines[0].length > 60 ? lines[0].substring(0, 60) + "..." : lines[0];
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return "เมื่อสักครู่";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diff / 86400000)} วันที่แล้ว`;
  };

  const formatContent = (content, maxLength = 150) => {
    if (!content) return "ไม่มีเนื้อหา";
    const cleanContent = content.replace(/^#\s+.+$/m, "").trim();
    return cleanContent.length > maxLength
      ? cleanContent.substring(0, maxLength) + "..."
      : cleanContent;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {post.author?.name || "ผู้ใช้ Nostr"}
                </span>
                <div className="flex items-center space-x-1 text-xs">
                  <span className="text-gray-500 font-mono">
                    {formatPubkey(post.pubkey, "short")}
                  </span>
                  {/* NIP-05 Verified Badge */}
                  {post.author?.verified ? (
                    <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>NIP-05</span>
                    </div>
                  ) : (
                    <div className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                      ไม่ยืนยันตัวตน
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(post.created_at)}
              </div>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              roomTag === "#BluePlanet"
                ? "bg-blue-100 text-blue-800"
                : roomTag === "#KlaoKrua"
                  ? "bg-orange-100 text-orange-800"
                  : roomTag === "#SinThorn"
                    ? "bg-green-100 text-green-800"
                    : "bg-purple-100 text-purple-800"
            }`}
          >
            {roomTag}
          </span>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <Link href={`/post/${post.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
              {getPostTitle(post)}
            </h3>
          </Link>
          <p className="text-gray-600 text-sm leading-relaxed">
            {formatContent(post.content)}
          </p>
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
              <svg
                className="w-5 h-5"
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
              <span className="text-sm">
                {post.stats?.comments || 0} ความคิดเห็น
              </span>
            </button>

            <button className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-sm">{post.stats?.likes || 0} ถูกใจ</span>
            </button>

            <button className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-sm font-medium">
                {post.stats?.zaps || 0} ⚡
              </span>
            </button>
          </div>

          <button className="text-gray-500 hover:text-gray-700 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m9.032 4.026A9.001 9.001 0 012.968 10.326m9.032 4.026a9.001 9.001 0 01-9.032-4.026"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ room }) {
  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
      <div className="text-6xl mb-4">{room.icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        ยังไม่มีกระทู้ใน {room.name}
      </h3>
      <p className="text-gray-500 mb-6">
        เป็นคนแรกที่สร้างกระทู้ในห้อง {room.description}
      </p>
      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
        สร้างกระทู้แรก
      </button>
    </div>
  );
}

// Room Stats Component
function RoomStats({ activeRoom }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-4">
        สถิติห้อง {activeRoom.name}
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">กระทู้ทั้งหมด</span>
          <span className="font-medium">1,234</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">สมาชิกที่เข้าร่วม</span>
          <span className="font-medium">5,678</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Zap วันนี้</span>
          <span className="font-medium text-green-600">89 ⚡</span>
        </div>
      </div>
    </div>
  );
}

// Trending in Room Component
function TrendingInRoom({ roomTag }) {
  const trendingTags = MOCK_TRENDING_TAGS[roomTag] || [];

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-4">
        กำลังเป็นที่นิยมใน {roomTag}
      </h3>
      <div className="space-y-2">
        {trendingTags.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">#{item.tag}</span>
            <span className="text-xs text-gray-500">{item.count} กระทู้</span>
          </div>
        ))}
      </div>
    </div>
  );
}
