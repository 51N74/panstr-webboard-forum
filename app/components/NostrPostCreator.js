"use client";

import React, { useState, useCallback } from "react";
import {
  publishToPool,
  generatePrivateKey,
  getPublicKey,
} from "../lib/nostrClient";

/**
 * NostrPostCreator - Panstr Minimal
 * Streamlined editor for publishing new content
 */

export default function NostrPostCreator({
  onPostCreated,
  initialContent = "",
  placeholder = "What's on your mind?",
  buttonLabel = "Publish",
}) {
  const [pool, setPool] = useState(null);
  const [content, setContent] = useState(initialContent);
  const [privKey, setPrivKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);

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
      if (!content.trim() || !privKey.trim() || !pool) return;

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
        if (onPostCreated) onPostCreated(event);
      } catch (error) {
        console.error("Failed to create post:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [content, privKey, pool, onPostCreated],
  );

  return (
    <div className="bg-white border border-surface-border rounded-lg overflow-hidden animate-fade-in">
      <header className="px-4 py-3 border-b border-surface-border bg-surface-muted flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary">{buttonLabel}</h3>
        <button 
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="text-[10px] font-bold text-accent uppercase tracking-tight hover:underline"
        >
          {showKeyInput ? "Hide Key" : "Auth Settings"}
        </button>
      </header>

      <div className="p-4">
        {showKeyInput && (
          <div className="mb-4 p-3 bg-surface-muted rounded border border-surface-border animate-slide-up">
            <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Private Key (nsec or hex)</label>
            <div className="flex gap-2">
              <input 
                type="password"
                className="input input-sm flex-1 font-mono text-xs"
                placeholder="nsec1..."
                value={privKey}
                onChange={(e) => setPrivKey(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setPrivKey(generatePrivateKey())}
                className="btn-secondary px-3 py-1 text-[10px] font-bold uppercase rounded"
              >
                Gen
              </button>
            </div>
            {privKey && (
              <div className="mt-2 text-[9px] font-mono text-secondary truncate">
                ID: {getPublicKey(privKey)}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="input w-full min-h-[120px] resize-none text-sm leading-relaxed placeholder:text-secondary/40"
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-between pt-2 border-t border-surface-border/50">
            <div className="text-[10px] font-bold text-secondary uppercase tracking-tighter">
              Markdown Supported
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContent("")}
                className="btn-ghost px-4 py-2 text-xs font-bold uppercase"
                disabled={isSubmitting}
              >
                Clear
              </button>
              <button
                type="submit"
                className="btn-primary px-6 py-2 text-xs font-bold uppercase rounded shadow-minimal disabled:bg-secondary disabled:shadow-none"
                disabled={isSubmitting || !content.trim() || !privKey.trim() || !pool}
              >
                {isSubmitting ? "Syncing..." : buttonLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
