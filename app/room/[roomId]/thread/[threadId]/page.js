"use client";

import { useState, useEffect, useRef } from "react";
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
  markdownToHtml,
  htmlToMarkdown,
  nip19Decode,
} from "../../../../lib/nostrClient";
import EnhancedThreadView from "../../../../components/enhanced/threading/EnhancedThreadView";
import db, { liveZapsForEvent } from "../../../../lib/storage/indexedDB";
import UserProfile from "../../../../components/profiles/UserProfile";
import ReactionButton from "../../../../components/enhanced/reactions/ReactionButton";
import ZapButton from "../../../../components/enhanced/zaps/ZapButton";
import ZapReceiptList from "../../../../components/enhanced/zaps/ZapReceiptList";
import RichTextEditor from "../../../../components/RichTextEditor";

export default function ThreadDetailPage() {
  const router = useRouter();
  const params = useParams();
  let { roomId, threadId } = params;

  // Handle NIP-19 encoded identifiers
  if (threadId.startsWith("n") || threadId.startsWith("note")) {
    try {
      const decoded = nip19Decode(threadId);
      if (decoded.type === "nevent") {
        threadId = decoded.data.id;
      } else if (decoded.type === "note") {
        threadId = decoded.data;
      }
    } catch (e) {
      console.warn("Failed to decode NIP-19 threadId:", e);
    }
  }

  if (roomId.startsWith("n")) {
    try {
      const decoded = nip19Decode(roomId);
      if (decoded.type === "naddr") {
        roomId = decoded.data.identifier;
      }
    } catch (e) {
      console.warn("Failed to decode NIP-19 roomId:", e);
    }
  }

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
  const [zapReceipts, setZapReceipts] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(null);
  const editorApiRef = useRef(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const room = getRoomById(roomId);
  const category = getCategoryByRoomId(roomId);

  useEffect(() => {
    if (!room) {
      router.push("/");
      return;
    }
    fetchThreadData();

    // Subscribe to live zaps
    const zapSub = liveZapsForEvent(threadId).subscribe((zaps) => {
      setZapReceipts(zaps || []);
    });

    return () => {
      if (zapSub && typeof zapSub.unsubscribe === 'function') {
        zapSub.unsubscribe();
      }
    };
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

      // Use all fetched reply events
      const threadReplies = replyEvents;

      // Optimize thread structure for display
      setReplies(threadReplies);
      setReplyCount(threadReplies.length);
    } catch (err) {
      console.error("Error fetching thread data:", err);
      setError("Failed to load thread");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFromEditor = async (file, uploadId) => {
    const id = Math.random().toString(36).slice(2);
    setImages((prev) => [
      ...prev,
      {
        id,
        file,
        uploading: true,
        progress: 0,
        url: null,
        uploadId,
      },
    ]);
    setUploading(true);

    try {
      const result = await uploadFileNip96(file);
      
      setImages((prev) =>
        prev.map((it) =>
          it.uploadId === uploadId
            ? { ...it, uploading: false, progress: 100, url: result.url }
            : it,
        ),
      );

      if (editorApiRef.current) {
        editorApiRef.current.replaceImageSrc(uploadId, result.url);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const hasValidContent = (content) => {
    const plainText = content.replace(/<[^>]+>/g, "").trim();
    return plainText.length > 0 || content.includes("<img");
  };

  const handleReply = async (parentEvent, content = null) => {
    if (!user) {
      setError("Please connect your Nostr account to reply");
      return;
    }

    // Convert HTML from editor to Markdown for Nostr NIP-23 compatibility
    const htmlContent = content || replyContent;
    const markdownContent = htmlToMarkdown(htmlContent);

    if (!hasValidContent(markdownContent)) {
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

      // Create reply event with Markdown content
      const replyEvent = createReplyEvent(
        parentEvent,
        markdownContent,
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

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-12">
          <div className="text-6xl mb-6">🚫</div>
          <h2 className="text-3xl font-bold mb-4 text-primary">
            Room Not Found
          </h2>
          <p className="text-secondary mb-8">
            This room doesn't exist or has been removed.
          </p>
          <Link href="/" className="btn-primary px-8 py-3">
            Back to Forums
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="p-8 text-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent animate-spin rounded-full mx-auto mb-4"></div>
          <p className="text-primary font-medium">
            Loading amazing discussion...
          </p>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-12">
          <div className="text-6xl mb-6">📄</div>
          <h2 className="text-3xl font-bold mb-4 text-primary">
            Thread Not Found
          </h2>
          <p className="text-secondary mb-8">
            This thread doesn't exist or has been removed.
          </p>
          <Link
            href={`/room/${roomId}`}
            className="btn-primary px-8 py-3"
          >
            Back to {room.name}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Room Header - Standardized */}
      <div className="bg-surface-muted border-b border-surface-border">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8 lg:py-12">
          <nav className="flex items-center gap-2 text-[10px] font-bold text-secondary uppercase tracking-widest mb-6 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="text-surface-border">/</span>
            <Link href={`/room/${roomId}`} className="hover:text-primary">{room.name}</Link>
            <span className="text-surface-border">/</span>
            <span className="text-primary truncate max-w-[200px]">{getThreadTitle(thread)}</span>
          </nav>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-surface border border-surface-border rounded-xl flex items-center justify-center text-2xl lg:text-3xl shadow-sm">
              {room.icon}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl lg:text-3xl font-black tracking-tighter mb-1 lg:mb-2 truncate">{room.name}</h1>
              <p className="text-[11px] lg:text-sm text-secondary max-w-xl line-clamp-1">{room.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 lg:py-12">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-error/5 border border-error/20 text-error p-4 rounded-lg mb-8 text-xs font-bold uppercase tracking-wide animate-fade-in flex items-center gap-3">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success/5 border border-success/20 text-success p-4 rounded-lg mb-8 text-xs font-bold uppercase tracking-wide animate-fade-in flex items-center gap-3">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {success}
          </div>
        )}

        {/* Main Thread Content */}
        <article className="mb-12 animate-slide-up">
          <header className="mb-8">
            <h1 className="text-3xl lg:text-5xl font-black tracking-tight text-primary mb-6 leading-[1.1]">
              {getThreadTitle(thread)}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-secondary pb-6 border-b border-surface-border">
              <div className="flex items-center gap-2 bg-surface-muted px-2 py-1 rounded">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>{new Date(thread.created_at * 1000).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-muted px-2 py-1 rounded">
                <span className="material-symbols-outlined text-sm">visibility</span>
                <span>{viewCount} Views</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-muted px-2 py-1 rounded">
                <span className="material-symbols-outlined text-sm">chat</span>
                <span>{replyCount} Replies</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-muted px-2 py-1 rounded font-mono lowercase tracking-normal text-[9px] opacity-70">
                <span>{thread.id.substring(0, 12)}...</span>
              </div>
            </div>
          </header>

          <div className="prose prose-lg dark:prose-invert max-w-none mb-10">
            <div
              className="animate-fade-in text-primary leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: markdownToHtml(thread.content),
              }}
            />
          </div>

          <footer className="pt-8 border-t border-surface-border">
            <div className="flex flex-wrap gap-2 mb-8">
              {thread.tags.map((tag, index) => {
                if (tag[0] === "t" && tag[1]) {
                  return (
                    <span key={index} className="px-2 py-1 bg-accent/5 text-accent text-[9px] font-black uppercase tracking-widest rounded border border-accent/10">
                      #{tag[1]}
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6 bg-surface-muted/50 rounded-xl px-6 border border-surface-border">
              <div className="flex items-center gap-8">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black text-secondary uppercase tracking-[0.2em]">Reaction</span>
                  <ReactionButton event={thread} currentPubkey={user?.pubkey} />
                </div>
                <div className="w-px h-8 bg-surface-border"></div>
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black text-secondary uppercase tracking-[0.2em]">Support</span>
                  <ZapButton targetEvent={thread} recipientPubkey={thread.pubkey} currentPubkey={user?.pubkey} />
                </div>
              </div>

              <button
                onClick={() => setShowProfileModal(thread.pubkey)}
                className="flex items-center gap-3 group text-left"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest">Thread Author</div>
                  <div className="text-xs text-secondary font-medium">View Profile →</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center text-lg shadow-sm group-hover:border-accent transition-colors overflow-hidden">
                  <span className="material-symbols-outlined text-secondary group-hover:text-accent transition-colors">person</span>
                </div>
              </button>
            </div>

            <ZapReceiptList eventId={threadId} zaps={zapReceipts} />
          </footer>
        </article>

        {/* Reply Section */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Discussion</h3>
            <div className="flex-1 h-px bg-surface-border"></div>
          </div>

          {user ? (
            <div className="mb-12 bg-surface border border-surface-border rounded-xl p-6 lg:p-8 shadow-soft">
              <h4 className="text-lg font-bold text-primary mb-6">Post a Reply</h4>
              <div className="mb-4">
                <RichTextEditor
                  ref={editorApiRef}
                  value={replyContent}
                  onChange={setReplyContent}
                  disabled={isSubmittingReply}
                  onUpload={handleUploadFromEditor}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                <div className="text-[9px] font-bold text-secondary uppercase tracking-widest opacity-50">
                  Supported: JPG, PNG, GIF, WebP
                </div>
                <button
                  onClick={() => handleReply(thread)}
                  disabled={isSubmittingReply || !hasValidContent(replyContent)}
                  className="btn-primary px-8 h-12 text-[11px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50"
                >
                  {isSubmittingReply ? "Publishing..." : "Post Reply"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-muted border border-dashed border-surface-border p-10 rounded-xl text-center mb-12">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-lg font-bold text-primary mb-2">Join the Conversation</h3>
              <p className="text-sm text-secondary mb-6">You need to connect your Nostr account to participate.</p>
              <button 
                onClick={() => setShowLoginModal(true)}
                className="btn-primary px-8 h-12 text-[11px] font-black uppercase tracking-widest shadow-lg"
              >
                Connect Identity
              </button>
            </div>
          )}

          {replies.length > 0 ? (
            <EnhancedThreadView
              events={replies}
              onReply={handleReply}
              currentPubkey={user?.pubkey}
              threadId={threadId}
            />
          ) : !loading && (
            <div className="py-20 text-center">
              <div className="text-5xl mb-6 opacity-20">💬</div>
              <h3 className="text-lg font-bold text-primary mb-2">No replies yet</h3>
              <p className="text-sm text-secondary">Be the first to share your thoughts!</p>
            </div>
          )}
        </section>

        {/* Profile Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-modal p-4">
            <div className="bg-surface rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in shadow-2xl border border-surface-border">
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
