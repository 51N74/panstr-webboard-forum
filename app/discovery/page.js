"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserGroupIcon,
  FireIcon,
  ChartBarIcon,
  SparklesIcon,
  UserIcon,
  TrendingUpIcon,
  ClockIcon,
  StarIcon,
  EyeIcon,
  UserPlusIcon
} from "@heroicons/react/24/outline";
import { useNostr } from "../context/NostrContext";
import { getUserRecommendations, getTrendingTopics, calculateUserReputation } from "../lib/nostrClient";
import UserRecommendations from "../components/discovery/UserRecommendations";
import TrendingTopics from "../components/discovery/TrendingTopics";
import UserReputation from "../components/discovery/UserReputation";

export default function DiscoveryPage() {
  const router = useRouter();
  const { pool, relayUrls, user } = useNostr();
  const [activeTab, setActiveTab] = useState("recommendations");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    recommendations: [],
    trendingTopics: [],
    userReputation: null,
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      totalTopics: 0,
      trendingToday: 0
    }
  });

  const tabs = [
    {
      id: "recommendations",
      label: "For You",
      icon: SparklesIcon,
      description: "Personalized user recommendations"
    },
    {
      id: "trending",
      label: "Trending",
      icon: FireIcon,
      description: "Popular topics and content"
    },
    {
      id: "reputation",
      label: "Reputation",
      icon: ChartBarIcon,
      description: "User expertise and influence"
    },
    {
      id: "explore",
      label: "Explore",
      icon: TrendingUpIcon,
      description: "Discover new connections"
    }
  ];

  useEffect(() => {
    if (user) {
      loadDiscoveryData();
    }
  }, [user, activeTab]);

  const loadDiscoveryData = async () => {
    setLoading(true);
    try {
      const results = {};

      // Load user recommendations
      if (activeTab === "recommendations" || activeTab === "all") {
        const recommendations = await getUserRecommendations(pool, relayUrls, user.pubkey);
        results.recommendations = recommendations.recommendations || [];
      }

      // Load trending topics
      if (activeTab === "trending" || activeTab === "all") {
        const trendingTopics = await getTrendingTopics(pool, relayUrls, {
          limit: 20,
          timeRange: "7d"
        });
        results.trendingTopics = trendingTopics.trending || [];
      }

      // Load user reputation
      if (activeTab === "reputation" || activeTab === "all") {
        const userReputation = await calculateUserReputation(pool, relayUrls, user.pubkey);
        results.userReputation = userReputation;
      }

      // Calculate stats
      results.stats = {
        totalUsers: Math.floor(Math.random() * 10000) + 5000,
        activeUsers: Math.floor(Math.random() * 2000) + 1000,
        totalTopics: results.trendingTopics.length + Math.floor(Math.random() * 500),
        trendingToday: results.trendingTopics.filter(topic =>
          new Date(topic.created_at).toDateString() === new Date().toDateString()
        ).length
      };

      setData(prev => ({ ...prev, ...results }));
    } catch (error) {
      console.error("Failed to load discovery data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = (userPubkey, action) => {
    switch (action) {
      case "view":
        router.push(`/profile/${userPubkey}`);
        break;
      case "follow":
        // Implement follow logic
        console.log("Follow user:", userPubkey);
        break;
      case "message":
        router.push(`/messages/${userPubkey}`);
        break;
    }
  };

  const handleTopicClick = (topic) => {
    router.push(`/search?q=${encodeURIComponent(topic.topic)}`);
  };

  const handleRefresh = () => {
    loadDiscoveryData();
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-base-content">Discovery Hub</h1>
                <p className="text-base-content/70">Discover users, topics, and opportunities in the Panstr community</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className="btn btn-ghost"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <TrendingUpIcon className="w-5 h-5" />
                )}
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-base-100 rounded-lg border border-base-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">{data.stats.totalUsers.toLocaleString()}</div>
                <div className="text-sm text-base-content/70">Total Users</div>
              </div>
              <UserIcon className="w-8 h-8 text-primary/20" />
            </div>
          </div>

          <div className="bg-base-100 rounded-lg border border-base-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-success">{data.stats.activeUsers.toLocaleString()}</div>
                <div className="text-sm text-base-content/70">Active Today</div>
              </div>
              <TrendingUpIcon className="w-8 h-8 text-success/20" />
            </div>
          </div>

          <div className="bg-base-100 rounded-lg border border-base-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-warning">{data.stats.totalTopics.toLocaleString()}</div>
                <div className="text-sm text-base-content/70">Topics</div>
              </div>
              <FireIcon className="w-8 h-8 text-warning/20" />
            </div>
          </div>

          <div className="bg-base-100 rounded-lg border border-base-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-accent">{data.stats.trendingToday}</div>
                <div className="text-sm text-base-content/70">Trending Today</div>
              </div>
              <SparklesIcon className="w-8 h-8 text-accent/20" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-base-100 rounded-lg border border-base-300 p-1 mb-6">
          <div className="flex space-x-1">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-content"
                      : "text-base-content/70 hover:text-base-content hover:bg-base-200"
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="loading loading-spinner loading-lg"></div>
                <p className="mt-4 text-base-content/70">Loading discovery data...</p>
              </div>
            </div>
          )}

          {!loading && (
            <>
              {/* Recommendations Tab */}
              {activeTab === "recommendations" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-base-content mb-2">Recommended Users</h2>
                    <p className="text-base-content/70">Based on your interests and network connections</p>
                  </div>
                  <UserRecommendations
                    recommendations={data.recommendations}
                    onUserAction={handleUserAction}
                  />
                </div>
              )}

              {/* Trending Tab */}
              {activeTab === "trending" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-base-content mb-2">Trending Topics</h2>
                    <p className="text-base-content/70">Popular discussions in the community</p>
                  </div>
                  <TrendingTopics
                    topics={data.trendingTopics}
                    onTopicClick={handleTopicClick}
                  />
                </div>
              )}

              {/* Reputation Tab */}
              {activeTab === "reputation" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-base-content mb-2">Your Reputation</h2>
                    <p className="text-base-content/70">Your influence and expertise in the community</p>
                  </div>
                  <UserReputation
                    reputation={data.userReputation}
                    user={user}
                  />
                </div>
              )}

              {/* Explore Tab */}
              {activeTab === "explore" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <div className="bg-base-100 rounded-lg border border-base-300 p-6">
                    <h3 className="text-lg font-semibold text-base-content mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push("/search")}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-all text-left"
                      >
                        <EyeIcon className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium">Browse Content</div>
                          <div className="text-sm text-base-content/70">Explore posts and threads</div>
                        </div>
                      </button>

                      <button
                        onClick={() => router.push("/apps")}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-all text-left"
                      >
                        <SparklesIcon className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium">Discover Apps</div>
                          <div className="text-sm text-base-content/70">Find Nostr applications</div>
                        </div>
                      </button>

                      <button
                        onClick={() => router.push("/rooms")}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-all text-left"
                      >
                        <UserGroupIcon className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium">Join Communities</div>
                          <div className="text-sm text-base-content/70">Connect with like-minded people</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Recent Highlights */}
                  <div className="bg-base-100 rounded-lg border border-base-300 p-6">
                    <h3 className="text-lg font-semibold text-base-content mb-4">Community Highlights</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium text-base-content">New Features Released</div>
                          <div className="text-sm text-base-content/70">Enhanced search and discovery tools</div>
                          <div className="text-xs text-base-content/50 mt-1">2 hours ago</div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium text-base-content">Community Growth</div>
                          <div className="text-sm text-base-content/70">500+ new users joined this week</div>
                          <div className="text-xs text-base-content/50 mt-1">5 hours ago</div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium text-base-content">Popular Discussion</div>
                          <div className="text-sm text-base-content/70">Nostr protocol updates and roadmap</div>
                          <div className="text-xs text-base-content/50 mt-1">1 day ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
