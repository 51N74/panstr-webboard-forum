"use client";

import {
  SparklesIcon,
  StarIcon,
  ArrowDownTrayIcon,
  ExternalLinkIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useNostr } from "../../context/NostrContext";
import { getUserRecommendations } from "../../lib/nostrClient";

const AppRecommender = ({ apps, onAppSelect }) => {
  const { user, pool, relayUrls } = useNostr();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && apps.length > 0) {
      loadRecommendations();
    }
  }, [user, apps]);

  const loadRecommendations = async () => {
    if (!user?.pubkey) return;

    setLoading(true);
    try {
      // Get user recommendations to understand their interests
      const userRecommendations = await getUserRecommendations(pool, relayUrls, user.pubkey);

      // Map user interests to app recommendations
      const recommendedApps = apps
        .filter(app => {
          // Filter apps based on user's interests and shared topics
          if (!userRecommendations.recommendations) return false;

          const userTopics = userRecommendations.recommendations
            .flatMap(rec => rec.sharedTopics || []);

          // Check if app tags match user interests
          const appTags = (app.tags || []).map(tag => tag.toLowerCase());
          const matchingTopics = userTopics.some(topic =>
            appTags.some(tag => tag.includes(topic.toLowerCase()) ||
                             topic.toLowerCase().includes(tag))
          );

          return matchingTopics || Math.random() > 0.7; // Some randomness for diversity
        })
        .sort((a, b) => {
          // Prioritize apps with more stars and recent updates
          const scoreA = (a.stars || 0) * 0.7 + (new Date(a.lastUpdated || 0).getTime() / 1000000000) * 0.3;
          const scoreB = (b.stars || 0) * 0.7 + (new Date(b.lastUpdated || 0).getTime() / 1000000000) * 0.3;
          return scoreB - scoreA;
        })
        .slice(0, 6); // Top 6 recommendations

      setRecommendations(recommendedApps);
    } catch (error) {
      console.error("Failed to load app recommendations:", error);
      // Fallback to popular apps
      const popularApps = apps
        .sort((a, b) => (b.stars || 0) - (a.stars || 0))
        .slice(0, 6);
      setRecommendations(popularApps);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-base-100 rounded-lg border border-base-300 p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-base-300 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-base-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-base-300 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-base-300 rounded"></div>
                <div className="h-3 bg-base-300 rounded w-5/6"></div>
                <div className="h-3 bg-base-300 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-base-100 rounded-lg border border-base-300 p-8 text-center">
        <SparklesIcon className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-medium text-base-content mb-2">No recommendations yet</h3>
        <p className="text-base-content/70">
          Start interacting with the community to get personalized app recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recommendations.map(app => (
        <div
          key={app.id}
          className="bg-base-100 rounded-lg border border-base-300 hover:border-primary/50 transition-all duration-200 hover:shadow-lg p-6 group"
        >
          {/* App Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {app.icon ? (
                <img
                  src={app.icon}
                  alt={app.name}
                  className="w-10 h-10 rounded-lg object-cover border border-base-300"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextElementSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-base-300"
                style={{ display: app.icon ? "none" : "flex" }}
              >
                <SparklesIcon className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1">
                <h4 className="font-medium text-base-content group-hover:text-primary transition-colors">
                  {app.name}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className={`badge badge-xs ${
                    app.kind === "app" ? "badge-primary" :
                    app.kind === "bot" ? "badge-secondary" :
                    app.kind === "service" ? "badge-accent" :
                    "badge-neutral"
                  }`}>
                    {app.kind || "app"}
                  </span>
                  {app.stars !== undefined && (
                    <div className="flex items-center space-x-1 text-xs text-warning">
                      <StarIcon className="w-3 h-3" />
                      <span>{app.stars}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendation Badge */}
            <div className="badge badge-warning badge-xs">
              <SparklesIcon className="w-3 h-3 mr-1" />
              Recommended
            </div>
          </div>

          {/* Description */}
          <p className="text-base-content/70 text-sm mb-4 line-clamp-2">
            {app.description || "Discover this amazing Nostr app"}
          </p>

          {/* Tags */}
          {app.tags && app.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {app.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="badge badge-outline badge-xs">
                  {tag}
                </span>
              ))}
              {app.tags.length > 2 && (
                <span className="badge badge-outline badge-xs">
                  +{app.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-base-content/60 mb-4">
            {app.downloads !== undefined && (
              <div className="flex items-center space-x-1">
                <ArrowDownTrayIcon className="w-3 h-3" />
                <span>{formatNumber(app.downloads)}</span>
              </div>
            )}
            {app.lastUpdated && (
              <span className="text-xs">
                Updated {new Date(app.lastUpdated).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {app.url && (
                <button
                  onClick={() => window.open(app.url, "_blank")}
                  className="btn btn-ghost btn-sm"
                  title="Visit Website"
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onAppSelect(app.id)}
                className="btn btn-sm btn-ghost"
              >
                Details
              </button>
              <button
                onClick={() => window.open(app.url || `https://panstr.app/apps/${app.id}`, "_blank")}
                className="btn btn-sm btn-primary"
              >
                Try Now
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AppRecommender;
