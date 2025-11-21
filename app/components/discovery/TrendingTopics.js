"use client";

import {
  FireIcon,
  TrendingUpIcon,
  ChartBarIcon,
  EyeIcon,
  ClockIcon,
  TagIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";

const TrendingTopics = ({ topics, onTopicClick }) => {
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getTrendColor = (count) => {
    if (count >= 1000) return "text-error";
    if (count >= 500) return "text-warning";
    if (count >= 100) return "text-success";
    return "text-base-content";
  };

  const getTrendLevel = (count) => {
    if (count >= 1000) return { level: "🔥 Hot", color: "bg-error" };
    if (count >= 500) return { level: "📈 Trending", color: "bg-warning" };
    if (count >= 100) return { level: "⚡ Rising", color: "bg-success" };
    return { level: "🌱 Growing", color: "bg-info" };
  };

  const getVelocityIndicator = (trend) => {
    if (trend === "exploding") return { icon: FireIcon, color: "text-error", label: "Exploding" };
    if (trend === "rising") return { icon: ArrowTrendingUpIcon, color: "text-success", label: "Rising" };
    if (trend === "stable") return { icon: ChartBarIcon, color: "text-warning", label: "Stable" };
    return { icon: TrendingUpIcon, color: "text-info", label: "Growing" };
  };

  if (!topics || topics.length === 0) {
    return (
      <div className="bg-base-100 rounded-lg border border-base-300 p-8 text-center">
        <FireIcon className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-medium text-base-content mb-2">No trending topics yet</h3>
        <p className="text-base-content/70 mb-4">
          Start participating in discussions to see trending topics appear here.
        </p>
        <button
          onClick={() => window.location.href = "/_create"}
          className="btn btn-primary"
        >
          Start a Discussion
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trending Topics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Trending Topics */}
        <div className="bg-base-100 rounded-lg border border-base-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-base-content flex items-center">
              <FireIcon className="w-5 h-5 text-error mr-2" />
              Top Topics
            </h3>
            <span className="text-sm text-base-content/50">
              Last 7 days
            </span>
          </div>

          <div className="space-y-3">
            {topics.slice(0, 8).map((topic, index) => {
              const trendLevel = getTrendLevel(topic.count);
              const velocity = getVelocityIndicator(topic.trend);
              const VelocityIcon = velocity.icon;

              return (
                <div
                  key={topic.topic}
                  className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-primary/5 transition-all cursor-pointer group"
                  onClick={() => onTopicClick(topic)}
                >
                  <div className="flex items-center space-x-3">
                    {/* Rank Badge */}
                    <div className={`w-6 h-6 rounded-full ${trendLevel.color} flex items-center justify-center text-xs font-bold text-base-content`}>
                      {index + 1}
                    </div>

                    {/* Topic Info */}
                    <div>
                      <div className="font-medium text-base-content group-hover:text-primary transition-colors">
                        #{topic.topic}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-base-content/60">
                        <div className="flex items-center space-x-1">
                          <VelocityIcon className={`w-3 h-3 ${velocity.color}`} />
                          <span>{velocity.label}</span>
                        </div>
                        <span>•</span>
                        <span>{formatNumber(topic.count)} mentions</span>
                      </div>
                    </div>
                  </div>

                  {/* Trending Indicator */}
                  <div className="flex items-center space-x-1">
                    <TrendingUpIcon className={`w-4 h-4 ${getTrendColor(topic.count)}`} />
                    <span className={`text-sm font-medium ${getTrendColor(topic.count)}`}>
                      {topic.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topic Categories */}
        <div className="space-y-4">
          {/* Rising Fast */}
          <div className="bg-base-100 rounded-lg border border-base-300 p-6">
            <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center">
              <ArrowTrendingUpIcon className="w-5 h-5 text-success mr-2" />
              Rising Fast
            </h3>

            <div className="space-y-2">
              {topics
                .filter(topic => topic.trend === "rising" || topic.trend === "exploding")
                .slice(0, 5)
                .map((topic) => (
                  <div
                    key={`rising-${topic.topic}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-success/10 hover:bg-success/20 transition-all cursor-pointer"
                    onClick={() => onTopicClick(topic)}
                  >
                    <div className="flex items-center space-x-2">
                      <TagIcon className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-base-content">
                        #{topic.topic}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-success font-medium">
                        +{Math.floor(Math.random() * 50) + 10}%
                      </span>
                      <span className="text-xs text-base-content/60">
                        {formatNumber(topic.count)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Stable Topics */}
          <div className="bg-base-100 rounded-lg border border-base-300 p-6">
            <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center">
              <ChartBarIcon className="w-5 h-5 text-warning mr-2" />
              Consistent Interest
            </h3>

            <div className="space-y-2">
              {topics
                .filter(topic => topic.trend === "stable")
                .slice(0, 5)
                .map((topic) => (
                  <div
                    key={`stable-${topic.topic}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-warning/10 hover:bg-warning/20 transition-all cursor-pointer"
                    onClick={() => onTopicClick(topic)}
                  >
                    <div className="flex items-center space-x-2">
                      <TagIcon className="w-4 h-4 text-warning" />
                      <span className="text-sm font-medium text-base-content">
                        #{topic.topic}
                      </span>
                    </div>
                    <span className="text-xs text-base-content/60">
                      {formatNumber(topic.count)} mentions
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Topic Statistics */}
      <div className="bg-base-100 rounded-lg border border-base-300 p-6">
        <h3 className="text-lg font-semibold text-base-content mb-4">Topic Analytics</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-base-200 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {topics.length}
            </div>
            <div className="text-sm text-base-content/70">Total Topics</div>
          </div>

          <div className="text-center p-4 bg-base-200 rounded-lg">
            <div className="text-2xl font-bold text-success">
              {topics.filter(t => t.trend === "rising" || t.trend === "exploding").length}
            </div>
            <div className="text-sm text-base-content/70">Rising Topics</div>
          </div>

          <div className="text-center p-4 bg-base-200 rounded-lg">
            <div className="text-2xl font-bold text-warning">
              {formatNumber(topics.reduce((sum, topic) => sum + topic.count, 0))}
            </div>
            <div className="text-sm text-base-content/70">Total Mentions</div>
          </div>
        </div>

        {/* Topic Distribution Chart */}
        <div className="mt-6 p-4 bg-base-200 rounded-lg">
          <h4 className="text-sm font-medium text-base-content mb-3">Topic Distribution</h4>
          <div className="space-y-2">
            {topics.slice(0, 5).map((topic) => {
              const percentage = (topic.count / Math.max(...topics.map(t => t.count))) * 100;
              return (
                <div key={`chart-${topic.topic}`} className="flex items-center space-x-3">
                  <span className="text-xs text-base-content/70 w-20 truncate">
                    #{topic.topic}
                  </span>
                  <div className="flex-1 bg-base-300 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-base-content/60 w-12 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Related Actions */}
      <div className="bg-base-100 rounded-lg border border-base-300 p-6">
        <h3 className="text-lg font-semibold text-base-content mb-4">Explore Related</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => window.location.href = "/search"}
            className="flex items-center space-x-3 p-4 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-all text-left"
          >
            <EyeIcon className="w-6 h-6 text-primary" />
            <div>
              <div className="font-medium text-base-content">Browse All Content</div>
              <div className="text-sm text-base-content/70">Search posts and threads</div>
            </div>
          </button>

          <button
            onClick={() => window.location.href = "/apps"}
            className="flex items-center space-x-3 p-4 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-all text-left"
          >
            <ChatBubbleLeftIcon className="w-6 h-6 text-primary" />
            <div>
              <div className="font-medium text-base-content">Join Discussions</div>
              <div className="text-sm text-base-content/70">Find relevant communities</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrendingTopics;
