"use client";

import { useState, useEffect } from "react";
import { BOARD_CATEGORIES, getRoomById } from "../data/boardsConfig";
import { useNostr } from "../context/NostrContext";
import { useNostrAuth } from "../context/NostrAuthContext";
import Link from "next/link";

export default function BoardList() {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [roomStats, setRoomStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState("categories"); // 'categories' or 'all'
  const { getEvents } = useNostr();
  const { user } = useNostrAuth();

  useEffect(() => {
    setMounted(true);
    // Expand all categories by default
    const initialExpanded = {};
    BOARD_CATEGORIES.forEach((cat) => {
      initialExpanded[cat.id] = true;
    });
    setExpandedCategories(initialExpanded);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchRoomStats = async () => {
      setLoading(true);
      const stats = {};

      try {
        const allRooms = BOARD_CATEGORIES.flatMap((cat) => cat.rooms);
        const roomIds = allRooms.map((room) => room.id);

        const allEvents = await getEvents({
          kinds: [30023],
          "#t": ["forum"],
          "#board": roomIds,
          limit: 200,
        });

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
    return diff < 86400;
  };

  const isActiveNow = (latestActivity) => {
    if (!latestActivity) return false;
    const now = Math.floor(Date.now() / 1000);
    const diff = now - latestActivity;
    return diff < 300; // 5 minutes
  };

  // Calculate total rooms
  const totalRooms = BOARD_CATEGORIES.reduce((acc, cat) => acc + cat.rooms.length, 0);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Main Layout Container */}
      <div className="max-w-screen-2xl mx-auto flex pt-20 px-4 md:px-6 gap-6 lg:gap-8">
        
        {/* Left Sidebar - Navigation */}
        <aside className="hidden lg:flex flex-col w-64 sticky top-24 h-[calc(100vh-8rem)] shrink-0">
          <div className="bg-surface-container-low p-6 rounded-xl h-full flex flex-col">
            {/* User Identity */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/15">
              <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-white font-bold text-xl">
                {user?.name?.[0]?.toUpperCase() || user?.npub?.substring(0, 2).toUpperCase() || "N"}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-['Manrope'] font-extrabold text-primary truncate">
                  {user?.display_name || user?.name || "Nostr Identity"}
                </h3>
                <p className="text-xs text-secondary opacity-70 truncate">
                  {user?.nip05 || "_@protocol.com"}
                </p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-2 font-['Inter'] font-medium text-sm flex-1">
              <Link
                href="/"
                className="flex items-center gap-3 p-3 bg-primary text-white rounded-lg shadow-lg cursor-pointer transition-all duration-200"
              >
                <span className="material-symbols-outlined">home</span>
                <span>Home</span>
              </Link>
              <Link
                href="/discovery"
                className="flex items-center gap-3 p-3 text-secondary hover:bg-primary/5 hover:translate-x-1 rounded-lg cursor-pointer transition-all duration-200"
              >
                <span className="material-symbols-outlined">trending_up</span>
                <span>Trending</span>
              </Link>
              <Link
                href="/bookmarks"
                className="flex items-center gap-3 p-3 text-secondary hover:bg-primary/5 hover:translate-x-1 rounded-lg cursor-pointer transition-all duration-200"
              >
                <span className="material-symbols-outlined">push_pin</span>
                <span>Pinned</span>
              </Link>
              <Link
                href="/communities"
                className="flex items-center gap-3 p-3 text-secondary hover:bg-primary/5 hover:translate-x-1 rounded-lg cursor-pointer transition-all duration-200"
              >
                <span className="material-symbols-outlined">groups</span>
                <span>Communities</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 p-3 text-secondary hover:bg-primary/5 hover:translate-x-1 rounded-lg cursor-pointer transition-all duration-200"
              >
                <span className="material-symbols-outlined">settings</span>
                <span>Settings</span>
              </Link>
            </nav>

            {/* Create Post Button */}
            <button className="mt-4 bg-gradient-to-br from-primary to-primary-container text-on-primary py-3 rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-transform">
              Create Post
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl space-y-6 pb-24">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
                Discover Rooms
              </h1>
              <p className="text-sm text-secondary mt-1">
                {totalRooms} rooms across {BOARD_CATEGORIES.length} categories
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("categories")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  viewMode === "categories"
                    ? "bg-surface-container-high text-primary"
                    : "text-secondary opacity-60 hover:opacity-100"
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  viewMode === "all"
                    ? "bg-surface-container-high text-primary"
                    : "text-secondary opacity-60 hover:opacity-100"
                }`}
              >
                All Rooms
              </button>
            </div>
          </div>

          {/* Categories View */}
          {viewMode === "categories" && (
            <div className="space-y-6">
              {BOARD_CATEGORIES.map((category) => {
                const isExpanded = expandedCategories[category.id];
                const roomCount = category.rooms.length;

                return (
                  <section
                    key={category.id}
                    className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_12px_32px_rgba(24,25,51,0.04)] border border-outline-variant/10"
                  >
                    {/* Category Header */}
                    <div
                      className="flex items-center justify-between p-6 cursor-pointer bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{category.icon}</span>
                        <div>
                          <h2 className="text-xl font-extrabold text-primary">
                            {category.name}
                          </h2>
                          <p className="text-xs text-secondary opacity-70">
                            {category.description} • {roomCount} rooms
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="hidden sm:inline px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-primary uppercase tracking-widest">
                          {roomCount} rooms
                        </span>
                        <span
                          className={`material-symbols-outlined transition-transform duration-300 text-secondary ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          expand_more
                        </span>
                      </div>
                    </div>

                    {/* Category Content */}
                    {isExpanded && (
                      <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-outline-variant/10 mt-4">
                        {category.rooms.map((room) => {
                          const stats = roomStats[room.id] || {
                            threadCount: 0,
                            latestActivity: null,
                          };
                          const hasNewPosts = isNewRoom(stats.latestActivity);
                          const isActive = isActiveNow(stats.latestActivity);

                          return (
                            <Link
                              key={room.id}
                              href={`/room/${room.id}`}
                              className="p-5 rounded-xl border border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-high transition-all cursor-pointer group"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <span className="text-2xl group-hover:scale-110 transition-transform">
                                  {room.icon}
                                </span>
                                {isActive && (
                                  <span className="curator-badge-success text-xs">
                                    <span className="material-symbols-filled text-xs mr-1">bolt</span>
                                    Active
                                  </span>
                                )}
                                {hasNewPosts && !isActive && (
                                  <span className="curator-badge-primary text-xs">
                                    New
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-primary group-hover:text-tertiary transition-colors mb-2">
                                {room.name}
                              </h3>
                              <p className="text-xs text-secondary leading-relaxed line-clamp-2">
                                {room.description}
                              </p>
                              <div className="flex items-center justify-between mt-4 text-[10px] font-bold text-secondary/60 uppercase tracking-tighter">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">chat_bubble</span>
                                  {stats.threadCount} threads
                                </span>
                                <span className={`flex items-center gap-1 ${isActive ? "text-tertiary font-semibold" : ""}`}>
                                  <span className="material-symbols-outlined text-sm">history</span>
                                  {formatTimeAgo(stats.latestActivity)}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          {/* All Rooms View */}
          {viewMode === "all" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BOARD_CATEGORIES.flatMap((category) =>
                category.rooms.map((room) => {
                  const stats = roomStats[room.id] || {
                    threadCount: 0,
                    latestActivity: null,
                  };
                  const hasNewPosts = isNewRoom(stats.latestActivity);
                  const isActive = isActiveNow(stats.latestActivity);

                  return (
                    <Link
                      key={room.id}
                      href={`/room/${room.id}`}
                      className="p-5 rounded-xl border border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-high transition-all cursor-pointer group bg-surface-container-lowest"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl group-hover:scale-110 transition-transform">
                            {room.icon}
                          </span>
                          <div>
                            <h3 className="font-bold text-primary group-hover:text-tertiary transition-colors">
                              {room.name}
                            </h3>
                            <p className="text-[10px] text-secondary uppercase tracking-widest">
                              {category.name}
                            </p>
                          </div>
                        </div>
                        {isActive && (
                          <span className="curator-badge-success text-xs">
                            <span className="material-symbols-filled text-xs mr-1">bolt</span>
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary leading-relaxed line-clamp-2 mb-4">
                        {room.description}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-bold text-secondary/60 uppercase tracking-tighter">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">chat_bubble</span>
                          {stats.threadCount} threads
                        </span>
                        <span className={`flex items-center gap-1 ${isActive ? "text-tertiary font-semibold" : ""}`}>
                          <span className="material-symbols-outlined text-sm">history</span>
                          {formatTimeAgo(stats.latestActivity)}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-xl border border-outline-variant/20">
                <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
                <p className="text-primary font-bold">Loading room statistics...</p>
                <p className="text-sm text-secondary mt-2">Discovering amazing conversations</p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Trending & Activity */}
        <aside className="hidden xl:flex flex-col w-80 gap-6 sticky top-24 h-fit shrink-0">
          {/* Trending Tags */}
          <section className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
            <h4 className="font-['Manrope'] font-extrabold text-lg text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">trending_up</span>
              Trending Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              <a className="px-3 py-2 bg-surface-container-lowest text-secondary text-xs font-bold rounded-lg border border-outline-variant/20 hover:border-tertiary hover:text-tertiary transition-all" href="#">
                #bitcoin
              </a>
              <a className="px-3 py-2 bg-surface-container-lowest text-secondary text-xs font-bold rounded-lg border border-outline-variant/20 hover:border-tertiary hover:text-tertiary transition-all" href="#">
                #nostr
              </a>
              <a className="px-3 py-2 bg-surface-container-lowest text-secondary text-xs font-bold rounded-lg border border-outline-variant/20 hover:border-tertiary hover:text-tertiary transition-all" href="#">
                #privacy
              </a>
              <a className="px-3 py-2 bg-surface-container-lowest text-secondary text-xs font-bold rounded-lg border border-outline-variant/20 hover:border-tertiary hover:text-tertiary transition-all" href="#">
                #thailand
              </a>
              <a className="px-3 py-2 bg-surface-container-lowest text-secondary text-xs font-bold rounded-lg border border-outline-variant/20 hover:border-tertiary hover:text-tertiary transition-all" href="#">
                #decentralization
              </a>
              <a className="px-3 py-2 bg-surface-container-lowest text-secondary text-xs font-bold rounded-lg border border-outline-variant/20 hover:border-tertiary hover:text-tertiary transition-all" href="#">
                #web3
              </a>
            </div>
          </section>

          {/* Active Communities */}
          <section className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
            <h4 className="font-['Manrope'] font-extrabold text-lg text-primary mb-4">
              Active Communities
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white font-black group-hover:scale-110 transition-transform">
                  N
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-primary group-hover:text-tertiary transition-colors">
                    Nostr Developers
                  </span>
                  <span className="text-[10px] text-secondary">12.4k members</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center text-white font-black group-hover:scale-110 transition-transform">
                  P
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-primary group-hover:text-tertiary transition-colors">
                    Philosophy Today
                  </span>
                  <span className="text-[10px] text-secondary">8.2k members</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white font-black group-hover:scale-110 transition-transform">
                  T
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-primary group-hover:text-tertiary transition-colors">
                    Tech Enthusiasts
                  </span>
                  <span className="text-[10px] text-secondary">5.8k members</span>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-2.5 text-sm font-bold text-primary border-2 border-primary/10 rounded-lg hover:bg-primary/5 transition-colors">
              View All
            </button>
          </section>

          {/* Quick Stats */}
          <section className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
            <h4 className="font-['Manrope'] font-extrabold text-lg text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">insights</span>
              Forum Stats
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Total Rooms</span>
                <span className="text-sm font-bold text-primary">{totalRooms}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Categories</span>
                <span className="text-sm font-bold text-primary">{BOARD_CATEGORIES.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Active Now</span>
                <span className="text-sm font-bold text-tertiary flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {Object.values(roomStats).filter((s) => isActiveNow(s.latestActivity)).length}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="bottom-nav lg:hidden">
        <Link href="/" className="bottom-nav-item-active">
          <span className="material-symbols-filled">dynamic_feed</span>
          <span>Rooms</span>
        </Link>
        <Link href="/discovery" className="bottom-nav-item">
          <span className="material-symbols-outlined">search</span>
          <span>Search</span>
        </Link>
        <Link href="/notifications" className="bottom-nav-item">
          <span className="material-symbols-outlined">notifications</span>
          <span>Alerts</span>
        </Link>
        <Link href="/profile" className="bottom-nav-item">
          <span className="material-symbols-outlined">account_circle</span>
          <span>Profile</span>
        </Link>
      </nav>

      {/* FAB for Create Post (Mobile) */}
      <button className="fixed right-6 bottom-24 lg:bottom-12 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center shadow-xl lg:hidden active:scale-90 transition-transform z-40">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>
    </div>
  );
}
