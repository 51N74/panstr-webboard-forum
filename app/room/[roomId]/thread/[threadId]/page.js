"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useNostrAuth } from "../../../../context/NostrAuthContext";
import { useNostr } from "../../../../context/NostrContext";
import {
  getRoomById,
  getCategoryByRoomId,
} from "../../../../data/boardsConfig";
import {
  initializePool,
  createReplyEvent,
  publishToPool,
  getEvents,
  parseThread,
  optimizeThreadStructure,
} from "../../../../lib/nostrClient";
import EnhancedThreadView from "../../../../components/enhanced/threading/EnhancedThreadView";
import db from "../../../../lib/storage/indexedDB";
import UserProfile from "../../../../components/profiles/UserProfile";

export default function ThreadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { roomId, threadId } = params;
  const { user } = useNostrAuth();
  const { getProfile } = useNostr();

  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewCount, setViewCount] = useState(0);
  const [replyCount, setReplyCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(null);

  const room = getRoomById(roomId);
  const category = getCategoryByRoomId(roomId);

  useEffect(() => {
    if (!room) {
      router.push("/");
      return;
    }
    fetchThreadData();
  }, [roomId, threadId]);

  const fetchThreadData = async () => {
    setLoading(true);
    try {
      // Fetch main thread
      const threadEvents = await getEvents({
        ids: [threadId],
        kinds: [30023],
      });

      if (threadEvents.length === 0) {
        setError("Thread not found");
        return;
      }

      const threadEvent = threadEvents[0];
      setThread(threadEvent);

      // Increment view count in IndexedDB
      if (user?.pubkey) {
        await db.incrementViewCount(threadId, user.pubkey);
        const viewCount = await db.getViewCount(threadId);
        setViewCount(viewCount);
      }

      // Fetch all replies for this thread
      const replyEvents = await getEvents({
        kinds: [1],
        "#e": [threadId],
        limit: 50,
      });

      // Filter and organize replies
      const threadReplies = replyEvents.filter((event) => {
        const parsed = parseThread(event);
        return parsed.root?.id === threadId || parsed.reply?.id === threadId;
      });

      // Optimize thread structure for display
      const optimizedReplies = optimizeThreadStructure(threadReplies);
      setReplies(optimizedReplies);
      setReplyCount(threadReplies.length);
    } catch (err) {
      console.error("Error fetching thread data:", err);
      setError("Failed to load thread");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentEvent) => {
    if (!user) {
      setError("Please connect your Nostr account to reply");
      return;
    }

    if (!replyContent.trim()) {
      setError("Please enter a reply");
      return;
    }

    setIsSubmittingReply(true);
    setError("");

    try {
      // Initialize pool
      const pool = await initializePool();

      // Get private key from storage
      const storedHexKey = localStorage.getItem("nostr_private_key");
      if (!storedHexKey) {
        throw new Error("No private key found");
      }

      // Convert hex to Uint8Array
      const privateKeyBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        privateKeyBytes[i] = parseInt(storedHexKey.substr(i * 2, 2), 16);
      }

      // Create reply event
      const replyEvent = createReplyEvent(
        parentEvent,
        replyContent,
        privateKeyBytes,
        roomId,
      );

      // Publish reply
      const publishedEvent = await publishToPool(
        pool,
        undefined,
        privateKeyBytes,
        replyEvent.content,
        {
          kind: replyEvent.kind,
          tags: replyEvent.tags,
        },
      );

      if (publishedEvent && publishedEvent.id) {
        setSuccess("Reply published successfully!");
        setReplyContent("");

        // Refresh thread data to show the new reply
        setTimeout(() => {
          fetchThreadData();
        }, 1000);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } else {
        throw new Error("Failed to publish reply");
      }
    } catch (err) {
      console.error("Error publishing reply:", err);
      setError(`Failed to publish reply: ${err.message}`);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const getThreadTitle = (threadEvent) => {
    const titleTag = threadEvent.tags.find((tag) => tag[0] === "title");
    return titleTag ? titleTag[1] : "Untitled Thread";
  };

  const formatContent = (content) => {
    // Enhanced markdown rendering with modern styling
    return (
      content
        // Headers with better styling
        .replace(
          /^### (.*$)/gim,
          '<h3 class="text-xl font-semibold mb-3 text-gray-800">$1</h3>',
        )
        .replace(
          /^## (.*$)/gim,
          '<h2 class="text-2xl font-bold mb-4 gradient-text">$1</h2>',
        )
        .replace(
          /^# (.*$)/gim,
          '<h1 class="text-3xl font-bold mb-6 gradient-text">$1</h1>',
        )
        // Bold and italic
        .replace(
          /\*\*(.+?)\*\*/g,
          '<strong class="font-bold text-gray-900">$1</strong>',
        )
        .replace(/\*(.+?)\*/g, '<em class="italic text-gray-700">$1</em>')
        // Images with modern styling
        .replace(
          /!\[([^\]]*)\]\(([^)]*)\)/g,
          '<img src="$2" alt="$1" class="max-w-full h-auto rounded-xl shadow-lg my-6 hover:shadow-xl transition-shadow duration-300" />',
        )
        // Links with modern styling
        .replace(
          /\[([^\]]*)\]\(([^)]*)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline decoration-2 hover:decoration-blue-400 transition-all duration-200 font-medium">$1</a>',
        )
        // Code blocks with enhanced styling
        .replace(
          /```(\w+)?\n([\s\S]*?)```/g,
          '<div class="my-6"><pre class="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-6 rounded-xl overflow-x-auto shadow-lg border border-gray-700"><code class="text-sm font-mono leading-relaxed">$2</code></pre></div>',
        )
        // Inline code with modern styling
        .replace(
          /`([^`]+)`/g,
          '<code class="bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1.5 rounded-lg text-sm font-mono text-gray-800 border border-gray-300 shadow-sm">$1</code>',
        )
        // Blockquotes with modern styling
        .replace(
          /^> (.+)$/gm,
          '<blockquote class="border-l-4 border-blue-500 pl-6 py-3 my-4 bg-gradient-to-r from-blue-50 to-transparent rounded-r-lg italic text-gray-700">$1</blockquote>',
        )
        // Lists with modern styling
        .replace(/^\* (.+)$/gm, '<li class="mb-2 text-gray-700">$1</li>')
        .replace(
          /(<li.*<\/li>)/s,
          '<ul class="list-disc list-inside space-y-2 mb-6 pl-4">$1</ul>',
        )
        // Horizontal rule
        .replace(/^---$/gm, '<hr class="border-gray-300 my-8 border-t-2" />')
        // Line breaks and paragraphs
        .replace(/\n\n/g, '</p><p class="mb-6 text-gray-700 leading-relaxed">')
        .replace(/^\n/, '<p class="mb-6 text-gray-700 leading-relaxed">')
        .replace(/\n$/, "</p>")
        .replace(/\n/g, "<br />")
    );
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center glass-morphism p-12 rounded-2xl">
          <div className="text-6xl mb-6">🚫</div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            Room Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            This room doesn't exist or has been removed.
          </p>
          <Link href="/" className="modern-button-primary px-8 py-3">
            Back to Forums
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="glass-morphism p-8 rounded-2xl text-center">
          <div className="loading loading-spinner loading-lg text-blue-600 mb-4"></div>
          <p className="text-gray-800 font-medium">
            Loading amazing discussion...
          </p>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center glass-morphism p-12 rounded-2xl">
          <div className="text-6xl mb-6">📄</div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            Thread Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            This thread doesn't exist or has been removed.
          </p>
          <Link
            href={`/room/${roomId}`}
            className="modern-button-primary px-8 py-3"
          >
            Back to {room.name}
          </Link>
        </div>
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
              🏠 Home
            </Link>
            <span className="opacity-60">›</span>
            <Link
              href={`/category/${category.id}`}
              className="hover:text-white/80 transition-colors"
            >
              {category.name}
            </Link>
            <span className="opacity-60">›</span>
            <Link
              href={`/room/${roomId}`}
              className="hover:text-white/80 transition-colors"
            >
              {room.icon} {room.name}
            </Link>
            <span className="opacity-60">›</span>
            <span className="font-medium">{getThreadTitle(thread)}</span>
          </nav>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span className="text-6xl animate-float">{room.icon}</span>
              <div>
                <h1 className="text-4xl font-bold mb-2">{room.name}</h1>
                <p className="text-white/90 text-lg">{room.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Enhanced Error/Success Messages */}
        {error && (
          <div className="glass-morphism border-2 border-red-300 bg-red-50/90 text-red-800 p-6 rounded-xl mb-8 animate-slide-up">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="glass-morphism border-2 border-green-300 bg-green-50/90 text-green-800 p-6 rounded-xl mb-8 animate-slide-up">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Enhanced Thread Content */}
        <div className="modern-card modern-card-hover mb-8 animate-slide-up">
          <div className="p-8">
            {/* Enhanced Thread Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1">
                <h2 className="text-3xl font-bold gradient-text mb-4 leading-tight">
                  {getThreadTitle(thread)}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100/80 rounded-full">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    <span className="font-mono">
                      {thread.id.substring(0, 16)}...
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100/80 rounded-full">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {new Date(thread.created_at * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100/80 rounded-full">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span className="font-medium">{viewCount} views</span>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-100/80 rounded-full">
                    <svg
                      className="w-4 h-4 text-green-600"
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
                      {replyCount} {replyCount === 1 ? "reply" : "replies"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Author Profile Link */}
              <button
                onClick={() => setShowProfileModal(thread.pubkey)}
                className="modern-button-secondary px-4 py-2 flex items-center space-x-2 group"
              >
                <span>View Author</span>
                <svg
                  className="w-4 h-4 transform group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>

            {/* Enhanced Thread Body */}
            <div className="prose prose-lg max-w-none leading-relaxed text-gray-700">
              <div
                className="animate-fade-in"
                dangerouslySetInnerHTML={{
                  __html: formatContent(thread.content),
                }}
              />
            </div>

            {/* Enhanced Thread Tags */}
            <div className="mt-8 pt-8 border-t border-gray-200/50">
              <div className="flex flex-wrap gap-3">
                {thread.tags.map((tag, index) => {
                  if (
                    tag[0] &&
                    tag[1] &&
                    !["d", "title", "board", "published_at"].includes(tag[0])
                  ) {
                    return (
                      <span key={index} className="modern-badge-primary">
                        {tag[0]}: {tag[1]}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Reply Form */}
        {user && (
          <div className="modern-card mb-8 animate-slide-up">
            <div className="p-8">
              <h3 className="text-2xl font-bold gradient-text mb-6">
                💬 Post a Reply
              </h3>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Share your thoughts on this discussion..."
                rows={5}
                className="modern-input w-full resize-none focus-ring-green"
                disabled={isSubmittingReply}
              />
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => handleReply(thread)}
                  disabled={isSubmittingReply || !replyContent.trim()}
                  className="modern-button-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReply ? (
                    <div className="flex items-center space-x-3">
                      <div className="loading loading-spinner loading-sm"></div>
                      <span>Posting Reply...</span>
                    </div>
                  ) : (
                    "🚀 Post Reply"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {!user && (
          <div className="glass-morphism p-8 rounded-xl mb-8 text-center animate-slide-up">
            <div className="text-6xl mb-6">🔐</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Join the Conversation
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              You need to connect your Nostr account to reply to this thread and
              join the decentralized discussion.
            </p>
            <Link href="/" className="modern-button-primary px-8 py-3">
              🔗 Connect Nostr Account
            </Link>
          </div>
        )}

        {/* Enhanced Replies Section */}
        {replies.length > 0 && (
          <div className="modern-card animate-slide-up">
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <h3 className="text-2xl font-bold gradient-text">
                  💬 Discussion ({replyCount})
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>
              <EnhancedThreadView
                events={replies}
                onReply={handleReply}
                currentPubkey={user?.pubkey}
                threadId={threadId}
              />
            </div>
          </div>
        )}

        {replies.length === 0 && !loading && (
          <div className="glass-morphism p-12 rounded-xl text-center animate-slide-up">
            <div className="text-8xl mb-6 opacity-60 animate-pulse">💭</div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              No replies yet
            </h3>
            <p className="text-gray-600 text-lg mb-8">
              Be the first to share your thoughts on this interesting
              discussion!
            </p>
            <div className="text-center">
              <span className="text-2xl">✨</span>
            </div>
          </div>
        )}

        {/* Enhanced Profile Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-morphism rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-in">
              <UserProfile
                pubkey={showProfileModal}
                onClose={() => setShowProfileModal(null)}
                isModal={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
