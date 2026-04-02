"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  initializePool,
  queryEvents,
  formatPubkey,
  liveSubscribe,
} from "../../lib/nostrClient";
import { useNostrAuth } from "../../context/NostrAuthContext";
import { OFFICIAL_ROOMS } from "../../data/boardsConfig";

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useNostrAuth();
  const [mainPost, setMainPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [sortBy, setSortBy] = useState("oldest"); // 'oldest' or 'newest'

  // Real-time "New post" banner
  const [newReplyBanner, setNewReplyBanner] = useState(null);
  const [showNewReplyBanner, setShowNewReplyBanner] = useState(false);

  const threadSubsRef = useRef([]);
  const seenEventIdsRef = useRef(new Set());

  // Debounced banner clear
  const clearBannerAfterDelay = useCallback(() => {
    const timer = setTimeout(() => {
      setShowNewReplyBanner(false);
      setNewReplyBanner(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Helper to dedupe new replies and mentions
  const isEventSeen = useCallback((eventId) => {
    return seenEventIdsRef.current.has(eventId);
  }, []);

  const markEventSeen = useCallback((eventId) => {
    seenEventIdsRef.current.add(eventId);
  }, []);

  // Add a new reply to list, keep sorted order, and optionally show banner
  const handleNewReply = useCallback(
    (event) => {
      if (isEventSeen(event.id)) return;
      markEventSeen(event.id);
      setComments((prev) => {
        const updated = [...prev, event];
        return updated.sort((a, b) => a.created_at - b.created_at);
      });
      setNewReplyBanner(event);
      setShowNewReplyBanner(true);
      clearBannerAfterDelay();
    },
    [isEventSeen, markEventSeen, clearBannerAfterDelay],
  );

  // Handle new mentions (p-tag) from other threads
  const handleNewMention = useCallback(
    (event) => {
      if (!user?.pubkey || isEventSeen(event.id)) return;
      markEventSeen(event.id);
      const mentionsCurrentThread = event.tags?.some(
        (tag) => tag[0] === "e" && tag[1] === params.id,
      );
      if (!mentionsCurrentThread) {
        // Show mention notification
      }
    },
    [user?.pubkey, isEventSeen, params.id],
  );

  useEffect(() => {
    if (params.id) {
      loadThread(params.id);
      const setupSubscriptions = async () => {
        const pool = await initializePool();
        const subs = [];

        const replySub = liveSubscribe(
          pool,
          undefined,
          [{ kinds: [1], "#e": [params.id], limit: 50 }],
          handleNewReply,
          { dedupe: true, keepAlive: true, heartbeatMs: 30000 },
        );
        subs.push(replySub);

        if (user?.pubkey) {
          const mentionSub = liveSubscribe(
            pool,
            undefined,
            [{ kinds: [1, 30023], "#p": [user.pubkey], limit: 20 }],
            handleNewMention,
            { dedupe: true, keepAlive: true, heartbeatMs: 30000 },
          );
          subs.push(mentionSub);
        }

        threadSubsRef.current = subs;
      };

      setupSubscriptions();
    }

    return () => {
      threadSubsRef.current.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch (e) {}
      });
      threadSubsRef.current = [];
      seenEventIdsRef.current.clear();
    };
  }, [params.id, user?.pubkey, handleNewReply, handleNewMention]);

  useEffect(() => {
    if (params.id) {
      loadThread(params.id);
    }
  }, [params.id]);

  const loadThread = async (postId) => {
    setLoading(true);
    try {
      const pool = await initializePool();

      const mainPostEvents = await queryEvents(pool, undefined, {
        kinds: [23],
        ids: [postId],
        limit: 1,
      });

      if (mainPostEvents.length === 0) {
        router.push("/");
        return;
      }

      const post = mainPostEvents[0];
      setMainPost(post);

      const commentEvents = await queryEvents(pool, undefined, {
        kinds: [1],
        "#e": [postId],
        limit: 50,
      });

      const sortedComments = commentEvents.sort(
        (a, b) => a.created_at - b.created_at,
      );
      setComments(sortedComments);
    } catch (error) {
      console.error("Failed to load thread:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getPostTitle = (event) => {
    const titleMatch = event.content.match(/^#\s+(.+)$/m);
    if (titleMatch) return titleMatch[1];
    const titleTag = event.tags?.find((tag) => tag[0] === "title");
    if (titleTag) return titleTag[1];
    return "Untitled Post";
  };

  const getRoomForTag = (tag) => {
    return OFFICIAL_ROOMS.find((room) => room.tag === tag);
  };

  const renderContent = (content) => {
    return content
      .replace(/^#\s+(.+)$/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(
        /^##\s+(.+)$/gm,
        '<h2 class="text-xl font-semibold mb-3">$1</h2>',
      )
      .replace(/^###\s+(.+)$/gm, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, "<br />");
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortBy(value);
    if (value === "newest") {
      setComments([...comments].sort((a, b) => b.created_at - a.created_at));
    } else {
      setComments([...comments].sort((a, b) => a.created_at - b.created_at));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center pt-20">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!mainPost) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Post Not Found</h2>
          <Link href="/" className="text-tertiary hover:text-primary font-medium">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const roomTag = mainPost.tags?.find((tag) => tag[0] === "t")?.[1];
  const room = roomTag ? getRoomForTag(roomTag) : OFFICIAL_ROOMS[0];

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Navigation Shell */}
      <nav className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-xl shadow-[0px_12px_32px_rgba(24,25,51,0.06)]">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-screen-2xl mx-auto">
          <Link href="/" className="text-2xl font-black text-primary tracking-tighter hover:opacity-80 transition-opacity">
            <span className="flex items-center gap-2">
              <span className="text-3xl">🌏</span>
              <span className="hidden sm:inline">Panstr</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 font-['Manrope'] font-bold text-lg tracking-tight">
            <Link href="/" className="text-tertiary border-b-2 border-tertiary pb-1">Explore</Link>
            <Link href="/communities" className="text-secondary opacity-80 hover:text-primary hover:opacity-100 transition-colors duration-300">Communities</Link>
            <Link href="/discovery" className="text-secondary opacity-80 hover:text-primary hover:opacity-100 transition-colors duration-300">Global</Link>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-secondary hover:text-primary active:scale-95 transition-transform">notifications</button>
            <button className="material-symbols-outlined text-secondary hover:text-primary active:scale-95 transition-transform">post_add</button>
          </div>
        </div>
      </nav>

      <div className="flex max-w-screen-2xl mx-auto pt-20">
        {/* Side Navigation Shell (Desktop Only) */}
        <aside className="hidden lg:flex flex-col w-64 sticky top-20 h-screen bg-surface-container-low p-6 gap-4 font-['Inter'] font-medium text-sm">
          <div className="flex flex-col gap-1 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white font-bold">N</div>
              <div className="flex flex-col">
                <span className="font-['Manrope'] font-extrabold text-primary">Nostr Identity</span>
                <span className="text-xs text-secondary opacity-60">_@protocol.com</span>
              </div>
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-primary/5 hover:translate-x-1 rounded-lg cursor-pointer active:opacity-80 transition-all duration-200">
              <span className="material-symbols-outlined">home</span>
              <span>Home</span>
            </Link>
            <Link href="/discovery" className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-primary/5 hover:translate-x-1 rounded-lg cursor-pointer active:opacity-80 transition-all duration-200">
              <span className="material-symbols-outlined">trending_up</span>
              <span>Trending</span>
            </Link>
            <Link href="/bookmarks" className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-primary/5 hover:translate-x-1 rounded-lg cursor-pointer active:opacity-80 transition-all duration-200">
              <span className="material-symbols-outlined">push_pin</span>
              <span>Pinned</span>
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-primary/5 hover:translate-x-1 rounded-lg cursor-pointer active:opacity-80 transition-all duration-200">
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </Link>
          </nav>
          <button className="mt-auto bg-gradient-to-br from-primary to-primary-container text-on-primary py-3 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all">
            Create Post
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 px-4 md:px-12 py-8 max-w-4xl mx-auto">
          {/* Original Post (Hero State) */}
          <article className="mb-12">
            <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-surface-container overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {room?.icon || "🌏"}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-headline font-extrabold text-xl text-on-surface">Author</h1>
                    <span className="bg-tertiary-container/20 text-tertiary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Curator</span>
                  </div>
                  <p className="text-sm font-body text-secondary font-medium">
                    {formatPubkey(mainPost.pubkey, "short")} • {formatTime(mainPost.created_at)}
                  </p>
                </div>
              </div>
              <button className="text-secondary hover:text-primary material-symbols-outlined">more_horiz</button>
            </header>

            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight leading-tight text-primary">
                {getPostTitle(mainPost)}
              </h2>
              
              <div
                className="text-lg text-on-surface-variant leading-relaxed font-body prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: `<p class="mb-4">${renderContent(mainPost.content)}</p>`,
                }}
              />

              {/* Room Badge */}
              {room && (
                <div className="flex items-center gap-2 pt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    room.color === "blue" ? "bg-blue-100 text-blue-800" :
                    room.color === "orange" ? "bg-orange-100 text-orange-800" :
                    room.color === "green" ? "bg-green-100 text-green-800" :
                    "bg-purple-100 text-purple-800"
                  }`}>
                    {room.tag}
                  </span>
                  <span className="text-xs text-secondary">{room.name}</span>
                </div>
              )}
            </div>

            <div className="mt-10 flex items-center justify-between py-6 border-y border-outline-variant/15">
              <div className="flex items-center gap-8">
                <button className="flex items-center gap-2 text-secondary hover:text-tertiary transition-colors">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  <span className="font-bold text-sm">0 Zaps</span>
                </button>
                <button className="flex items-center gap-2 text-secondary hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">forum</span>
                  <span className="font-bold text-sm">{comments.length} Replies</span>
                </button>
                <button className="flex items-center gap-2 text-secondary hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">share</span>
                  <span className="font-bold text-sm">Share</span>
                </button>
              </div>
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-primary-container flex items-center justify-center text-[10px] text-white font-bold">A</div>
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-secondary flex items-center justify-center text-[10px] text-white font-bold">B</div>
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-container flex items-center justify-center text-[10px] font-bold text-secondary">+{Math.max(0, comments.length - 2)}</div>
              </div>
            </div>
          </article>

          {/* Conversation Section */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-2xl text-primary">Conversation</h3>
              <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                <span>Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={handleSortChange}
                  className="bg-transparent border-none p-0 focus:ring-0 font-bold text-primary cursor-pointer"
                >
                  <option value="oldest">Oldest</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {/* Post a Reply Input */}
            <div className="bg-surface-container-low p-4 rounded-xl flex gap-4 items-start shadow-sm border border-outline-variant/10">
              <div className="w-10 h-10 rounded-xl bg-surface-container-highest shrink-0 overflow-hidden flex items-center justify-center text-white font-bold">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a thoughtful reply..."
                  className="w-full bg-surface-container-highest border-none rounded-lg focus:ring-2 focus:ring-primary/20 resize-none p-3 text-on-surface font-body min-h-[100px] outline-none"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 text-secondary">
                    <button className="material-symbols-outlined text-xl hover:text-primary transition-colors">image</button>
                    <button className="material-symbols-outlined text-xl hover:text-primary transition-colors">alternate_email</button>
                    <button className="material-symbols-outlined text-xl hover:text-primary transition-colors">sentiment_satisfied</button>
                  </div>
                  <button className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold text-sm active:scale-95 transition-transform hover:bg-primary-container">
                    Post Reply
                  </button>
                </div>
              </div>
            </div>

            {/* Threaded Replies */}
            <div className="space-y-8 mt-12">
              {comments.map((comment, index) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  formatTime={formatTime}
                  isNested={index > 0 && index % 3 === 0}
                />
              ))}

              {comments.length === 0 && (
                <div className="text-center py-12 bg-surface-container-low rounded-xl border border-outline-variant/10">
                  <span className="material-symbols-outlined text-4xl text-secondary/40 mb-3">chat_bubble</span>
                  <p className="text-on-surface-variant font-medium">No replies yet</p>
                  <p className="text-sm text-secondary mt-1">Be the first to reply</p>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Right Sidebar (Contextual Info) */}
        <aside className="hidden xl:block w-80 sticky top-20 h-fit space-y-8 pr-6 pl-4">
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
            <h4 className="font-headline font-bold text-lg text-primary mb-4">About the Author</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
              Nostr user sharing thoughts and ideas with the community.
            </p>
            <div className="flex items-center justify-between text-xs font-bold text-secondary mb-4">
              <span>0 Followers</span>
              <span>0 Following</span>
            </div>
            <button className="w-full bg-primary-container text-on-primary py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
              Follow
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="font-headline font-bold text-lg px-2 text-primary">Trending in Communities</h4>
            <div className="space-y-3">
              <div className="p-3 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer group">
                <span className="text-[10px] uppercase tracking-widest font-bold text-tertiary">#Nostr</span>
                <p className="text-sm font-bold group-hover:text-primary mt-1">Decentralized social protocol</p>
                <span className="text-xs text-secondary">1.2k notes today</span>
              </div>
              <div className="p-3 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer group">
                <span className="text-[10px] uppercase tracking-widest font-bold text-tertiary">#Bitcoin</span>
                <p className="text-sm font-bold group-hover:text-primary mt-1">Digital gold and payments</p>
                <span className="text-xs text-secondary">890 notes today</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Navigation Shell (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full lg:hidden flex justify-around items-center h-16 px-4 pb-safe bg-surface/80 backdrop-blur-md border-t border-outline-variant/20 z-50 shadow-[0px_-4px_20px_rgba(0,0,0,0.03)] font-['Inter'] text-[10px] uppercase tracking-widest">
        <Link href="/" className="flex flex-col items-center justify-center text-secondary opacity-60 hover:opacity-100 cursor-pointer active:scale-95 transition-transform">
          <span className="material-symbols-outlined">dynamic_feed</span>
          <span>Feed</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center justify-center text-secondary opacity-60 hover:opacity-100 cursor-pointer active:scale-95 transition-transform">
          <span className="material-symbols-outlined">search</span>
          <span>Search</span>
        </Link>
        <Link href="/notifications" className="flex flex-col items-center justify-center text-secondary opacity-60 hover:opacity-100 cursor-pointer active:scale-95 transition-transform">
          <span className="material-symbols-outlined">notifications</span>
          <span>Alerts</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center justify-center text-secondary opacity-60 hover:opacity-100 cursor-pointer active:scale-95 transition-transform">
          <span className="material-symbols-outlined">account_circle</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}

// Comment Component
function Comment({ comment, formatTime, isNested }) {
  return (
    <div className={`group relative ${isNested ? "ml-0 md:ml-14 mt-6 flex gap-4 border-l-2 border-surface-container pl-6" : "flex gap-4"}`}>
      <div className={`rounded-xl bg-surface-container shrink-0 overflow-hidden flex items-center justify-center text-white font-bold ${isNested ? "w-8 h-8 text-sm" : "w-10 h-10 text-base"}`}>
        {comment.pubkey?.substring(0, 2).toUpperCase() || "U"}
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-bold text-on-surface ${isNested ? "text-sm" : ""}`}>Nostr User</span>
          <span className={`text-xs text-secondary ${isNested ? "" : ""}`}>
            {formatPubkey(comment.pubkey, "very-short")} • {formatTime(comment.created_at)}
          </span>
        </div>
        <div className={`${isNested ? "bg-surface-container-low p-4 rounded-xl shadow-sm" : "bg-surface-container-lowest p-5 rounded-xl shadow-sm border-l-4 border-tertiary/20"}`}>
          <p className={`font-body text-on-surface-variant leading-relaxed ${isNested ? "text-sm" : ""}`}>
            {comment.content?.slice(0, 500)}{comment.content?.length > 500 ? "..." : ""}
          </p>
        </div>
        <div className="flex items-center gap-6 pt-1">
          <button className="flex items-center gap-1.5 text-secondary hover:text-tertiary text-xs font-bold transition-colors">
            <span className="material-symbols-outlined text-lg">bolt</span>
            0
          </button>
          <button className="flex items-center gap-1.5 text-secondary hover:text-primary text-xs font-bold transition-colors">
            <span className="material-symbols-outlined text-lg">reply</span>
            Reply
          </button>
          <button className="flex items-center gap-1.5 text-secondary hover:text-primary text-xs font-bold transition-colors">
            <span className="material-symbols-outlined text-lg">share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
