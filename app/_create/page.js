"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OFFICIAL_ROOMS, getRoomTags } from "../data/boardsConfig";
import {
  initializePool,
  publishThread,
  initializeBrowserExtension,
  generateThreadId,
} from "../lib/nostrClient";
import { formatTagsForEvent, validateTagsForRoom } from "../lib/tags/tagManager";

export default function CreatePost() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(OFFICIAL_ROOMS[0]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [roomTags, setRoomTags] = useState([]);

  // Load room-specific tags when room changes
  useEffect(() => {
    if (selectedRoom?.tag) {
      const roomId = selectedRoom.tag.replace(/^#/, '').toLowerCase();
      const tags = getRoomTags(roomId);
      setRoomTags(tags);
      setSelectedTags([]); // Reset tags when room changes
      setTagInput("");
    }
  }, [selectedRoom]);

  const handlePublish = async () => {
    // Basic client-side validation
    if (!title.trim() || !content.trim()) {
      alert("กรุณากรอกชื่อกระทู้และเนื้อหา");
      return;
    }
    if (title.length > 200) {
      alert("ชื่อกระทู้ต้องไม่เกิน 200 ตัวอักษร");
      return;
    }

    // Validate tags for the selected room
    if (selectedTags.length > 0) {
      const validation = validateTagsForRoom(selectedTags, selectedRoom.tag.replace(/^#/, '').toLowerCase());
      if (!validation.isValid) {
        alert(`Invalid tags for this room: ${validation.invalidTags.join(', ')}. Please select only tags from the available list.`);
        return;
      }
    }

    setIsPublishing(true);

    try {
      // Attempt to initialize browser extension if present (no-op if not)
      try {
        await initializeBrowserExtension();
      } catch (e) {
        // ignore extension init errors; publishToPool will still fall back to privKey if provided
      }

      // Initialize pool
      const pool = await initializePool();

      // Determine private key (if stored). If not present, publishThread will use browser extension signer if available.
      const storedPriv =
        typeof window !== "undefined"
          ? localStorage.getItem("nostr_private_key")
          : null;
      const privKey = storedPriv || null;

      // Determine board identifier (normalize tag). OFFICIAL_ROOMS currently uses tags like "#BluePlanet"
      const rawTag = selectedRoom?.tag || "";
      const board = String(rawTag)
        .replace(/^#/, "")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      // Generate deterministic thread id (d-tag). Use title-based slug + short hash.
      const threadId = generateThreadId(title);

      // Format tags for Nostr event
      const tags = formatTagsForEvent(selectedTags);

      // Publish the thread as kind:30023 with required tags
      const signedEvent = await publishThread(pool, undefined, privKey, {
        threadId,
        title,
        board,
        content,
        published_at: Math.floor(Date.now() / 1000),
        tags, // Include room-specific tags
      });

      if (signedEvent && signedEvent.id) {
        // Navigate to the created thread page
        setIsPublishing(false);
        router.push(`/post/${signedEvent.id}`);
      } else {
        throw new Error("Failed to publish thread (no event id returned)");
      }
    } catch (err) {
      console.error("Failed to publish thread:", err);
      alert("ไม่สามารถเผยแพร่กระทู้ได้: " + (err.message || err));
      setIsPublishing(false);
    }
  };

  const formatContent = (text) => {
    // Simple markdown-like formatting for preview
    return text
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

  return (
    <div className="min-h-screen bg-surface">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-xl shadow-[0px_12px_32px_rgba(24,25,51,0.06)]">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-black text-primary tracking-tighter hover:opacity-80 transition-opacity">
              <span className="flex items-center gap-2">
                <span className="text-3xl">🌏</span>
                <span className="hidden sm:inline">Panstr</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 font-['Manrope'] font-bold text-lg tracking-tight">
              <Link href="/" className="text-secondary opacity-80 hover:text-primary hover:opacity-100 transition-colors duration-300">
                Explore
              </Link>
              <Link href="/communities" className="text-secondary opacity-80 hover:text-primary hover:opacity-100 transition-colors duration-300">
                Communities
              </Link>
              <Link href="/discovery" className="text-secondary opacity-80 hover:text-primary hover:opacity-100 transition-colors duration-300">
                Global
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-secondary hover:text-primary active:scale-95 transition-transform">
              notifications
            </button>
            <button className="material-symbols-outlined text-secondary hover:text-primary active:scale-95 transition-transform">
              post_add
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-20 min-h-screen">
        {/* SideNavBar - Desktop Only */}
        <aside className="hidden lg:flex flex-col w-64 sticky top-20 h-[calc(100vh-5rem)] p-6 gap-4 bg-surface-container-low">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white font-bold">
                N
              </div>
              <div className="overflow-hidden">
                <p className="font-['Manrope'] font-extrabold text-primary truncate">Nostr Identity</p>
                <p className="text-xs text-secondary opacity-70 truncate">_@protocol.com</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-col gap-2 font-['Inter'] font-medium text-sm">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-primary/5 hover:translate-x-1 transition-all duration-200 rounded-lg">
              <span className="material-symbols-outlined">home</span> Home
            </Link>
            <Link href="/discovery" className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-primary/5 hover:translate-x-1 transition-all duration-200 rounded-lg">
              <span className="material-symbols-outlined">trending_up</span> Trending
            </Link>
            <Link href="/bookmarks" className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-primary/5 hover:translate-x-1 transition-all duration-200 rounded-lg">
              <span className="material-symbols-outlined">push_pin</span> Pinned
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-primary/5 hover:translate-x-1 transition-all duration-200 rounded-lg">
              <span className="material-symbols-outlined">settings</span> Settings
            </Link>
          </nav>
          <div className="mt-auto">
            <button className="w-full py-3 bg-primary text-on-primary rounded-lg shadow-lg font-bold text-sm active:scale-95 transition-transform">
              Create Post
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 px-4 md:px-12 py-8 max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-2">
                Drafting New Curated Thought
              </h1>
              <p className="text-secondary font-body">Decentralized publishing via Nostr protocol.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  previewMode
                    ? "bg-surface-container-high text-primary"
                    : "bg-surface-container text-secondary hover:bg-surface-container-high"
                }`}
              >
                {previewMode ? "Edit" : "Preview"}
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing || !title.trim() || !content.trim()}
                className="px-8 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPublishing ? "Publishing..." : "Publish to Nostr"}
              </button>
            </div>
          </div>

          {!previewMode ? (
            <div className="space-y-8">
              {/* Room Selection */}
              <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-tertiary text-sm">groups</span>
                  <span className="text-xs uppercase tracking-widest font-bold text-secondary">Select Room</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {OFFICIAL_ROOMS.map((room) => (
                    <button
                      key={room.tag}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        selectedRoom.tag === room.tag
                          ? "border-primary bg-surface-container-high shadow-md"
                          : "border-outline-variant/20 hover:border-outline-variant/40 bg-surface-container-lowest"
                      }`}
                    >
                      <div className="text-2xl mb-2">{room.icon}</div>
                      <div className="font-bold text-sm text-primary mb-1">{room.name}</div>
                      <div className="text-xs text-secondary line-clamp-2">{room.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="group">
                <label className="block text-xs uppercase tracking-widest font-bold text-secondary mb-2">
                  Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entry Title..."
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-6 py-5 text-xl font-headline font-bold text-primary placeholder:text-secondary/40 focus:ring-2 focus:ring-primary/20 focus:border-transparent transition-all outline-none"
                  maxLength={200}
                />
                <div className="mt-2 text-xs text-secondary text-right">{title.length}/200</div>
              </div>

              {/* Content Area */}
              <div className="relative">
                <label className="block text-xs uppercase tracking-widest font-bold text-secondary mb-2">
                  Content <span className="text-error">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tell your story or share your discovery..."
                  rows={12}
                  className="w-full min-h-[400px] bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-8 py-8 text-lg font-body leading-relaxed text-on-surface placeholder:text-secondary/30 focus:ring-2 focus:ring-primary/20 focus:border-transparent transition-all outline-none resize-none shadow-sm"
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-secondary">
                    Markdown supported: **bold**, *italic*, #heading
                  </div>
                  <div className="text-xs text-secondary">{content.length} characters</div>
                </div>
              </div>

              {/* Room-Specific Tags */}
              {roomTags.length > 0 && (
                <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-sm text-secondary">label</span>
                    <span className="text-xs uppercase tracking-widest font-bold text-secondary">
                      Categorization & Tags
                      <span className="text-secondary font-normal ml-2">- Select up to 5 tags for this room</span>
                    </span>
                  </div>
                  
                  {/* Available tags */}
                  <div className="mb-4">
                    <p className="text-xs text-on-surface-variant mb-3">Available tags for {selectedRoom.name}:</p>
                    <div className="flex flex-wrap gap-2">
                      {roomTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        const isDisabled = !isSelected && selectedTags.length >= 5;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTags(selectedTags.filter(t => t !== tag));
                              } else if (!isDisabled) {
                                setSelectedTags([...selectedTags, tag]);
                              }
                            }}
                            disabled={isDisabled}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              isSelected
                                ? "bg-secondary-container text-on-secondary-container shadow-md"
                                : isDisabled
                                ? "bg-surface-container-high text-secondary/40 cursor-not-allowed"
                                : "bg-surface-container-high text-secondary hover:bg-surface-container"
                            }`}
                          >
                            {tag.replace(/-/g, " ")}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected tags */}
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-outline-variant/15">
                      <span className="text-xs font-bold text-secondary uppercase tracking-wider self-center">Selected:</span>
                      {selectedTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full text-sm font-medium"
                        >
                          {tag.replace(/-/g, " ")}
                          <button
                            type="button"
                            onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                            className="material-symbols-outlined text-xs hover:scale-110 transition-transform"
                          >
                            close
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-tertiary">visibility</span>
                <h2 className="text-xl font-bold text-primary">Post Preview</h2>
              </div>
              
              <div className="bg-surface-container-lowest rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white font-bold">
                    {selectedRoom.icon}
                  </div>
                  <div>
                    <div className="font-bold text-primary">{selectedRoom.name}</div>
                    <div className="text-xs text-secondary">{selectedRoom.tag}</div>
                  </div>
                </div>

                {title && (
                  <h1 className="text-2xl md:text-3xl font-black text-primary mb-6 leading-tight">
                    {title}
                  </h1>
                )}

                {content && (
                  <div
                    className="prose max-w-none text-on-surface-variant font-body leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: `<p class="mb-4">${formatContent(content)}</p>`,
                    }}
                  />
                )}

                {!title && !content && (
                  <div className="text-center py-12 text-secondary">
                    <span className="material-symbols-outlined text-4xl mb-3 opacity-40">post_add</span>
                    <div className="text-lg font-medium mb-2">No content yet</div>
                    <div className="text-sm">Please enter title and content to preview</div>
                  </div>
                )}
              </div>

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold"
                    >
                      #{tag.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tips Section */}
          <div className="mt-8 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-sm">lightbulb</span>
              Tips for Great Posts
            </h3>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">check_circle</span>
                <span>Choose the room that best fits your content topic</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">check_circle</span>
                <span>Use clear, concise titles that capture attention</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">check_circle</span>
                <span>Break content into paragraphs for readability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">check_circle</span>
                <span>Use Markdown formatting for emphasis and structure</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">check_circle</span>
                <span>Review your content before publishing to Nostr</span>
              </li>
            </ul>
          </div>
        </main>
      </div>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-16 px-4 pb-safe bg-surface/80 backdrop-blur-md lg:hidden z-50 border-t border-outline-variant/20 shadow-[0px_-4px_20px_rgba(0,0,0,0.03)]">
        <Link href="/" className="flex flex-col items-center justify-center text-secondary opacity-60 hover:opacity-100 transition-all">
          <span className="material-symbols-outlined">dynamic_feed</span>
          <span className="font-['Inter'] text-[10px] uppercase tracking-widest">Feed</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center justify-center text-secondary opacity-60 hover:opacity-100 transition-all">
          <span className="material-symbols-outlined">search</span>
          <span className="font-['Inter'] text-[10px] uppercase tracking-widest">Search</span>
        </Link>
        <Link href="/_create" className="flex flex-col items-center justify-center text-tertiary font-bold scale-110 transition-all">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>post_add</span>
          <span className="font-['Inter'] text-[10px] uppercase tracking-widest">Post</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center justify-center text-secondary opacity-60 hover:opacity-100 transition-all">
          <span className="material-symbols-outlined">account_circle</span>
          <span className="font-['Inter'] text-[10px] uppercase tracking-widest">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
