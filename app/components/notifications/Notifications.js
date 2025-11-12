"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNostrAuth } from "../../context/NostrAuthContext";
import { formatPubkey, getUserProfile, getEvents } from "../../lib/nostrClient";
import db, {
  liveNotifications,
  liveUnreadCount,
} from "../../lib/storage/indexedDB";
import Link from "next/link";

const Notifications = ({ compact = false }) => {
  const { user } = useNostrAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    mentions: true,
    replies: true,
    zaps: true,
    follows: false,
  });

  // Subscribe to live notifications and unread count
  useEffect(() => {
    if (!user?.pubkey) return;

    // Subscribe to notifications using the same pattern as ThreadCard
    const notificationsSubscription = liveNotifications(user.pubkey).subscribe(
      setNotifications,
    );
    const unreadCountSubscription = liveUnreadCount(user.pubkey).subscribe(
      setUnreadCount,
    );

    // Load initial notification settings
    loadNotificationSettings();

    return () => {
      // Check if subscription has unsubscribe method before calling it
      if (
        notificationsSubscription &&
        typeof notificationsSubscription.unsubscribe === "function"
      ) {
        notificationsSubscription.unsubscribe();
      }
      if (
        unreadCountSubscription &&
        typeof unreadCountSubscription.unsubscribe === "function"
      ) {
        unreadCountSubscription.unsubscribe();
      }
    };
  }, [user?.pubkey]);

  // Periodically check for new notifications from Nostr
  useEffect(() => {
    if (!user?.pubkey) return;

    const checkInterval = setInterval(() => {
      checkNostrNotifications();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, [user?.pubkey]);

  const checkNostrNotifications = async () => {
    try {
      setLoading(true);
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutesAgo = now - 5 * 60;

      // Check for new replies to user's events
      if (notificationSettings.replies) {
        const userEvents = await getEvents({
          kinds: [30023, 1],
          authors: [user.pubkey],
          limit: 100,
          since: fiveMinutesAgo,
        });

        for (const event of userEvents) {
          const replyFilters = {
            kinds: [1],
            "#e": [event.id],
            since: fiveMinutesAgo,
            limit: 50,
          };

          const replies = await getEvents(replyFilters);

          for (const reply of replies) {
            if (reply.pubkey !== user.pubkey) {
              // Check if already notified
              const existing = await db.getNotifications(
                user.pubkey,
                100,
                false,
              );
              const alreadyNotified = existing.some(
                (n) => n.type === "reply" && n.eventId === reply.id,
              );

              if (!alreadyNotified) {
                const authorProfile = await getUserProfile(reply.pubkey);
                await db.addNotification(
                  user.pubkey,
                  "reply",
                  reply.id,
                  `${authorProfile.name || "Anonymous"} replied to your ${
                    event.kind === 30023 ? "thread" : "reply"
                  }`,
                  {
                    replyId: reply.id,
                    threadId: event.id,
                    replyContent: reply.content.substring(0, 100),
                    authorName: authorProfile.name || "Anonymous",
                    authorPicture: authorProfile.picture,
                  },
                );
              }
            }
          }
        }

        // Check for mentions of user
        if (notificationSettings.mentions) {
          const mentionFilters = {
            kinds: [1, 30023],
            "#p": [user.pubkey],
            since: fiveMinutesAgo,
            limit: 50,
          };

          const mentions = await getEvents(mentionFilters);

          for (const mention of mentions) {
            if (mention.pubkey !== user.pubkey) {
              const existing = await db.getNotifications(
                user.pubkey,
                100,
                false,
              );
              const alreadyNotified = existing.some(
                (n) => n.type === "mention" && n.eventId === mention.id,
              );

              if (!alreadyNotified) {
                const authorProfile = await getUserProfile(mention.pubkey);
                await db.addNotification(
                  user.pubkey,
                  "mention",
                  mention.id,
                  `${authorProfile.name || "Anonymous"} mentioned you`,
                  {
                    eventId: mention.id,
                    content: mention.content.substring(0, 100),
                    authorName: authorProfile.name || "Anonymous",
                    authorPicture: authorProfile.picture,
                  },
                );
              }
            }
          }
        }

        // Check for new zaps
        if (notificationSettings.zaps) {
          const zapFilters = {
            kinds: [9735],
            "#p": [user.pubkey],
            since: fiveMinutesAgo,
            limit: 50,
          };

          const zapReceipts = await getEvents(zapFilters);

          for (const zap of zapReceipts) {
            const existing = await db.getNotifications(user.pubkey, 100, false);
            const alreadyNotified = existing.some(
              (n) => n.type === "zap" && n.eventId === zap.id,
            );

            if (!alreadyNotified) {
              const bolt11 = zap.tags.find((t) => t[0] === "bolt11")?.[1] || "";
              const amount = bolt11.match(/s=(\d+)/)?.[1] || "0";
              const amountInSats = parseInt(amount) / 1000;

              const description =
                zap.tags.find((t) => t[0] === "description")?.[1] || "";
              let zapRequest = null;

              try {
                zapRequest = JSON.parse(
                  atob(zap.tags.find((t) => t[0] === "description")?.[1] || ""),
                );
              } catch (e) {
                // Ignore malformed zap requests
              }

              const senderProfile = zapRequest?.pubkey
                ? await getUserProfile(zapRequest.pubkey)
                : null;

              await db.addNotification(
                user.pubkey,
                "zap",
                zap.id,
                `You received ${amountInSats} sats${
                  senderProfile ? ` from ${senderProfile.name}` : ""
                }`,
                {
                  amount: amountInSats,
                  senderName: senderProfile?.name || "Anonymous",
                  senderPicture: senderProfile?.picture,
                  senderPubkey: zapRequest?.pubkey,
                  eventId: zapRequest?.id,
                },
              );
            }
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking notifications:", error);
      setLoading(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const settings = await db.getNotificationSettings(user.pubkey);
      setNotificationSettings(
        settings || {
          mentions: true,
          replies: true,
          zaps: true,
          follows: false,
        },
      );
    } catch (error) {
      console.error("Error loading notification settings:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await db.markNotificationAsRead(user.pubkey, notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await db.markAllNotificationsAsRead(user.pubkey);
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await db.clearNotifications(user.pubkey);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await db.deleteNotification(user.pubkey, notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId),
      );
      if (
        notifications.find(
          (notif) => notif.id === notificationId && !notif.isRead,
        )
      ) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "reply":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        );
      case "mention":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 000 7-7z"
            />
          </svg>
        );
      case "zap":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698C.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "follow":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        );
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "reply":
        return "text-blue-600 bg-blue-100";
      case "mention":
        return "text-purple-600 bg-purple-100";
      case "zap":
        return "text-yellow-600 bg-yellow-100";
      case "follow":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-ghost btn-circle"
          title="Notifications"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-error text-error-content text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-base-100 rounded-lg border border-base-300 shadow-lg z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-base-content">
                  Notifications
                </h2>
                <button
                  onClick={markAllAsRead}
                  className="btn btn-sm btn-outline"
                >
                  Mark all as read
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center text-base-content/70 py-4">
                    No notifications yet
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        flex items-start space-x-3 p-3 hover:bg-base-200 transition-colors cursor-pointer
                        ${!notification.isRead ? "bg-primary/5 border-l-4 border-primary" : ""}
                      `}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div
                        className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium text-base-content">
                          {notification.message}
                        </p>

                        {notification.data && (
                          <div className="mt-1">
                            {notification.type === "reply" && (
                              <Link
                                href={`/room/general/thread/${notification.data.threadId}`}
                                className="text-xs text-base-content/70 hover:text-primary"
                              >
                                View thread
                              </Link>
                            )}

                            {notification.type === "mention" && (
                              <p className="text-xs text-base-content/70 italic">
                                "{notification.data.content}"
                              </p>
                            )}

                            {notification.type === "zap" && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-base-content/70">
                                  {notification.data.amount.toLocaleString()}{" "}
                                  sats
                                </span>
                                {notification.data.senderName && (
                                  <span className="text-xs text-base-content/50">
                                    from {notification.data.senderName}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-base-content/40 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-base-content/40 hover:text-error transition-colors"
                      >
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-base-content">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn btn-sm btn-outline">
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="bg-base-100 rounded-lg border border-base-300 p-8 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-base-content/30 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <h3 className="text-lg font-medium text-base-content mb-2">
                  No notifications yet
                </h3>
                <p className="text-base-content/70 mb-6">
                  When someone mentions you, replies to your content, or sends
                  you a zap, you'll see it here.
                </p>
                <button
                  onClick={checkNostrNotifications}
                  className="btn btn-primary"
                >
                  Check for new notifications
                </button>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    bg-base-100 rounded-lg border border-base-300 p-4 hover:shadow-md transition-all
                    ${!notification.isRead ? "bg-primary/5 border-l-4 border-primary" : ""}
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium text-base-content">
                        {notification.message}
                      </p>

                      {notification.data && (
                        <div className="mt-1">
                          {notification.type === "reply" && (
                            <Link
                              href={`/room/general/thread/${notification.data.threadId}`}
                              className="text-xs text-base-content/70 hover:text-primary"
                            >
                              View thread
                            </Link>
                          )}

                          {notification.type === "mention" && (
                            <p className="text-xs text-base-content/70 italic">
                              "{notification.data.content}"
                            </p>
                          )}

                          {notification.type === "zap" && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-base-content/70">
                                {notification.data.amount.toLocaleString()} sats
                              </span>
                              {notification.data.senderName && (
                                <span className="text-xs text-base-content/50">
                                  from {notification.data.senderName}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-base-content/40 mt-1">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="btn btn-ghost btn-sm"
                    >
                      {notification.isRead ? "Mark as unread" : "Mark as read"}
                    </button>

                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="btn btn-ghost btn-circle ml-2"
                      title="Delete notification"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
