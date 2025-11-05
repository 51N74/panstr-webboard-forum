"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  parseThread,
  optimizeThreadStructure,
  getUserProfile,
  formatPubkey,
} from "../../../lib/nostrClient";

const EnhancedThreadView = ({ events, onReply, currentPubkey }) => {
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  const [profiles, setProfiles] = useState(new Map());

  // Optimize thread structure
  const optimizedThreads = useMemo(() => {
    return optimizeThreadStructure(events);
  }, [events]);

  // Load profiles for all participants
  useEffect(() => {
    const loadProfiles = async () => {
      const uniquePubkeys = new Set();

      // Extract all unique pubkeys from events
      events.forEach((event) => {
        uniquePubkeys.add(event.pubkey);
        const parsed = parseThread(event);
        parsed.profiles.forEach((profile) => {
          uniquePubkeys.add(profile.pubkey);
        });
      });

      // Load profiles
      const profilePromises = Array.from(uniquePubkeys).map(async (pubkey) => {
        try {
          const profile = await getUserProfile(pubkey);
          return [pubkey, profile];
        } catch (error) {
          console.warn(`Failed to load profile for ${pubkey}:`, error);
          return [pubkey, { name: formatPubkey(pubkey), pubkey }];
        }
      });

      const profileResults = await Promise.all(profilePromises);
      const profileMap = new Map(profileResults);
      setProfiles(profileMap);
    };

    if (events.length > 0) {
      loadProfiles();
    }
  }, [events]);

  const toggleThread = (threadId) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const renderEvent = (event, depth = 0, isLast = false) => {
    const parsed = parseThread(event);
    const profile = profiles.get(event.pubkey) || {
      name: "Unknown",
      pubkey: event.pubkey,
    };
    const isExpanded = expandedThreads.has(event.id);

    return (
      <div key={event.id} className={`relative ${depth > 0 ? "ml-6" : ""}`}>
        {/* Thread line connector */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300 -ml-3" />
        )}

        {/* Event card */}
        <div
          className={`
          bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3
          ${isLast ? "" : "border-b-2"}
          ${depth > 0 ? "ml-6" : ""}
          transition-all duration-200 hover:shadow-md
        `}
        >
          {/* Header with profile info */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              {profile.picture && (
                <img
                  src={profile.picture}
                  alt={profile.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <div className="font-semibold text-gray-900">
                  {profile.name}
                </div>
                <div className="text-sm text-gray-500">
                  {formatPubkey(profile.pubkey)}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {parsed.depth > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                  Depth {parsed.depth}
                </span>
              )}
              <span>
                {new Date(event.created_at * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none mb-3">
            <p className="whitespace-pre-wrap break-words">{event.content}</p>
          </div>

          {/* Thread metadata */}
          <div className="flex flex-wrap gap-2 mb-3">
            {parsed.root && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                Root: {parsed.root.id.slice(0, 8)}...
              </span>
            )}
            {parsed.reply && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                Reply to: {parsed.reply.id.slice(0, 8)}...
              </span>
            )}
            {parsed.mentions.length > 0 && (
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                {parsed.mentions.length} mention
                {parsed.mentions.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Mentions */}
          {parsed.mentions.length > 0 && (
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-1">Mentions:</div>
              <div className="flex flex-wrap gap-1">
                {parsed.mentions.map((mention, index) => {
                  const mentionProfile = profiles.get(mention.pubkey) || {
                    name: formatPubkey(mention.pubkey),
                    pubkey: mention.pubkey,
                  };
                  return (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                    >
                      {mentionProfile.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              {onReply && (
                <button
                  onClick={() => onReply(event)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
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
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  <span>Reply</span>
                </button>
              )}
            </div>

            {event.replies && event.replies.length > 0 && (
              <button
                onClick={() => toggleThread(event.id)}
                className="text-gray-600 hover:text-gray-700 text-sm flex items-center space-x-1"
              >
                <span>
                  {isExpanded ? "Hide" : "Show"} {event.replies.length} repl
                  {event.replies.length === 1 ? "y" : "ies"}
                </span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Nested replies */}
        {isExpanded && event.replies && (
          <div className="mt-3">
            {event.replies.map((reply, index) =>
              renderEvent(reply, depth + 1, index === event.replies.length - 1),
            )}
          </div>
        )}
      </div>
    );
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p>No threads to display</p>
      </div>
    );
  }

  return (
    <div className="enhanced-thread-view">
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">
          Enhanced NIP-10 Threading
        </h3>
        <p className="text-xs text-blue-700">
          Showing {optimizedThreads.length} thread
          {optimizedThreads.length !== 1 ? "s" : ""} with improved marker
          support and depth calculation
        </p>
      </div>

      <div className="space-y-4">
        {optimizedThreads.map((thread) => renderEvent(thread))}
      </div>
    </div>
  );
};

export default EnhancedThreadView;
