"use client";

import {
  UserIcon,
  UserPlusIcon,
  MessageIcon,
  StarIcon,
  CalendarIcon,
  TagIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
// Removed date-fns dependency - using native date formatting
import { useState } from "react";

const UserRecommendations = ({ recommendations, onUserAction }) => {
  const [followedUsers, setFollowedUsers] = useState(new Set());

  const formatPubkey = (pubkey) => {
    if (pubkey.length <= 16) return pubkey;
    return `${pubkey.substring(0, 8)}...${pubkey.substring(pubkey.length - 8)}`;
  };

  const handleFollow = async (pubkey) => {
    // Toggle follow state
    const newFollowedUsers = new Set(followedUsers);
    if (newFollowedUsers.has(pubkey)) {
      newFollowedUsers.delete(pubkey);
    } else {
      newFollowedUsers.add(pubkey);
    }
    setFollowedUsers(newFollowedUsers);

    // Trigger follow action
    onUserAction(pubkey, "follow");
  };

  const getInteractionLabel = (score) => {
    if (score >= 10)
      return { label: "Strong Connection", color: "text-success" };
    if (score >= 5) return { label: "Good Match", color: "text-primary" };
    if (score >= 2) return { label: "Some Connection", color: "text-warning" };
    return { label: "Potential Connection", color: "text-base-content/70" };
  };

  const getActivityLevel = (count) => {
    if (count >= 50) return { level: "Very Active", color: "bg-success" };
    if (count >= 20) return { level: "Active", color: "bg-primary" };
    if (count >= 5) return { level: "Moderate", color: "bg-warning" };
    return { level: "New", color: "bg-neutral" };
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-base-100 rounded-lg border border-base-300 p-8 text-center">
        <SparklesIcon className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-medium text-base-content mb-2">
          No recommendations yet
        </h3>
        <p className="text-base-content/70 mb-4">
          Start following users and engaging with content to get personalized
          recommendations.
        </p>
        <button
          onClick={() => (window.location.href = "/search")}
          className="btn btn-primary"
        >
          Explore Users
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recommendations.map((user, index) => {
        const interactionInfo = getInteractionLabel(user.interactionScore || 0);
        const activityInfo = getActivityLevel(user.interactionScore || 0);
        const isFollowed = followedUsers.has(user.pubkey);

        return (
          <div
            key={user.pubkey}
            className="bg-base-100 rounded-lg border border-base-300 hover:border-primary/50 transition-all duration-200 hover:shadow-lg p-6 group"
          >
            {/* User Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {/* User Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-base-300">
                    <UserIcon className="w-6 h-6 text-primary" />
                  </div>
                  {/* Activity Indicator */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 ${activityInfo.color} rounded-full border-2 border-base-100`}
                  ></div>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-base-content group-hover:text-primary transition-colors">
                    {formatPubkey(user.pubkey)}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${interactionInfo.color}`}>
                      {interactionInfo.label}
                    </span>
                    <span className="text-xs text-base-content/50">
                      {activityInfo.level}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendation Score */}
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-1 text-sm">
                  <SparklesIcon className="w-4 h-4 text-warning" />
                  <span className="font-medium">
                    {user.interactionScore || 0}
                  </span>
                </div>
                <span className="text-xs text-base-content/50">Score</span>
              </div>
            </div>

            {/* Shared Topics */}
            {user.sharedTopics && user.sharedTopics.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center space-x-1 mb-2">
                  <TagIcon className="w-4 h-4 text-base-content/50" />
                  <span className="text-sm text-base-content/70">
                    Shared Interests
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {user.sharedTopics.slice(0, 3).map((topic, topicIndex) => (
                    <span
                      key={topicIndex}
                      className="badge badge-outline badge-xs"
                    >
                      {topic}
                    </span>
                  ))}
                  {user.sharedTopics.length > 3 && (
                    <span className="badge badge-outline badge-xs">
                      +{user.sharedTopics.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Interaction Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="text-center p-2 bg-base-200 rounded">
                <div className="font-semibold text-base-content">
                  {user.topicCount || 0}
                </div>
                <div className="text-xs text-base-content/70">Topics</div>
              </div>
              <div className="text-center p-2 bg-base-200 rounded">
                <div className="font-semibold text-base-content">
                  {user.interactionScore || 0}
                </div>
                <div className="text-xs text-base-content/70">Interactions</div>
              </div>
            </div>

            {/* Recommendation Reason */}
            {index < 3 && (
              <div className="mb-4 p-2 bg-primary/5 border border-primary/20 rounded">
                <div className="flex items-center space-x-1">
                  <CheckCircleIcon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-primary font-medium">
                    {index === 0
                      ? "Top Recommendation"
                      : index === 1
                        ? "Highly Recommended"
                        : "Good Match"}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-base-300">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onUserAction(user.pubkey, "view")}
                  className="btn btn-ghost btn-sm"
                  title="View Profile"
                >
                  <UserIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUserAction(user.pubkey, "message")}
                  className="btn btn-ghost btn-sm"
                  title="Send Message"
                >
                  <MessageIcon className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleFollow(user.pubkey)}
                className={`btn btn-sm ${
                  isFollowed ? "btn-success" : "btn-primary"
                }`}
              >
                {isFollowed ? (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-4 h-4 mr-1" />
                    Follow
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserRecommendations;
