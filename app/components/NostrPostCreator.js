"use client";

import React, { useState, useCallback } from "react";
import {
  publishToPool,
  getPool,
  generatePrivateKey,
  getPublicKey,
  nip19Encode,
  verifyEvent,
} from "../lib/nostrClient";

export default function NostrPostCreator({
  onPostCreated,
  initialContent = "",
  placeholder = "Create a new post...",
  buttonLabel = "Create Post",
}) {
  const [pool, setPool] = useState(null);
  const [content, setContent] = useState(initialContent);
  const [privKey, setPrivKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Get pool instance
  React.useEffect(() => {
    const initPool = async () => {
      const { initializePool } = await import("../lib/nostrClient");
      const poolInstance = await initPool();
      setPool(poolInstance);
    };
    initPool();
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!content.trim()) {
        alert("Please enter some content");
        return;
      }

      if (!privKey.trim()) {
        alert("Please provide a private key");
        return;
      }

      if (!pool) {
        alert("Not connected to Nostr");
        return;
      }

      setIsSubmitting(true);

      try {
        const event = await publishToPool(
          pool,
          undefined,
          privKey.trim(),
          content.trim(),
          { kind: 1, tags: [] },
        );

        setContent("");
        if (onPostCreated) {
          onPostCreated(event);
        }

        alert("Post created successfully!");
      } catch (error) {
        console.error("Failed to create post:", error);
        alert("Failed to create post: " + error.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [content, privKey, pool, onPostCreated],
  );

  const handleGenerateKey = useCallback(() => {
    const newKey = generatePrivateKey();
    setPrivKey(newKey);
    alert("New private key generated! Save it safely.");
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">{buttonLabel}</h3>

      {/* Key Management */}
      <div className="mb-4">
        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="text-sm text-blue-600 hover:text-blue-800 mb-2"
        >
          {showKeyInput ? "Hide" : "Show"} Private Key Settings
        </button>

        {showKeyInput && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Key
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="password"
                className="input input-sm input-bordered flex-1"
                placeholder="Enter private key"
                value={privKey}
                onChange={(e) => setPrivKey(e.target.value)}
              />
              <button
                onClick={handleGenerateKey}
                className="btn btn-sm btn-outline"
              >
                Generate
              </button>
            </div>
            {privKey && (
              <div className="text-xs text-gray-600">
                Pubkey: <code>{getPublicKey(privKey).slice(0, 16)}...</code>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            className="textarea textarea-bordered w-full"
            rows={4}
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !content.trim() || !pool}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Publishing...
              </>
            ) : (
              buttonLabel
            )}
          </button>
          <button
            type="button"
            onClick={() => setContent("")}
            className="btn btn-ghost"
            disabled={isSubmitting}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
