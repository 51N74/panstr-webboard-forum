"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNostrAuth } from "../../context/NostrAuthContext";
import { getRoomById, getCategoryByRoomId } from "../../data/boardsConfig";
import {
  initializePool,
  publishThread,
  initializeBrowserExtension,
  generateThreadId,
} from "../../lib/nostrClient";

export default function CreateThreadPage({ roomId }) {
  const router = useRouter();
  const { user } = useNostrAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const room = getRoomById(roomId);
  const category = getCategoryByRoomId(roomId);

  useEffect(() => {
    if (!room) {
      router.push("/");
      return;
    }
  }, [room, router]);

  useEffect(() => {
    if (!user) {
      setError("Please connect your Nostr account to create a thread.");
    } else {
      setError("");
    }
  }, [user]);

  const handlePublish = async () => {
    // Validation
    if (!user) {
      setError("Please connect your Nostr account to create a thread.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError("Please fill in both title and content.");
      return;
    }

    if (title.length > 200) {
      setError("Title must be less than 200 characters.");
      return;
    }

    setIsPublishing(true);
    setError("");

    try {
      // Initialize browser extension if available
      try {
        await initializeBrowserExtension();
      } catch (e) {
        console.log("Browser extension not available or failed to initialize");
      }

      // Initialize relay pool
      const pool = await initializePool();

      // Generate thread ID
      const threadId = generateThreadId(title);

      // Get private key from auth context if using private key auth
      const storedHexKey =
        typeof window !== "undefined"
          ? localStorage.getItem("nostr_private_key")
          : null;

      // Convert hex string to Uint8Array
      let privateKeyBytes = null;
      if (storedHexKey) {
        privateKeyBytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          privateKeyBytes[i] = parseInt(storedHexKey.substr(i * 2, 2), 16);
        }
      }

      // Use the properly converted private key (Uint8Array)
      if (!privateKeyBytes) {
        throw new Error("No private key available for signing");
      }

      const signedEvent = await publishThread(
        pool,
        undefined,
        privateKeyBytes,
        {
          threadId,
          title,
          board: roomId, // Use roomId as the board identifier
          content,
          published_at: Math.floor(Date.now() / 1000),
        },
      );

      if (signedEvent && signedEvent.id) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/room/${roomId}`);
        }, 2000);
      } else {
        throw new Error("Failed to publish thread - no event returned");
      }
    } catch (err) {
      console.error("Failed to publish thread:", err);
      setError(`Failed to publish: ${err.message || err}`);
    } finally {
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
            <span>Create Thread</span>
          </nav>

          <div className="flex items-center space-x-4">
            <span className="text-4xl">{room.icon}</span>
            <div>
              <h1 className="text-3xl font-bold">Create New Thread</h1>
              <p className="text-white/90">
                Share your thoughts with the {room.name} community
              </p>
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
            <span>Thread published successfully! Redirecting...</span>
          </div>
        )}

        {/* User Status */}
        {!user && (
          <div className="alert alert-warning mb-6">
            <svg
              className="w-6 h-6 shrink-0 stroke-current"
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
            <span>
              You need to connect your Nostr account to create threads.
            </span>
            <div className="flex-1"></div>
            <Link href="/" className="btn btn-sm btn-warning">
              Connect Account
            </Link>
          </div>
        )}

        <div className="bg-base-100 rounded-lg shadow-sm">
          <div className="p-6 border-b border-base-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{room.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold">{room.name}</h2>
                  <p className="text-sm text-base-content/70">New Thread</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`btn btn-sm ${previewMode ? "btn-primary" : "btn-outline"}`}
              >
                {previewMode ? "Edit" : "Preview"}
              </button>
            </div>
          </div>

          {!previewMode ? (
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Thread Title
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter an engaging title for your thread..."
                  className="w-full px-4 py-3 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={200}
                  disabled={!user}
                />
                <div className="mt-1 text-xs text-base-content/60 text-right">
                  {title.length}/200
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Content
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your thread content here..."
                  rows={12}
                  className="w-full px-4 py-3 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  disabled={!user}
                ></textarea>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-base-content/60">
                    Supports Markdown: **bold**, *italic*, # headers
                  </div>
                  <div className="text-xs text-base-content/60">
                    {content.length} characters
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-base-300">
                <Link href={`/room/${roomId}`} className="btn btn-outline">
                  Cancel
                </Link>
                <button
                  onClick={handlePublish}
                  disabled={
                    isPublishing || !user || !title.trim() || !content.trim()
                  }
                  className="btn btn-primary"
                >
                  {isPublishing ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading loading-spinner loading-sm"></div>
                      <span>Publishing...</span>
                    </div>
                  ) : (
                    "Publish Thread"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="prose max-w-none">
                {title && <h1 className="text-3xl font-bold mb-4">{title}</h1>}

                {content && (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: `<p class="mb-4">${formatContent(content)}</p>`,
                    }}
                  />
                )}

                {!title && !content && (
                  <div className="text-center py-12 text-base-content/50">
                    <div className="text-lg mb-2">No content yet</div>
                    <div className="text-sm">
                      Add a title and content to see the preview
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-base-300">
                <button
                  onClick={() => setPreviewMode(false)}
                  className="btn btn-outline"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handlePublish}
                  disabled={
                    isPublishing || !user || !title.trim() || !content.trim()
                  }
                  className="btn btn-primary"
                >
                  {isPublishing ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading loading-spinner loading-sm"></div>
                      <span>Publishing...</span>
                    </div>
                  ) : (
                    "Publish Thread"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 bg-base-100 rounded-lg p-6">
          <h3 className="font-semibold mb-3 flex items-center">
            <span className="text-xl mr-2">💡</span>
            Tips for Great Threads
          </h3>
          <ul className="space-y-2 text-sm text-base-content/70">
            <li>• Use a clear and descriptive title</li>
            <li>• Break your content into paragraphs for readability</li>
            <li>• Use Markdown to format your text</li>
            <li>• Be respectful and constructive</li>
            <li>• Check your content before publishing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
