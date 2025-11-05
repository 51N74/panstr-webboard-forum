"use client";

import { useState, useEffect } from "react";
import { useNostr } from "../context/NostrContext";
import { formatPubkey, initializePool, queryEvents } from "../lib/nostrClient";
import Link from "next/link";

export default function SiamstrTestPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("latest");
  const { getEvents } = useNostr();

  useEffect(() => {
    fetchSiamstrNotes();
  }, [sortBy]);

  const fetchSiamstrNotes = async () => {
    setLoading(true);
    setError(null);

    try {
      // Initialize pool and query for notes with #siamstr hashtag
      const pool = await initializePool();

      const filters = {
        kinds: [1], // Text notes
        "#t": ["siamstr"], // Looking for #siamstr hashtag
        limit: 50,
      };

      console.log("Fetching notes with #siamstr hashtag...");
      let events = await queryEvents(pool, undefined, filters);

      // Apply sorting
      switch (sortBy) {
        case "latest":
          events.sort((a, b) => b.created_at - a.created_at);
          break;
        case "oldest":
          events.sort((a, b) => a.created_at - b.created_at);
          break;
        case "popular":
          // Sort by content length as a simple popularity metric
          events.sort((a, b) => b.content.length - a.content.length);
          break;
      }

      console.log(`Found ${events.length} notes with #siamstr`);
      setNotes(events);
    } catch (err) {
      console.error("Error fetching siamstr notes:", err);
      setError(
        "Failed to fetch notes with #siamstr hashtag. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (content) => {
    // Simple text formatting - highlight hashtags
    return content.replace(/#(\w+)/g, '<span class="text-blue-500">#$1</span>');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">🏴</span>
              <div>
                <h1 className="text-3xl font-bold">#siamstr Test Room</h1>
                <p className="text-white/90">
                  Fetching notes with #siamstr hashtag from Nostr network
                </p>
              </div>
            </div>
            <button
              onClick={fetchSiamstrNotes}
              className="btn bg-white text-teal-600 hover:bg-gray-100 border-none"
              disabled={loading}
            >
              {loading ? "Loading..." : "🔄 Refresh"}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Sort by:</span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                disabled={loading}
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="popular">Most Content</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-base-content/70">
            {notes.length} note{notes.length !== 1 ? "s" : ""} with #siamstr
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="alert alert-error mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && notes.length === 0 && !error && (
          <div className="text-center py-12 bg-base-100 rounded-lg">
            <div className="text-6xl mb-4 opacity-50">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No notes found</h3>
            <p className="text-base-content/70 mb-6">
              No notes with #siamstr hashtag found on connected relays.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-base-content/60">
                <strong>Suggestions:</strong>
              </p>
              <ul className="text-sm text-base-content/60 text-left max-w-md mx-auto">
                <li>• Try creating a note with #siamstr hashtag</li>
                <li>• Check if relays are connected</li>
                <li>• Try refreshing the page</li>
              </ul>
            </div>
          </div>
        )}

        {/* Notes List */}
        {!loading && notes.length > 0 && (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-base-100 rounded-lg p-6 shadow-md"
              >
                {/* Note Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded-full w-10 h-10">
                        <span className="text-xs">👤</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">
                        {formatPubkey(note.pubkey, "short")}
                      </div>
                      <div className="text-xs text-base-content/60">
                        {formatTime(note.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-base-content/60">
                    Kind: {note.kind}
                  </div>
                </div>

                {/* Note Content */}
                <div
                  className="mb-4 text-base-content"
                  dangerouslySetInnerHTML={{
                    __html: formatContent(note.content),
                  }}
                />

                {/* Note Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {note.tags
                      .filter((tag) => tag[0] === "t")
                      .map((tag, index) => (
                        <span
                          key={index}
                          className="badge badge-primary badge-sm"
                        >
                          #{tag[1]}
                        </span>
                      ))}
                  </div>
                )}

                {/* Note Footer */}
                <div className="flex items-center justify-between text-xs text-base-content/60">
                  <div>
                    ID:{" "}
                    <span className="font-mono">
                      {note.id.substring(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span>📝 {note.content.length} chars</span>
                    <span>🏷️ {note.tags?.length || 0} tags</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Debug Info */}
        {!loading && (
          <div className="mt-8 p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Information</h3>
            <div className="text-xs space-y-1">
              <p>• Filter: kinds: [1], #t: ['siamstr'], limit: 50</p>
              <p>• Total Notes Found: {notes.length}</p>
              <p>• Default Relays: 7 relays configured</p>
              <p>• Last Updated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link href="/" className="btn btn-outline">
            🏠 Back to Home
          </Link>
          <Link href="/_forums/general" className="btn btn-outline">
            💬 General Forum
          </Link>
        </div>
      </div>
    </div>
  );
}
