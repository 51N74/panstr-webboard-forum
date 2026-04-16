"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRoomById, getCategoryByRoomId, getRoomTags } from "../data/boardsConfig";
import { useNostr } from "../context/NostrContext";
import Link from "next/link";
import ThreadCard from "../components/ThreadCard";

/**
 * RoomPage Component - Panstr Minimal
 * Isolated view for specific communities/topics
 */

export default function RoomPage({ roomId }) {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [sortBy, setSortBy] = useState("latest");
  const [selectedTag, setSelectedTag] = useState(null);
  const [roomTags, setRoomTags] = useState([]);
  const { getEvents } = useNostr();

  useEffect(() => {
    setMounted(true);
    if (roomId) {
      setRoomTags(getRoomTags(roomId));
    }
  }, [roomId]);

  const room = getRoomById(roomId);
  const category = getCategoryByRoomId(roomId);

  useEffect(() => {
    if (!room && mounted) {
      router.push("/");
      return;
    }
    fetchThreads();
  }, [roomId, sortBy, selectedTag, mounted]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const results = await getEvents({
        kinds: [30023],
        "#room": [roomId],
        limit: 100,
      });

      let events = results || [];

      if (selectedTag) {
        events = events.filter(e => e.tags.some(t => t[0] === 't' && t[1].toLowerCase() === selectedTag.toLowerCase()));
      }

      if (sortBy === "latest") events.sort((a, b) => b.created_at - a.created_at);
      else if (sortBy === "replies") {
        events.sort((a, b) => {
          const aR = parseInt(a.tags.find(t => t[0] === 'reply_count')?.[1] || 0);
          const bR = parseInt(b.tags.find(t => t[0] === 'reply_count')?.[1] || 0);
          return bR - aR;
        });
      }

      setThreads(events);
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!room) return null;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-8 sm:pt-12 lg:pt-20">
      <div className="max-w-screen-xl mx-auto px-4 md:px-6">
        {/* Room Header - Isolated Context */}
        <header className="mb-8 lg:mb-12">
          <nav className="flex items-center gap-2 text-[10px] font-bold text-secondary uppercase tracking-widest mb-4 lg:mb-6 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="text-surface-border">/</span>
            <span className="text-primary">{room.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-surface-muted border border-surface-border rounded-xl flex items-center justify-center text-2xl lg:text-3xl">
                {room.icon}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl lg:text-4xl font-black tracking-tighter mb-1 lg:mb-2 truncate">{room.name}</h1>
                <p className="text-[11px] lg:text-sm text-secondary max-w-xl line-clamp-2">{room.description}</p>
              </div>
            </div>
            <Link 
              href={`/room/${roomId}/new`}
              className="btn-primary w-full sm:w-auto text-center"
            >
              Start Thread
            </Link>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Filters & Tags Sidebar */}
          <aside className="w-full lg:w-48 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6 lg:space-y-8">
              <section>
                <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-3 lg:mb-4">Sort</h4>
                <div className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
                  <button 
                    onClick={() => setSortBy("latest")}
                    className={`whitespace-nowrap text-left px-3 py-1.5 text-xs font-bold rounded ${sortBy === "latest" ? "bg-surface-muted text-primary" : "text-secondary hover:text-primary"}`}
                  >
                    Latest
                  </button>
                  <button 
                    onClick={() => setSortBy("replies")}
                    className={`whitespace-nowrap text-left px-3 py-1.5 text-xs font-bold rounded ${sortBy === "replies" ? "bg-surface-muted text-primary" : "text-secondary hover:text-primary"}`}
                  >
                    Popular
                  </button>
                </div>
              </section>

              {roomTags.length > 0 && (
                <section>
                  <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-3 lg:mb-4">Tags</h4>
                  <div className="flex flex-wrap lg:flex-col gap-1 lg:gap-1">
                    <button 
                      onClick={() => setSelectedTag(null)}
                      className={`text-left px-2 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${!selectedTag ? "bg-primary text-white border-primary" : "bg-transparent text-secondary border-surface-border hover:border-secondary"}`}
                    >
                      All
                    </button>
                    {roomTags.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`text-left px-2 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${selectedTag === tag ? "bg-accent text-white border-accent" : "bg-transparent text-secondary border-surface-border hover:border-secondary"}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </aside>

          {/* Threads Feed */}
          <main className="flex-1 min-w-0 pb-20">
            {loading ? (
              <div className="space-y-4 lg:space-y-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 lg:h-40 bg-surface-muted rounded-lg animate-pulse border border-surface-border"></div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="py-12 lg:py-20 text-center border border-dashed border-surface-border rounded-xl">
                <span className="material-symbols-outlined text-3xl lg:text-4xl text-surface-border mb-4">forum</span>
                <p className="text-secondary text-xs lg:text-sm font-medium px-4">No threads found in this room yet.</p>
                <Link href={`/room/${roomId}/new`} className="text-accent text-[10px] lg:text-xs font-bold uppercase tracking-widest mt-2 inline-block">Be the first to post →</Link>
              </div>
            ) : (
              <div className="space-y-1 lg:space-y-2">
                {threads.map(thread => (
                  <ThreadCard key={thread.id} thread={thread} roomId={roomId} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
