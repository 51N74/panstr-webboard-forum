"use client";

import { useState, useEffect } from "react";
import { BOARD_CATEGORIES, getRoomById } from "../data/boardsConfig";
import { useNostr } from "../context/NostrContext";
import { useNostrAuth } from "../context/NostrAuthContext";
import Link from "next/link";

/**
 * BoardList Component - Panstr Minimal
 * Streamlined discovery of rooms and categories
 */

export default function BoardList() {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [roomStats, setRoomStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState("categories");
  const { getEvents } = useNostr();
  const { user } = useNostrAuth();

  useEffect(() => {
    setMounted(true);
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
            latestActivity: roomEvents.length > 0 ? Math.max(...roomEvents.map((e) => e.created_at)) : null,
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
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-8 sm:pt-12">
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 flex flex-col lg:flex-row gap-8 lg:gap-10">
        
        {/* Simplified Left Sidebar - Hidden on mobile, visible from lg up */}
        <aside className="hidden lg:block w-48 shrink-0">
          <nav className="sticky top-24 flex flex-col gap-1">
            <Link href="/" className="px-3 py-2 text-sm font-bold text-primary bg-surface-muted rounded-md">
              Home
            </Link>
            <Link href="/discovery" className="px-3 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">
              Trending
            </Link>
            <Link href="/bookmarks" className="px-3 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">
              Pinned
            </Link>
            <Link href="/settings" className="px-3 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">
              Settings
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <header className="mb-8 lg:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2">Discover</h1>
              <p className="text-sm text-secondary">Participate in decentralized communities across the Nostr network.</p>
            </div>
            <div className="flex bg-surface-muted p-1 rounded-md border border-surface-border self-start">
              <button 
                onClick={() => setViewMode("categories")}
                className={`px-3 py-1.5 text-xs font-bold rounded ${viewMode === "categories" ? "bg-white shadow-sm text-primary" : "text-secondary hover:text-primary"}`}
              >
                Categories
              </button>
              <button 
                onClick={() => setViewMode("all")}
                className={`px-3 py-1.5 text-xs font-bold rounded ${viewMode === "all" ? "bg-white shadow-sm text-primary" : "text-secondary hover:text-primary"}`}
              >
                All Rooms
              </button>
            </div>
          </header>

          <div className="space-y-8 lg:space-y-12">
            {BOARD_CATEGORIES.map((category) => {
              const isExpanded = expandedCategories[category.id];
              return (
                <section key={category.id} className="animate-slide-up">
                  <button 
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between mb-4 lg:mb-6 group"
                  >
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center bg-surface-muted rounded-lg border border-surface-border text-lg lg:text-xl">
                        {category.icon}
                      </div>
                      <div className="text-left">
                        <h2 className="text-base lg:text-lg font-bold group-hover:text-accent transition-colors">{category.name}</h2>
                        <p className="text-[10px] lg:text-xs text-secondary">{category.description}</p>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                      {category.rooms.map((room) => {
                        const stats = roomStats[room.id] || { threadCount: 0, latestActivity: null };
                        return (
                          <Link 
                            key={room.id} 
                            href={`/room/${room.id}`}
                            className="p-4 lg:p-5 border border-surface-border rounded-lg hover:border-accent/40 hover:shadow-soft transition-all group"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-lg lg:text-xl">{room.icon}</span>
                              <div className="text-[9px] lg:text-[10px] font-bold text-secondary flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px] lg:text-[14px]">chat</span>
                                  {stats.threadCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px] lg:text-[14px]">schedule</span>
                                  {formatTimeAgo(stats.latestActivity)}
                                </span>
                              </div>
                            </div>
                            <h3 className="text-sm lg:text-base font-bold text-primary group-hover:text-accent transition-colors mb-1">{room.name}</h3>
                            <p className="text-[11px] lg:text-xs text-secondary line-clamp-2 leading-relaxed">{room.description}</p>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </main>

        {/* Minimal Right Sidebar - Hidden on xl below */}
        <aside className="hidden xl:block w-64 shrink-0">
          <div className="sticky top-24 space-y-10">
            <section>
              <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4">Trending Tags</h4>
              <div className="flex flex-wrap gap-2">
                {['#bitcoin', '#nostr', '#privacy', '#ai', '#dev'].map(tag => (
                  <a key={tag} href="#" className="px-2 py-1 text-[11px] font-medium text-secondary bg-surface-muted rounded hover:bg-surface-border transition-colors border border-surface-border/50">
                    {tag}
                  </a>
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4">Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-secondary">Rooms</span>
                  <span className="font-bold">{BOARD_CATEGORIES.reduce((acc, cat) => acc + cat.rooms.length, 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-secondary">Connected</span>
                  <span className="font-bold text-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                    Live
                  </span>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>

      {loading && (
        <div className="fixed bottom-6 right-6 bg-primary text-white px-4 py-2 rounded-full text-[10px] lg:text-xs font-bold flex items-center gap-2 shadow-mid animate-fade-in z-50">
          <div className="w-3 h-3 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
          Syncing Nostr...
        </div>
      )}
    </div>
  );
}
