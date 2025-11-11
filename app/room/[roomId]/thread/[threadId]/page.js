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
    // Basic markdown rendering
    return content
      .replace(
        /^### (.*$)/gim,
        '<h3 class="text-lg font-semibold mb-2">$1</h3>',
      )
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(
        /!\[([^\]]*)\]\(([^)]*)\)/g,
        '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />',
      )
      .replace(
        /\[([^\]]*)\]\(([^)]*)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>',
      )
      .replace(
        /```(\w+)?\n([\s\S]*?)```/g,
        '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>',
      )
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>',
      )
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^\n/, '<p class="mb-4">')
      .replace(/\n$/, "</p>")
      .replace(/\n/g, "<br />");
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Room Not Found</h2>
          <Link href="/" className="btn btn-primary">
            Back to Forums
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Thread Not Found</h2>
          <Link href={`/room/${roomId}`} className="btn btn-primary">
            Back to {room.name}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className={`bg-gradient-to-r ${room.gradient} text-white p-8`}>
        <div className="container mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm mb-4 opacity-90">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span>›</span>
            <Link href={`/category/${category.id}`} className="hover:underline">
              {category.name}
            </Link>
            <span>›</span>
            <Link href={`/room/${roomId}`} className="hover:underline">
              {room.name}
            </Link>
            <span>›</span>
            <span>{getThreadTitle(thread)}</span>
          </nav>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">{room.icon}</span>
              <div>
                <h1 className="text-3xl font-bold">{room.name}</h1>
                <p className="text-white/90">{room.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error mb-6">
            <svg
              className="w-6 h-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-6">
            <svg
              className="w-6 h-6 shrink-0 stroke-current"
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
            <span>{success}</span>
          </div>
        )}

        {/* Thread Content */}
        <div className="bg-base-100 rounded-lg shadow-sm mb-6">
          <div className="p-6">
            {/* Thread Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-base-content mb-2">
                  {getThreadTitle(thread)}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-base-content/60">
                  <span>Thread ID: {thread.id.substring(0, 16)}...</span>
                  <span>•</span>
                  <span>
                    {new Date(thread.created_at * 1000).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>{viewCount} views</span>
                  <span>•</span>
                  <span>
                    {replyCount} {replyCount === 1 ? "reply" : "replies"}
                  </span>
                </div>
              </div>

              {/* Author Profile Link */}
              <button
                onClick={() => setShowProfileModal(thread.pubkey)}
                className="btn btn-ghost btn-sm flex items-center space-x-2"
              >
                <span>View Author</span>
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>

            {/* Thread Body */}
            <div className="prose max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: formatContent(thread.content),
                }}
              />
            </div>

            {/* Thread Tags */}
            <div className="mt-6 pt-6 border-t border-base-300">
              <div className="flex flex-wrap gap-2">
                {thread.tags.map((tag, index) => {
                  if (
                    tag[0] &&
                    tag[1] &&
                    !["d", "title", "board", "published_at"].includes(tag[0])
                  ) {
                    return (
                      <span
                        key={index}
                        className="badge badge-outline badge-sm"
                      >
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

        {/* Reply Form */}
        {user && (
          <div className="bg-base-100 rounded-lg shadow-sm mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Post a Reply</h3>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply here..."
                rows={4}
                className="w-full px-4 py-3 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                disabled={isSubmittingReply}
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => handleReply(thread)}
                  disabled={isSubmittingReply || !replyContent.trim()}
                  className="btn btn-primary"
                >
                  {isSubmittingReply ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading loading-spinner loading-sm"></div>
                      <span>Posting...</span>
                    </div>
                  ) : (
                    "Post Reply"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {!user && (
          <div className="bg-base-100 rounded-lg shadow-sm mb-6">
            <div className="p-6 text-center">
              <p className="text-base-content/70 mb-4">
                You need to connect your Nostr account to reply to this thread.
              </p>
              <Link href="/" className="btn btn-primary">
                Connect Account
              </Link>
            </div>
          </div>
        )}

        {/* Replies Section */}
        {replies.length > 0 && (
          <div className="bg-base-100 rounded-lg shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Replies ({replyCount})
              </h3>
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
          <div className="bg-base-100 rounded-lg shadow-sm">
            <div className="p-6 text-center text-base-content/50">
              <div className="text-6xl mb-4 opacity-50">💬</div>
              <h3 className="text-lg font-medium mb-2">No replies yet</h3>
              <p>Be the first to reply to this thread!</p>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {showProfileModal && (
          <UserProfile
            pubkey={showProfileModal}
            onClose={() => setShowProfileModal(null)}
            isModal={true}
          />
        )}
      </div>
    </div>
  );
}
