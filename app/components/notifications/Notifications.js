"use client";

import React, { useState, useEffect } from "react";
import { useNostrAuth } from "../../context/NostrAuthContext";
import { getUserProfile, getEvents } from "../../lib/nostrClient";
import db, {
  liveNotifications,
  liveUnreadCount,
} from "../../lib/storage/indexedDB";
import Link from "next/link";

/**
 * Notifications Component - Panstr Minimal
 * Clean, compact drop-down for user alerts
 */

const Notifications = ({ compact = false }) => {
  const { user } = useNostrAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.pubkey) return;

    const notificationsSubscription = liveNotifications(user.pubkey).subscribe(setNotifications);
    const unreadCountSubscription = liveUnreadCount(user.pubkey).subscribe(setUnreadCount);

    return () => {
      notificationsSubscription?.unsubscribe?.();
      unreadCountSubscription?.unsubscribe?.();
    };
  }, [user?.pubkey]);

  const markAsRead = async (id) => {
    if (!db?.markNotificationAsRead) return;
    await db.markNotificationAsRead(user.pubkey, id);
  };

  const getIcon = (type) => {
    switch (type) {
      case "reply": return "chat_bubble";
      case "mention": return "alternate_email";
      case "zap": return "bolt";
      default: return "notifications";
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-1.5 rounded-md transition-colors ${isOpen ? 'text-primary bg-surface-muted' : 'text-secondary hover:text-primary'}`}
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-surface-border rounded-lg shadow-mid z-[110] overflow-hidden animate-slide-up">
            <header className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Notifications</h3>
              <span className="text-[10px] font-bold text-secondary">{unreadCount} UNREAD</span>
            </header>

            <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-[10px] font-bold text-secondary uppercase tracking-widest">
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { markAsRead(n.id); setIsOpen(false); }}
                    className={`p-4 border-b border-surface-border/50 hover:bg-surface-muted transition-colors cursor-pointer flex gap-3 ${!n.isRead ? 'bg-accent/5' : ''}`}
                  >
                    <span className={`material-symbols-outlined text-lg ${!n.isRead ? 'text-accent' : 'text-secondary'}`}>
                      {getIcon(n.type)}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[11px] leading-snug mb-1 ${!n.isRead ? 'font-bold text-primary' : 'text-secondary'}`}>
                        {n.message}
                      </p>
                      <span className="text-[9px] font-bold text-secondary/60 uppercase">
                        {new Date(n.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null; // Full page notifications could go here if needed
};

export default Notifications;
