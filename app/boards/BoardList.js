"use client";

import { useState, useEffect } from "react";
import { BOARD_CATEGORIES, getRoomById } from "../data/boardsConfig";
import { useNostr } from "../context/NostrContext";
import Link from "next/link";

export default function BoardList() {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [roomStats, setRoomStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { getEvents } = useNostr();

  // Auto-expand first category initially
  useEffect(() => {
    if (BOARD_CATEGORIES.length > 0) {
      setExpandedCategories({
        [BOARD_CATEGORIES[0].id]: true,
      });
    }
  }, []);

  // Fetch thread counts for each room with optimized single query
  useEffect(() => {
    const fetchRoomStats = async () => {
      setLoading(true);
      const stats = {};

      try {
        // Fetch all forum threads at once instead of per-room queries
        const allRooms = BOARD_CATEGORIES.flatMap((cat) => cat.rooms);
        const roomIds = allRooms.map((room) => room.id);

        const allEvents = await getEvents({
          kinds: [30023], // Long-form posts (threads)
          "#t": ["forum"],
          "#board": roomIds, // Filter for all rooms in one query
          limit: 200,
        });

        // Process events to calculate stats per room
        allRooms.forEach((room) => {
          const roomEvents = allEvents.filter((event) =>
            event.tags.some((tag) => tag[0] === "board" && tag[1] === room.id),
          );

          stats[room.id] = {
            threadCount: roomEvents.length,
            latestActivity:
              roomEvents.length > 0
                ? Math.max(...roomEvents.map((e) => e.created_at))
                : null,
          };
        });

        setRoomStats(stats);
      } catch (error) {
        console.error("Error fetching room stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomStats();
  }, [getEvents]);

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "No activity";

    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const isNewRoom = (latestActivity) => {
    if (!latestActivity) return false;
    const now = Math.floor(Date.now() / 1000);
    const diff = now - latestActivity;
    return diff < 86400; // New if activity in last 24 hours
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-base-content mb-4">
            🌏 Welcome to Panstr Forum
          </h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Discover conversations across technology, lifestyle, and the Nostr
            ecosystem. Join rooms that match your interests and connect with the
            community.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {BOARD_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories[category.id];
            const roomCount = category.rooms.length;

            return (
              <div
                key={category.id}
                className="bg-base-100 rounded-xl shadow-lg overflow-hidden"
              >
                {/* Category Header */}
                <div
                  className={`p-6 cursor-pointer transition-all duration-200 hover:bg-base-200 ${
                    isExpanded
                      ? "bg-gradient-to-r " + category.gradient + " text-white"
                      : "bg-base-100"
                  }`}
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl">{category.icon}</span>
                      <div>
                        <h2 className="text-2xl font-bold">{category.name}</h2>
                        <p
                          className={`text-sm ${isExpanded ? "text-white/90" : "text-base-content/70"}`}
                        >
                          {category.description} • {roomCount} rooms
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <svg
                          className="w-6 h-6 transform rotate-180"
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
                      ) : (
                        <svg
                          className="w-6 h-6"
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
                      )}
                    </div>
                  </div>
                </div>

                {/* Rooms */}
                {isExpanded && (
                  <div className="p-6 pt-0">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {category.rooms.map((room) => {
                        const stats = roomStats[room.id] || {
                          threadCount: 0,
                          latestActivity: null,
                        };
                        const hasNewPosts = isNewRoom(stats.latestActivity);

                        return (
                          <Link
                            key={room.id}
                            href={`/room/${room.id}`}
                            className="group block p-6 rounded-lg border border-base-300 hover:border-primary hover:shadow-md transition-all duration-200 bg-base-50 hover:bg-base-100"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                                {room.icon}
                              </span>
                              {hasNewPosts && (
                                <span className="badge badge-primary badge-sm">
                                  New
                                </span>
                              )}
                            </div>

                            <h3 className="font-semibold text-lg text-base-content mb-2 group-hover:text-primary transition-colors">
                              {room.name}
                            </h3>

                            <p className="text-sm text-base-content/70 mb-4 line-clamp-2">
                              {room.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-base-content/60">
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
                                <span>{stats.threadCount} threads</span>
                              </div>
                              <span>{formatTimeAgo(stats.latestActivity)}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-base-300/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center space-y-4">
              <div className="loading loading-spinner loading-lg text-primary"></div>
              <p className="text-base-content">Loading room statistics...</p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {!loading && (
          <div className="mt-12 p-6 bg-base-100 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-center">
              Forum Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-base-200 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {BOARD_CATEGORIES.length}
                </div>
                <div className="text-sm text-base-content/70">Categories</div>
              </div>
              <div className="p-4 bg-base-200 rounded-lg">
                <div className="text-2xl font-bold text-secondary">
                  {BOARD_CATEGORIES.reduce(
                    (acc, cat) => acc + cat.rooms.length,
                    0,
                  )}
                </div>
                <div className="text-sm text-base-content/70">Rooms</div>
              </div>
              <div className="p-4 bg-base-200 rounded-lg">
                <div className="text-2xl font-bold text-accent">
                  {Object.values(roomStats).reduce(
                    (acc, stat) => acc + stat.threadCount,
                    0,
                  )}
                </div>
                <div className="text-sm text-base-content/70">
                  Total Threads
                </div>
              </div>
              <div className="p-4 bg-base-200 rounded-lg">
                <div className="text-2xl font-bold text-info">
                  {
                    Object.values(roomStats).filter(
                      (stat) =>
                        stat.latestActivity && isNewRoom(stat.latestActivity),
                    ).length
                  }
                </div>
                <div className="text-sm text-base-content/70">Active Rooms</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
