"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRoomById, getCategoryByRoomId, getRoomTags } from "../data/boardsConfig";
import { useNostr } from "../context/NostrContext";
import Link from "next/link";
import ThreadCard from "../components/ThreadCard";
import { getDisplayTagsForRoom, getTagStatsForRoom } from "../lib/tags/tagManager";

export default function RoomPage({ roomId }) {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [sortBy, setSortBy] = useState("latest");
  const [filter, setFilter] = useState("all");
  const [selectedTag, setSelectedTag] = useState(null);
  const [roomTags, setRoomTags] = useState([]);
  const [tagStats, setTagStats] = useState([]);
  const { getEvents } = useNostr();

  useEffect(() => {
    setMounted(true);
    // Load room-specific tags on mount
    if (roomId) {
      const tags = getRoomTags(roomId);
      setRoomTags(tags);
    }
  }, [roomId]);

  const room = getRoomById(roomId);
  const category = getCategoryByRoomId(roomId);

  useEffect(() => {
    if (!room) {
      router.push("/");
      return;
    }
    fetchThreads();
  }, [roomId, sortBy, filter, selectedTag, mounted]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      // STRICT ROOM ISOLATION: Use only the room tag filter
      // Primary filter: ["room", roomId] tag
      const strictFilters = {
        kinds: [30023], // Long-form posts
        "#room": [roomId], // STRICT: Filter by mandatory room tag
        limit: 100,
      };
      
      let events = await getEvents(strictFilters);
      console.log(`[RoomIsolation] Strict filter found ${events.length} events for room ${roomId}`);

      // VALIDATION: Double-check all events belong to this room
      if (events.length > 0) {
        const { validateEventRoom, filterEventsByRoom } = await import('../lib/rooms/roomIsolation');
        
        // Filter out any events that don't pass strict validation
        const validatedEvents = filterEventsByRoom(events, roomId);
        
        console.log(`[RoomIsolation] After validation: ${validatedEvents.length}/${events.length} events kept`);
        
        // Log any filtered-out events for debugging
        if (validatedEvents.length < events.length) {
          const filteredOut = events.filter(e => !validatedEvents.find(v => v.id === e.id));
          console.warn(`[RoomIsolation] ${filteredOut.length} events filtered out due to validation failures`);
          filteredOut.forEach(e => {
            const validation = validateEventRoom(e, roomId);
            console.warn(`[RoomIsolation] Event ${e.id.slice(0, 8)}... failed: ${validation.reason}`);
          });
        }
        
        events = validatedEvents;
      }

      // Apply tag filter if selected
      if (selectedTag) {
        events = events.filter((event) => {
          const eventTags = event.tags?.filter(tag => tag[0] === 't').map(tag => tag[1]) || [];
          return eventTags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase());
        });
        console.log(`[RoomIsolation] Filtered by tag "${selectedTag}": ${events.length} events`);
      }

      // Apply additional filters
      if (filter === "pinned") {
        events = events.filter((event) =>
          event.tags.some((tag) => tag[0] === "pinned" && tag[1] === "true"),
        );
      } else if (filter === "unlocked") {
        events = events.filter(
          (event) =>
            !event.tags.some((tag) => tag[0] === "locked" && tag[1] === "true"),
        );
      }

      // Apply sorting
      switch (sortBy) {
        case "latest":
          events.sort((a, b) => b.created_at - a.created_at);
          break;
        case "oldest":
          events.sort((a, b) => a.created_at - b.created_at);
          break;
        case "replies":
          events.sort((a, b) => {
            const aReplies = a.tags.find((tag) => tag[0] === "reply_count")?.[1] || 0;
            const bReplies = b.tags.find((tag) => tag[0] === "reply_count")?.[1] || 0;
            return parseInt(bReplies) - parseInt(aReplies);
          });
          break;
      }

      setThreads(events);
    } catch (error) {
      console.error("[RoomIsolation] Error fetching threads:", error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center glass-morphism p-12 rounded-2xl">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            Room Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            This room doesn't exist or has been removed.
          </p>
          <Link href="/" className="modern-button-primary">
            Back to Forums
          </Link>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Enhanced Header */}
      <div
        className={`relative bg-gradient-to-br ${room.gradient} text-white overflow-hidden`}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/30 animate-pulse"></div>
          <div className="absolute -left-32 -bottom-32 w-96 h-96 rounded-full bg-white/20 animate-pulse-slow"></div>
        </div>

        <div className="relative container mx-auto px-4 py-8 sm:py-12">
          {/* Enhanced Breadcrumb */}
          <nav className="flex items-center space-x-2 text-xs sm:text-sm mb-4 sm:mb-6 opacity-90 overflow-x-auto">
            <Link href="/" className="hover:text-white/80 transition-colors whitespace-nowrap">
              Home
            </Link>
            <span className="opacity-60 flex-shrink-0">›</span>
            <Link
              href={`/category/${category.id}`}
              className="hover:text-white/80 transition-colors whitespace-nowrap"
            >
              {category.name}
            </Link>
            <span className="opacity-60 flex-shrink-0">›</span>
            <span className="font-medium truncate">{room.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <span className="text-5xl sm:text-6xl animate-float">{room.icon}</span>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">{room.name}</h1>
                <p className="text-white/90 text-sm sm:text-base md:text-lg line-clamp-2">{room.description}</p>
              </div>
            </div>
            <Link
              href={`/room/${roomId}/new`}
              aria-label="Create a new thread"
              className="inline-flex items-center gap-2 sm:gap-3 bg-white text-gray-900 hover:bg-gray-50 active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/60 shadow-lg px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-transform whitespace-nowrap"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="leading-none">Create Thread</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Enhanced Filters and Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <div className="modern-input-wrapper">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Sort by:
              </label>
              <select
                className="modern-input pr-10 text-xs sm:text-sm py-2"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">🕐 Latest</option>
                <option value="oldest">📅 Oldest</option>
                <option value="replies">💬 Most Replies</option>
              </select>
            </div>

            <div className="modern-input-wrapper">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Filter:
              </label>
              <select
                className="modern-input pr-10 text-xs sm:text-sm py-2"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">🌐 All Threads</option>
                <option value="pinned">📌 Pinned Only</option>
                <option value="unlocked">🔓 Unlocked</option>
              </select>
            </div>

            {/* Room-Specific Tag Filter */}
            {roomTags.length > 0 && (
              <div className="modern-input-wrapper">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Tags:
                </label>
                <select
                  className="modern-input pr-10 text-xs sm:text-sm py-2 max-w-[200px] sm:max-w-none"
                  value={selectedTag || ""}
                  onChange={(e) => setSelectedTag(e.target.value || null)}
                >
                  <option value="">All Tags</option>
                  {roomTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="stat-card px-4 sm:px-6 py-2 sm:py-3">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {threads.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                thread{threads.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Room-Specific Tags Display */}
        {roomTags.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs sm:text-sm font-medium text-gray-600">🏷️ Room Tags:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  selectedTag === null
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {roomTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                    selectedTag === tag
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                >
                  {tag.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Loading State */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="glass-morphism p-8 rounded-2xl text-center">
              <div className="loading loading-spinner loading-lg text-blue-600 mb-4"></div>
              <p className="text-gray-800 font-medium">
                Loading amazing conversations...
              </p>
            </div>
          </div>
        ) : threads.length === 0 ? (
          /* Enhanced Empty State */
          <div className="text-center py-16 glass-morphism rounded-2xl">
            <div className="text-8xl mb-6 opacity-60 animate-pulse">📭</div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">
              No threads yet
            </h3>
            <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
              Be the first to start a conversation in {room.name}! Share your
              thoughts and ideas with the community.
            </p>
            <Link
              href={`/room/${roomId}/new`}
              aria-label="Create the first thread in this room"
              className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-md px-4 py-2 rounded-md font-medium transition"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Create First Thread</span>
            </Link>
          </div>
        ) : (
          /* Enhanced Thread List */
          <div className="space-y-6">
            {threads.map((thread, index) => (
              <div
                key={thread.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ThreadCard thread={thread} roomId={roomId} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
