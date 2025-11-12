"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRoomById, getCategoryByRoomId } from "../data/boardsConfig";
import { useNostr } from "../context/NostrContext";
import Link from "next/link";
import ThreadCard from "../components/ThreadCard";

export default function RoomPage({ roomId }) {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [sortBy, setSortBy] = useState("latest");
  const [filter, setFilter] = useState("all");
  const { getEvents } = useNostr();

  useEffect(() => {
    setMounted(true);
  }, []);

  const room = getRoomById(roomId);
  const category = getCategoryByRoomId(roomId);

  useEffect(() => {
    if (!room) {
      router.push("/");
      return;
    }
    fetchThreads();
  }, [roomId, sortBy, filter, mounted]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      // Try multiple filter approaches to handle potential relay differences
      let events = [];

      // Approach 1: Standard filter format
      try {
        const standardFilters = {
          kinds: [30023], // Long-form posts
          "#t": ["forum"],
          "#board": [roomId],
          limit: 100,
        };
        events = await getEvents(standardFilters);
        console.log(`Standard filter found ${events.length} events`);
      } catch (err) {
        console.log("Standard filter failed:", err);
      }

      // Fallback 1: String instead of array for board
      if (events.length === 0) {
        try {
          const fallbackFilters1 = {
            kinds: [30023],
            "#t": ["forum"],
            "#board": roomId, // String instead of array
            limit: 100,
          };
          events = await getEvents(fallbackFilters1);
          console.log(
            `Fallback 1 (string board) found ${events.length} events`,
          );
        } catch (err) {
          console.log("Fallback 1 failed:", err);
        }
      }

      // Fallback 2: No board filter (get all forum threads)
      if (events.length === 0) {
        try {
          const fallbackFilters2 = {
            kinds: [30023],
            "#t": ["forum"],
            limit: 100,
          };
          events = await getEvents(fallbackFilters2);
          console.log(
            `Fallback 2 (no board filter) found ${events.length} events`,
          );

          // Filter by board client-side if no board filter works
          events = events.filter((event) => {
            const boardTag = event.tags?.find((tag) => tag[0] === "board")?.[1];
            return (
              !boardTag || boardTag === roomId || boardTag === "nostr-cafe"
            ); // Include events without board or matching board
          });
          console.log(
            `After client-side filtering: ${events.length} events for room ${roomId}`,
          );
        } catch (err) {
          console.log("Fallback 2 failed:", err);
        }
      }

      // Fallback 3: Tags array format
      if (events.length === 0) {
        try {
          const fallbackFilters3 = {
            kinds: [30023],
            tags: [
              ["t", "forum"],
              ["board", roomId],
            ],
            limit: 100,
          };
          events = await getEvents(fallbackFilters3);
          console.log(`Fallback 3 (tags array) found ${events.length} events`);
        } catch (err) {
          console.log("Fallback 3 failed:", err);
        }
      }

      // Apply local filters and sort
      if (events.length > 0) {
        console.log(`Total events retrieved: ${events.length}`);

        // Filter by board client-side if needed
        if (roomId) {
          events = events.filter((event) => {
            const boardTag = event.tags?.find((tag) => tag[0] === "board")?.[1];
            return (
              !boardTag || boardTag === roomId || boardTag === "nostr-cafe"
            );
          });
          console.log(
            `After board filtering: ${events.length} events for room ${roomId}`,
          );
        }
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
          // Sort by reply count (would need additional data)
          events.sort((a, b) => {
            const aReplies =
              a.tags.find((tag) => tag[0] === "reply_count")?.[1] || 0;
            const bReplies =
              b.tags.find((tag) => tag[0] === "reply_count")?.[1] || 0;
            return parseInt(bReplies) - parseInt(aReplies);
          });
          break;
      }

      // Apply filters
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
          // Sort by reply count (would need additional data)
          events.sort((a, b) => {
            const aReplies =
              a.tags.find((tag) => tag[0] === "reply_count")?.[1] || 0;
            const bReplies =
              b.tags.find((tag) => tag[0] === "reply_count")?.[1] || 0;
            return parseInt(bReplies) - parseInt(aReplies);
          });
          break;
      }

      setThreads(events);
    } catch (error) {
      console.error("Error fetching threads:", error);
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

        <div className="relative container mx-auto px-4 py-12">
          {/* Enhanced Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm mb-6 opacity-90">
            <Link href="/" className="hover:text-white/80 transition-colors">
              Home
            </Link>
            <span className="opacity-60">›</span>
            <Link
              href={`/category/${category.id}`}
              className="hover:text-white/80 transition-colors"
            >
              {category.name}
            </Link>
            <span className="opacity-60">›</span>
            <span className="font-medium">{room.name}</span>
          </nav>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span className="text-6xl animate-float">{room.icon}</span>
              <div>
                <h1 className="text-4xl font-bold mb-2">{room.name}</h1>
                <p className="text-white/90 text-lg">{room.description}</p>
              </div>
            </div>
            <Link
              href={`/room/${roomId}/new`}
              className="modern-button-primary bg-white text-gray-900 hover:bg-gray-50 hover:scale-105 shadow-xl hover:shadow-2xl px-8"
            >
              ✨ Create New Thread
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Filters and Controls */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-6">
          <div className="flex items-center space-x-6">
            <div className="modern-input-wrapper">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by:
              </label>
              <select
                className="modern-input pr-10"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">🕐 Latest</option>
                <option value="oldest">📅 Oldest</option>
                <option value="replies">💬 Most Replies</option>
              </select>
            </div>

            <div className="modern-input-wrapper">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter:
              </label>
              <select
                className="modern-input pr-10"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">🌐 All Threads</option>
                <option value="pinned">📌 Pinned Only</option>
                <option value="unlocked">🔓 Unlocked</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="stat-card px-6 py-3">
              <div className="text-2xl font-bold text-blue-600">
                {threads.length}
              </div>
              <div className="text-sm text-gray-600">
                thread{threads.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

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
              className="modern-button-primary px-8 py-3"
            >
              🚀 Create First Thread
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
