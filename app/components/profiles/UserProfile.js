"use client";

import React, { useState, useEffect } from "react";
import { formatPubkey, getUserProfile, getEvents } from "../../lib/nostrClient";
import db from "../../lib/storage/indexedDB";

const UserProfile = ({ pubkey, onClose, isModal = true }) => {
  const [profile, setProfile] = useState(null);
  const [threads, setThreads] = useState([]);
  const [replies, setReplies] = useState([]);
  const [stats, setStats] = useState({
    totalThreads: 0,
    totalReplies: 0,
    totalZaps: 0,
    joinedDate: null
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("threads");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pubkey) {
      loadUserProfile();
    }
  }, [pubkey]);

  const loadUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get cached profile first
      let cachedProfile = await db.getCachedProfile(pubkey);

      if (cachedProfile) {
        setProfile(cachedProfile);
      }

      // Fetch fresh profile data
      const freshProfile = await getUserProfile(pubkey);
      setProfile(freshProfile);

      // Cache the profile
      await db.cacheProfile(pubkey, freshProfile);

      // Fetch user activity
      await fetchUserActivity(pubkey);

      // Calculate stats
      await calculateUserStats(pubkey);

    } catch (err) {
      console.error("Error loading user profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async (userPubkey) => {
    try {
      // Fetch user's threads (kind 30023)
      const threadFilters = {
        kinds: [30023],
        authors: [userPubkey],
        limit: 50
      };
      const userThreads = await getEvents(threadFilters);
      setThreads(userThreads);

      // Fetch user's replies (kind 1)
      const replyFilters = {
        kinds: [1],
        authors: [userPubkey],
        limit: 100
      };
      const userReplies = await getEvents(replyFilters);
      setReplies(userReplies);

    } catch (err) {
      console.error("Error fetching user activity:", err);
    }
  };

  const calculateUserStats = async (userPubkey) => {
    try {
      // Get all events by user
      const allEventsFilters = {
        kinds: [30023, 1],
        authors: [userPubkey],
        limit: 1000
      };
      const allEvents = await getEvents(allEventsFilters);

      const threadCount = allEvents.filter(e => e.kind === 30023).length;
      const replyCount = allEvents.filter(e => e.kind === 1).length;

      // Get oldest event to determine join date
      const oldestEvent = allEvents.reduce((oldest, current) =>
        current.created_at < oldest.created_at ? current : oldest
      , allEvents[0]);

      // Get zap receipts (simplified - in production you'd do a more complex query)
      const zapFilters = {
        kinds: [9735],
        "#p": [userPubkey],
        limit: 100
      };
      const zapEvents = await getEvents(zapFilters);

      const totalZaps = zapEvents.reduce((sum, zap) => {
        const bolt11 = zap.tags.find(t => t[0] === "bolt11")?.[1] || "";
        const amount = bolt11.match(/s=(\d+)/)?.[1] || "0";
        return sum + parseInt(amount) / 1000; // Convert millisats to sats
      }, 0);

      setStats({
        totalThreads: threadCount,
        totalReplies: replyCount,
        totalZaps: totalZaps,
        joinedDate: oldestEvent ? new Date(oldestEvent.created_at * 1000) : null
      });

    } catch (err) {
      console.error("Error calculating user stats:", err);
    }
  };

  const formatJoinedDate = (date) => {
    if (!date) return "Unknown";
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getThreadTitle = (event) => {
    const titleTag = event.tags.find(tag => tag[0] === 'title');
    return titleTag ? titleTag[1] : event.content.split('\n')[0].substring(0, 50) + '...';
  };

  const getReplyContext = (event) => {
    const replyTag = event.tags.find(tag => tag[0] === 'e' && tag[3] === 'reply');
    const rootTag = event.tags.find(tag => tag[0] === 'e' && tag[3] === 'root');
    const eventId = replyTag?.[1] || rootTag?.[1];
    return eventId;
  };

  const formatContent = (content, maxLength = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const formatTimeAgo = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert alert-error">
          <svg className="w-6 h-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Error loading profile: {error}</span>
        </div>
      );
    }

    if (!profile) {
      return (
        <div className="text-center py-8">
          <div className="text-6xl mb-4 opacity-50">👤</div>
          <p className="text-base-content/70">Profile not found</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-start space-x-6">
          <div className="avatar">
            <div className="w-24 h-24 rounded-full">
              {profile.picture ? (
                <img src={profile.picture} alt={profile.name} className="object-cover" />
              ) : (
                <div className="bg-neutral text-neutral-content flex items-center justify-center h-full text-3xl">
                  {profile.name?.[0]?.toUpperCase() || pubkey.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-base-content mb-1">
              {profile.display_name || profile.name || "Anonymous"}
            </h2>

            {profile.name && profile.name !== profile.display_name && (
              <p className="text-base-content/70 mb-2">@{profile.name}</p>
            )}

            {profile.about && (
              <p className="text-base-content/80 mb-4 leading-relaxed">
                {profile.about}
              </p>
            )}

            <div className="flex flex-wrap gap-2 text-sm">
              {profile.nip05 && (
                <div className="flex items-center space-x-1 text-success">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{profile.nip05}</span>
                </div>
              )}

              {profile.lud16 && (
                <div className="flex items-center space-x-1 text-warning">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <span>{profile.lud16}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-figure text-primary">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="stat-title">Threads</div>
            <div className="stat-value text-primary">{stats.totalThreads}</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-figure text-secondary">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="stat-title">Replies</div>
            <div className="stat-value text-secondary">{stats.totalReplies}</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-figure text-warning">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="stat-title">Total Zaps</div>
            <div className="stat-value text-warning">{stats.totalZaps.toLocaleString()} sats</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-figure text-info">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="stat-title">Joined</div>
            <div className="stat-value text-info text-sm">{formatJoinedDate(stats.joinedDate)}</div>
          </div>
        </div>

        {/* npub */}
        <div className="bg-base-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-base-content/60 mb-1">Public Key (npub)</div>
              <div className="font-mono text-xs text-base-content/80 break-all">
                {formatPubkey(pubkey, "npub")}
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(formatPubkey(pubkey, "npub"));
                // You could add a toast notification here
              }}
            >
              Copy
            </button>
          </div>
        </div>

        {/* Activity Tabs */}
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${activeTab === "threads" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("threads")}
          >
            Threads ({threads.length})
          </button>
          <button
            className={`tab ${activeTab === "replies" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("replies")}
          >
            Replies ({replies.length})
          </button>
        </div>

        {/* Activity Content */}
        <div className="bg-base-100 rounded-lg p-6">
          {activeTab === "threads" && (
            <div className="space-y-4">
              {threads.length === 0 ? (
                <div className="text-center py-8 text-base-content/50">
                  <div className="text-6xl mb-4 opacity-50">📝</div>
                  <p>No threads yet</p>
                </div>
              ) : (
                threads.map((thread) => (
                  <div key={thread.id} className="border-b border-base-300 pb-4 last:border-0">
                    <h4 className="font-semibold text-base-content mb-2">
                      {getThreadTitle(thread)}
                    </h4>
                    <p className="text-sm text-base-content/70 mb-2">
                      {formatContent(thread.content)}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-base-content/50">
                      <span>{formatTimeAgo(thread.created_at)}</span>
                      <span>•</span>
                      <span>{thread.id.substring(0, 16)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "replies" && (
            <div className="space-y-4">
              {replies.length === 0 ? (
                <div className="text-center py-8 text-base-content/50">
                  <div className="text-6xl mb-4 opacity-50">💬</div>
                  <p>No replies yet</p>
                </div>
              ) : (
                replies.map((reply) => {
                  const replyContext = getReplyContext(reply);
                  return (
                    <div key={reply.id} className="border-b border-base-300 pb-4 last:border-0">
                      <p className="text-sm text-base-content mb-2">
                        {formatContent(reply.content)}
                      </p>
                      {replyContext && (
                        <div className="text-xs text-info mb-2">
                          Replying to: {replyContext.substring(0, 16)}...
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-base-content/50">
                        <span>{formatTimeAgo(reply.created_at)}</span>
                        <span>•</span>
                        <span>{reply.id.substring(0, 16)}...</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isModal) {
    return (
      <div className="modal modal-open">
        <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">User Profile</h3>
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          {renderContent()}
        </div>
        <div className="modal-backdrop" onClick={onClose}></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Profile</h1>
        <button className="btn btn-ghost" onClick={onClose}>
          ← Back
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default UserProfile;
