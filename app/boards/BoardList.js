"use client";

import { useState, useEffect } from "react";
import { BOARD_CATEGORIES, getRoomById } from "../data/boardsConfig";
import { useNostr } from "../context/NostrContext";
import Link from "next/link";

export default function BoardList() {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [roomStats, setRoomStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { getEvents } = useNostr();

  // Auto-expand first category initially and handle mount
  useEffect(() => {
    setMounted(true);
    if (BOARD_CATEGORIES.length > 0) {
      setExpandedCategories({
        [BOARD_CATEGORIES[0].id]: true,
      });
    }
  }, []);

  // Fetch thread counts for each room with optimized single query
  useEffect(() => {
    if (!mounted) return;

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
  }, [getEvents, mounted]);

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="mb-8">
            <span className="text-6xl animate-float inline-block">🌏</span>
          </div>
          <h1 className="text-5xl font-bold mb-6">
            <span className="gradient-text">Welcome to Panstr Forum</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Discover conversations across technology, lifestyle, and Nostr
            ecosystem. Join rooms that match your interests and connect with the
            community.
          </p>

          {/* Enhanced Quick Access */}
          {/* <div className="flex justify-center mt-8 space-x-6">
            <Link
              href="/siamstr-test"
              className="modern-button-secondary group"
            >
              🏴 #siamstr Test Room
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </Link>
          </div> */}
        </div>

        {/* Enhanced Categories */}
        <div className="space-y-8 mt-8">
          {BOARD_CATEGORIES.map((category, index) => {
            const isExpanded = expandedCategories[category.id];
            const roomCount = category.rooms.length;

            return (
              <div
                key={category.id}
                className={`modern-card animate-slide-up ${isExpanded ? "shadow-2xl" : ""}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Enhanced Category Header */}
                <div
                  className={`p-8 cursor-pointer transition-all duration-300 relative overflow-hidden ${isExpanded
                    ? "bg-gradient-to-br " + category.gradient + " text-white"
                    : "bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200"
                    }`}
                  onClick={() => toggleCategory(category.id)}
                >
                  {/* Background decoration */}
                  <div className="absolute inset-0 opacity-10">
                    <div
                      className={`absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/30 ${isExpanded ? "animate-pulse" : ""}`}
                    ></div>
                    <div
                      className={`absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/20 ${isExpanded ? "animate-pulse-slow" : ""}`}
                    ></div>
                  </div>

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <span
                        className={`text-5xl ${isExpanded ? "animate-bounce" : "group-hover:animate-pulse"} transition-transform duration-300`}
                      >
                        {category.icon}
                      </span>
                      <div>
                        <h2
                          className={`text-3xl font-bold mb-2 ${isExpanded ? "text-white" : "text-gray-800"}`}
                        >
                          {category.name}
                        </h2>
                        <p
                          className={`text-base ${isExpanded ? "text-white/90" : "text-gray-600"}`}
                        >
                          {category.description} •{" "}
                          <span className="font-semibold">
                            {roomCount} rooms
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div
                        className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm ${isExpanded
                          ? "bg-white/20 text-white"
                          : "bg-gray-200/80 text-gray-700"
                          }`}
                      >
                        {roomCount} rooms
                      </div>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isExpanded
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-600"
                          }`}
                      >
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
                </div>

                {/* Enhanced Rooms */}
                {isExpanded && (
                  <div className="p-8 pt-0">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {category.rooms.map((room, roomIndex) => {
                        const stats = roomStats[room.id] || {
                          threadCount: 0,
                          latestActivity: null,
                        };
                        const hasNewPosts = isNewRoom(stats.latestActivity);

                        return (
                          <Link
                            key={room.id}
                            href={`/room/${room.id}`}
                            className={`modern-card modern-card-hover p-6 border border-gray-200/50 hover:border-blue-300/50 group/card`}
                            style={{
                              animationDelay: `${index * 100 + roomIndex * 50}ms`,
                            }}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <span className="text-3xl group-hover/card:scale-110 transition-transform duration-300 group-hover/card:animate-bounce">
                                {room.icon}
                              </span>
                              {hasNewPosts && (
                                <span className="modern-badge-success animate-pulse">
                                  ✨ New
                                </span>
                              )}
                            </div>

                            <h3 className="font-bold text-xl text-gray-800 mb-3 group-hover/card:text-blue-600 transition-colors">
                              {room.name}
                            </h3>

                            <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                              {room.description}
                            </p>

                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center space-x-2">
                                <svg
                                  className="w-5 h-5 text-gray-400 group-hover/card:text-blue-500 transition-colors"
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
                                  {stats.threadCount} threads
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-400">
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
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 018 8z"
                                  />
                                </svg>
                                <span className="text-xs">
                                  {formatTimeAgo(stats.latestActivity)}
                                </span>
                              </div>
                            </div>

                            {/* Hover indicator */}
                            <div className="mt-4 pt-4 border-t border-gray-100 text-center text-sm text-blue-600 opacity-0 group-hover/card:opacity-100 transition-all duration-300 font-medium">
                              Enter Room →
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

        {/* Enhanced Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-morphism p-8 rounded-2xl text-center">
              <div className="loading loading-spinner loading-lg text-blue-600 mb-4"></div>
              <p className="text-gray-800 font-medium">
                Loading room statistics...
              </p>
              <div className="mt-4 text-sm text-gray-600">
                Discovering amazing conversations
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Quick Stats */}
        {/* {!loading && (
          <div className="mt-16 p-8 glass-morphism rounded-2xl animate-fade-in">
            <h3 className="text-2xl font-bold text-center mb-8 gradient-text">
              📊 Forum Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="stat-card text-center group">
                <div className="text-4xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-200">
                  {BOARD_CATEGORIES.length}
                </div>
                <div className="text-sm text-gray-600 mt-2 font-medium">
                  Categories
                </div>
              </div>
              <div className="stat-card text-center group">
                <div className="text-4xl font-bold text-purple-600 group-hover:scale-110 transition-transform duration-200">
                  {BOARD_CATEGORIES.reduce(
                    (acc, cat) => acc + cat.rooms.length,
                    0,
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-2 font-medium">
                  Rooms
                </div>
              </div>
              <div className="stat-card text-center group">
                <div className="text-4xl font-bold text-green-600 group-hover:scale-110 transition-transform duration-200">
                  {Object.values(roomStats).reduce(
                    (acc, stat) => acc + stat.threadCount,
                    0,
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-2 font-medium">
                  Total Threads
                </div>
              </div>
              <div className="stat-card text-center group">
                <div className="text-4xl font-bold text-orange-600 group-hover:scale-110 transition-transform duration-200">
                  {
                    Object.values(roomStats).filter(
                      (stat) =>
                        stat.latestActivity && isNewRoom(stat.latestActivity),
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600 mt-2 font-medium">
                  Active Rooms
                </div>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
