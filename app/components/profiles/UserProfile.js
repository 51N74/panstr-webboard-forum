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
    joinedDate: null,
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
        limit: 50,
      };
      const userThreads = await getEvents(threadFilters);
      setThreads(userThreads);

      // Fetch user's replies (kind 1)
      const replyFilters = {
        kinds: [1],
        authors: [userPubkey],
        limit: 100,
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
        limit: 1000,
      };
      const allEvents = await getEvents(allEventsFilters);

      const threadCount = allEvents.filter((e) => e.kind === 30023).length;
      const replyCount = allEvents.filter((e) => e.kind === 1).length;

      // Get oldest event to determine join date
      const oldestEvent = allEvents.reduce(
        (oldest, current) =>
          current.created_at < oldest.created_at ? current : oldest,
        allEvents[0],
      );

      // Get zap receipts (simplified - in production you'd do a more complex query)
      const zapFilters = {
        kinds: [9735],
        "#p": [userPubkey],
        limit: 100,
      };
      const zapEvents = await getEvents(zapFilters);

      const totalZaps = zapEvents.reduce((sum, zap) => {
        const bolt11 = zap.tags.find((t) => t[0] === "bolt11")?.[1] || "";
        const amount = bolt11.match(/s=(\d+)/)?.[1] || "0";
        return sum + parseInt(amount) / 1000; // Convert millisats to sats
      }, 0);

      setStats({
        totalThreads: threadCount,
        totalReplies: replyCount,
        totalZaps: totalZaps,
        joinedDate: oldestEvent
          ? new Date(oldestEvent.created_at * 1000)
          : null,
      });
    } catch (err) {
      console.error("Error calculating user stats:", err);
    }
  };

  const formatJoinedDate = (date) => {
    if (!date) return "Unknown";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getThreadTitle = (event) => {
    const titleTag = event.tags.find((tag) => tag[0] === "title");
    return titleTag
      ? titleTag[1]
      : event.content.split("\n")[0].substring(0, 50) + "...";
  };

  const getReplyContext = (event) => {
    const replyTag = event.tags.find(
      (tag) => tag[0] === "e" && tag[3] === "reply",
    );
    const rootTag = event.tags.find(
      (tag) => tag[0] === "e" && tag[3] === "root",
    );
    const eventId = replyTag?.[1] || rootTag?.[1];
    return eventId;
  };

  const formatContent = (content, maxLength = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
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
        <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-fade-in">
          <div className="w-12 h-12 border-4 border-gradient-blue-planet border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 animate-pulse">Loading profile...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="modern-badge-error flex items-center space-x-3 p-4 animate-slide-up">
          <svg
            className="w-6 h-6 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium">Error loading profile: {error}</span>
        </div>
      );
    }

    if (!profile) {
      return (
        <div className="text-center py-12 animate-fade-in">
          <div className="text-8xl mb-6 opacity-30 animate-float">👤</div>
          <p className="text-gray-500 text-lg">Profile not found</p>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Enhanced Profile Header */}
        <div className="glass-card p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="relative flex items-start space-x-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300 animate-glow"></div>
              <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/50 shadow-xl">
                {profile.picture ? (
                  <img
                    src={profile.picture}
                    alt={profile.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {profile.name?.[0]?.toUpperCase() ||
                        pubkey.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1 gradient-text">
                  {profile.display_name || profile.name || "Anonymous"}
                </h2>
                {profile.name && profile.name !== profile.display_name && (
                  <p className="text-gray-500 text-sm font-medium">
                    @{profile.name}
                  </p>
                )}
              </div>

              {profile.about && (
                <p className="text-gray-700 leading-relaxed text-lg">
                  {profile.about}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                {profile.nip05 && (
                  <div className="nip05-verified hover:scale-105 transition-transform duration-200">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{profile.nip05}</span>
                  </div>
                )}

                {profile.lud16 && (
                  <div className="modern-badge-warning hover:scale-105 transition-transform duration-200">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{profile.lud16}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card group hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats.totalThreads}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-600">Threads</div>
          </div>

          <div className="stat-card group hover:shadow-glow-green transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats.totalReplies}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-600">Replies</div>
          </div>

          <div className="stat-card group hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats.totalZaps.toLocaleString()}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-600">Total Zaps</div>
            <div className="text-xs text-gray-500">sats</div>
          </div>

          <div className="stat-card group hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900 truncate">
                {formatJoinedDate(stats.joinedDate)}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-600">Joined</div>
          </div>
        </div>

        {/* Enhanced Public Key Section */}
        <div className="glass-card p-6 group hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-600 mb-2">
                Public Key (npub)
              </div>
              <div className="font-mono text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 truncate">
                {formatPubkey(pubkey, "npub")}
              </div>
            </div>
            <button
              className="modern-button-secondary ml-4 hover:scale-105 transition-transform duration-200"
              onClick={() => {
                navigator.clipboard.writeText(formatPubkey(pubkey, "npub"));
                // You could add a toast notification here
              }}
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="ml-2">Copy</span>
            </button>
          </div>
        </div>

        {/* Enhanced Activity Tabs */}
        <div className="glass-card p-2">
          <div className="flex space-x-1">
            <button
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === "threads"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("threads")}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Threads</span>
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                  {threads.length}
                </span>
              </div>
            </button>
            <button
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === "replies"
                  ? "bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg transform scale-105"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("replies")}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Replies</span>
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                  {replies.length}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Enhanced Activity Content */}
        <div className="modern-card p-6">
          {activeTab === "threads" && (
            <div className="space-y-4">
              {threads.length === 0 ? (
                <div className="text-center py-12 animate-fade-in">
                  <div className="text-8xl mb-6 opacity-30 animate-float">
                    📝
                  </div>
                  <p className="text-gray-500 text-lg font-medium">
                    No threads yet
                  </p>
                </div>
              ) : (
                threads.map((thread, index) => (
                  <div
                    key={thread.id}
                    className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <h4 className="font-semibold text-gray-900 text-lg mb-3 hover:text-blue-600 transition-colors duration-200 cursor-pointer">
                      {getThreadTitle(thread)}
                    </h4>
                    <p className="text-gray-700 mb-4 leading-relaxed truncate-2">
                      {formatContent(thread.content)}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{formatTimeAgo(thread.created_at)}</span>
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {thread.id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "replies" && (
            <div className="space-y-4">
              {replies.length === 0 ? (
                <div className="text-center py-12 animate-fade-in">
                  <div className="text-8xl mb-6 opacity-30 animate-float">
                    💬
                  </div>
                  <p className="text-gray-500 text-lg font-medium">
                    No replies yet
                  </p>
                </div>
              ) : (
                replies.map((reply, index) => {
                  const replyContext = getReplyContext(reply);
                  return (
                    <div
                      key={reply.id}
                      className="bg-gradient-to-r from-green-50 to-white rounded-xl p-6 border border-green-200 hover:shadow-lg hover:border-green-300 transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <p className="text-gray-800 mb-3 leading-relaxed">
                        {formatContent(reply.content)}
                      </p>
                      {replyContext && (
                        <div className="modern-badge-primary mb-3 inline-flex items-center space-x-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            Replying to: {replyContext.substring(0, 8)}...
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>{formatTimeAgo(reply.created_at)}</span>
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {reply.id.substring(0, 8)}...
                          </span>
                        </div>
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="modern-card max-w-4xl max-h-[90vh] overflow-y-auto relative animate-slide-up">
          <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200 p-6 flex justify-between items-center z-10">
            <h3 className="text-2xl font-bold gradient-text">User Profile</h3>
            <button
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:rotate-90"
              onClick={onClose}
            >
              <svg
                className="w-6 h-6 text-gray-600"
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
          <div className="p-6">{renderContent()}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">User Profile</h1>
          <button
            className="modern-button-secondary hover:scale-105 transition-transform duration-200"
            onClick={onClose}
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="ml-2">Back</span>
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default UserProfile;
