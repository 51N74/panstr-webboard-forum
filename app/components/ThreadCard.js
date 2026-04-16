"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useNostr } from "../context/NostrContext";
import { useNostrAuth } from "../context/NostrAuthContext";
import { useNostrLists } from "../context/NostrListsContext";
import {
  initializePool,
  liveSubscribe,
  verifyZapReceipt,
} from "../lib/nostrClient";
import db, { liveZapsForEvent } from "../lib/storage/indexedDB";
import ReportModal from "./ReportModal";
import Toast, { useToast } from "./Toast";

/**
 * ThreadCard Component - Panstr Minimal
 * Focused on content readability and clean hierarchy
 */

export default function ThreadCard({ thread, roomId }) {
  const { getProfile } = useNostr();
  const { user } = useNostrAuth();
  const { isMuted, isBookmarked, updateMuteList, updateBookmarkList } = useNostrLists();
  const { success: showSuccess, error: showError, toasts, removeToast } = useToast();
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [zapTotal, setZapTotal] = useState(0);
  const zapDbSubRef = useRef(null);
  const poolSubRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const fetchAuthorAndSubscribeZaps = async () => {
      try {
        if (thread.pubkey) {
          const profile = await getProfile(thread.pubkey);
          if (mounted) setAuthor(profile);
        }
      } catch (err) {
        console.warn("ThreadCard: failed to fetch author", err);
      } finally {
        if (mounted) setLoading(false);
      }

      try {
        if (db && db.getZapTotalForEvent) {
          const summary = await db.getZapTotalForEvent(thread.id);
          if (mounted) setZapTotal(summary?.totalAmount || 0);
        }
      } catch (err) {}

      try {
        if (zapDbSubRef.current) {
          zapDbSubRef.current.unsubscribe();
          zapDbSubRef.current = null;
        }
        const dbSub = liveZapsForEvent(thread.id).subscribe((zaps) => {
          const sum = (zaps || []).reduce((s, z) => s + (z.amount || 0), 0);
          if (mounted) setZapTotal(sum);
        });
        zapDbSubRef.current = dbSub;
      } catch (err) {}

      try {
        const pool = await initializePool();
        const sub = liveSubscribe(
          pool,
          undefined,
          [{ kinds: [9735], "#e": [thread.id], limit: 50 }],
          async (event) => {
            const verification = verifyZapReceipt(event);
            if (verification && verification.isValid && db && db.addZapReceipt) {
              await db.addZapReceipt({
                eventId: verification.eventId || thread.id,
                senderPubkey: verification.sender || null,
                recipientPubkey: verification.recipient || null,
                amount: verification.amount || 0,
                bolt11: verification.bolt11 || null,
                preimage: verification.preimage || null,
                timestamp: Date.now(),
              });
            }
          },
          { dedupe: true, keepAlive: true, heartbeatMs: 30 * 1000 },
        );
        poolSubRef.current = sub;
      } catch (err) {}
    };

    fetchAuthorAndSubscribeZaps();

    return () => {
      mounted = false;
      if (zapDbSubRef.current) zapDbSubRef.current.unsubscribe();
      if (poolSubRef.current) poolSubRef.current.unsubscribe();
    };
  }, [thread.pubkey, getProfile, thread.id]);

  const getThreadTitle = () => {
    const titleTag = thread.tags.find((tag) => tag[0] === "title");
    if (titleTag && titleTag[1]) return titleTag[1];
    const lines = thread.content.split("\n").filter((line) => line.trim());
    return lines.length > 0 ? lines[0].replace(/^#+\s*/, "").substring(0, 100) : "Untitled";
  };

  const getThreadTags = () => {
    if (!thread.tags) return [];
    return thread.tags.filter((tag) => tag[0] === "t" && tag[1]).map((tag) => tag[1]);
  };

  const formatTimeAgo = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (isMuted('p', thread.pubkey)) return null;

  const handleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateBookmarkList('e', thread.id, isBookmarked('e', thread.id) ? 'remove' : 'add');
  };

  return (
    <article className="group relative py-6 lg:py-8 border-b border-surface-border transition-colors hover:bg-surface-muted/30 px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-lg">
      <Link href={`/room/${roomId}/thread/${thread.id}`} className="block">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-muted flex-shrink-0 border border-surface-border">
            {author?.picture ? (
              <img src={author.picture} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold uppercase">
                {author?.name?.[0] || "?"}
              </div>
            )}
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-primary truncate max-w-[100px] sm:max-w-[150px]">
            {author?.name || author?.display_name || "Anonymous"}
          </span>
          {author?.nip05Verified && (
            <span className="material-symbols-outlined text-[12px] sm:text-[14px] text-accent">verified</span>
          )}
          <span className="text-[10px] text-secondary ml-auto font-medium uppercase tracking-tight">
            {formatTimeAgo(thread.created_at)}
          </span>
        </div>

        <h3 className="text-lg lg:text-xl font-bold text-primary mb-1.5 sm:mb-2 leading-tight tracking-tight group-hover:text-accent transition-colors line-clamp-2">
          {getThreadTitle()}
        </h3>

        <p className="text-xs sm:text-sm text-secondary line-clamp-2 leading-relaxed mb-3 sm:mb-4">
          {thread.content.split("\n").slice(1).join(" ").substring(0, 180)}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-1.5 text-secondary">
              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">chat_bubble</span>
              <span className="text-[10px] sm:text-[11px] font-bold">
                {thread.tags.find(t => t[0] === 'reply_count')?.[1] || 0}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-secondary">
              <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-warning">bolt</span>
              <span className="text-[10px] sm:text-[11px] font-bold">{zapTotal || 0}</span>
            </div>
            <div className="hidden xs:flex items-center gap-1.5">
              {getThreadTags().slice(0, 1).map(tag => (
                <span key={tag} className="text-[9px] sm:text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/5 px-1.5 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleBookmark}
              className={`p-1.5 rounded-md transition-colors ${isBookmarked('e', thread.id) ? 'text-warning bg-warning/10' : 'text-secondary hover:bg-surface-muted'}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isBookmarked('e', thread.id) ? 'bookmark_added' : 'bookmark'}
              </span>
            </button>
            <button 
              className="p-1.5 text-secondary hover:bg-error/10 hover:text-error rounded-md transition-colors"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowReportModal(true); }}
            >
              <span className="material-symbols-outlined text-[18px]">flag</span>
            </button>
          </div>
        </div>
      </Link>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={async ({ reason, evidence }) => {
          if (db && db.addReport) {
            await db.addReport({ eventId: thread.id, reporterPubkey: user?.pubkey, reason, evidence, createdAt: Date.now() });
          }
          setShowReportModal(false);
          showSuccess('Report submitted');
        }}
        eventId={thread.id}
        eventType="thread"
      />
      
      <Toast
        message={toasts[0]?.message || ''}
        type={toasts[0]?.type || 'info'}
        isOpen={toasts.length > 0}
        onClose={() => removeToast(toasts[0]?.id)}
      />
    </article>
  );
}
