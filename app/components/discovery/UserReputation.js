"use client";

import {
  ChartBarIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
  TrophyIcon,
  UserGroupIcon,
  ClockIcon,
  TagIcon,
  SparklesIcon,
  AcademicCapIcon,
  LightningBoltIcon,
  HeartIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

const UserReputation = ({ reputation, user }) => {
  const [expandedSection, setExpandedSection] = useState("overview");

  const getActivityLevelColor = (level) => {
    switch (level) {
      case "high": return "text-success";
      case "medium": return "text-warning";
      case "low": return "text-base-content/50";
      default: return "text-base-content/50";
    }
  };

  const getActivityLevelBadge = (level) => {
    switch (level) {
      case "high": return { label: "Highly Active", color: "badge-success", icon: FireIcon };
      case "medium": return { label: "Moderately Active", color: "badge-warning", icon: BoltIcon };
      case "low": return { label: "Low Activity", color: "badge-neutral", icon: ClockIcon };
      default: return { label: "Unknown", color: "badge-outline", icon: ClockIcon };
    }
  };

  const getReputationLevel = (totalScore) => {
    if (totalScore >= 100) return { level: "Expert", color: "text-error", badge: "bg-error", icon: TrophyIcon, description: "Top contributor" };
    if (totalScore >= 50) return { level: "Advanced", color: "text-warning", badge: "bg-warning", icon: StarIcon, description: "Well-respected member" };
    if (totalScore >= 20) return { level: "Intermediate", color: "text-primary", badge: "bg-primary", icon: SparklesIcon, description: "Growing influence" };
    if (totalScore >= 5) return { level: "Beginner", color: "text-info", badge: "bg-info", icon: AcademicCapIcon, description: "Getting started" };
    return { level: "Newcomer", color: "text-base-content/50", badge: "bg-neutral", icon: UserGroupIcon, description: "New to the community" };
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getScoreProgress = (score, maxScore) => {
    const percentage = Math.min((score / maxScore) * 100, 100);
    return percentage;
  };

  const getExpertiseLevel = (topicCount) => {
    if (topicCount >= 20) return { level: "Expert", color: "bg-error" };
    if (topicCount >= 10) return { level: "Advanced", color: "bg-warning" };
    if (topicCount >= 5) return { level: "Intermediate", color: "bg-primary" };
    if (topicCount >= 2) return { level: "Beginner", color: "bg-info" };
    return { level: "Newcomer", color: "bg-neutral" };
  };

  if (!reputation || !reputation.reputation) {
    return (
      <div className="bg-base-100 rounded-lg border border-base-300 p-8 text-center">
        <ChartBarIcon className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-medium text-base-content mb-2">Reputation Data Unavailable</h3>
        <p className="text-base-content/70">
          Start engaging with the community to build your reputation profile.
        </p>
      </div>
    );
  }

  const rep = reputation.reputation;
  const totalScore = rep.contentScore + rep.interactionScore;
  const reputationLevel = getReputationLevel(totalScore);
  const activityBadge = getActivityLevelBadge(rep.activityLevel);
  const ActivityIcon = activityBadge.icon;
  const ReputationIcon = reputationLevel.icon;

  const expertiseTopics = Array.from(rep.expertise.entries()).map(([topic, count]) => ({
    topic,
    count,
    level: getExpertiseLevel(count)
  })).sort((a, b) => b.count - a.count).slice(0, 10);

  const tabs = [
    { id: "overview", label: "Overview", icon: ChartBarIcon },
    { id: "expertise", label: "Expertise", icon: AcademicCapIcon },
    { id: "activity", label: "Activity", icon: ClockIcon },
    { id: "impact", label: "Impact", icon: LightningBoltIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Reputation Header */}
      <div className="bg-base-100 rounded-lg border border-base-300 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* User Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-primary">
              <UserGroupIcon className="w-8 h-8 text-primary" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-base-content mb-1">Your Reputation</h2>
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-1 ${reputationLevel.color}`}>
                  <ReputationIcon className="w-5 h-5" />
                  <span className="font-semibold">{reputationLevel.level}</span>
                </div>
                <span className={`badge ${activityBadge.color} badge-sm`}>
                  <ActivityIcon className="w-3 h-3 mr-1" />
                  {activityBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Total Score */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{formatNumber(totalScore)}</div>
            <div className="text-sm text-base-content/70">Total Score</div>
            <div className="text-xs text-base-content/50 mt-1">{reputationLevel.description}</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-base-200 rounded-lg p-1">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setExpandedSection(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md transition-all ${
                  expandedSection === tab.id
                    ? "bg-base-100 text-primary shadow-sm"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-100/50"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-base-100 rounded-lg border border-base-300 p-6">
        {/* Overview Tab */}
        {expandedSection === "overview" && (
          <div className="space-y-6">
            {/* Score Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-base-content mb-4">Score Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <StarIcon className="w-5 h-5 text-primary" />
                      <span className="font-medium text-base-content">Content Score</span>
                    </div>
                    <span className="text-xl font-bold text-primary">{formatNumber(rep.contentScore)}</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-2">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${getScoreProgress(rep.contentScore, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-base-content/60 mt-1">
                    Based on posts, threads, and quality of content
                  </div>
                </div>

                <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <HeartIcon className="w-5 h-5 text-secondary" />
                      <span className="font-medium text-base-content">Interaction Score</span>
                    </div>
                    <span className="text-xl font-bold text-secondary">{formatNumber(rep.interactionScore)}</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-2">
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-500"
                      style={{ width: `${getScoreProgress(rep.interactionScore, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-base-content/60 mt-1">
                    Based on reactions, comments, and community engagement
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <h3 className="text-lg font-semibold text-base-content mb-4">Key Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-base-200 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{rep.threadsCreated || 0}</div>
                  <div className="text-sm text-base-content/70">Threads</div>
                </div>
                <div className="text-center p-4 bg-base-200 rounded-lg">
                  <div className="text-2xl font-bold text-success">{rep.postsCreated || 0}</div>
                  <div className="text-sm text-base-content/70">Posts</div>
                </div>
                <div className="text-center p-4 bg-base-200 rounded-lg">
                  <div className="text-2xl font-bold text-warning">{rep.reactionsReceived || 0}</div>
                  <div className="text-sm text-base-content/70">Reactions</div>
                </div>
                <div className="text-center p-4 bg-base-200 rounded-lg">
                  <div className="text-2xl font-bold text-accent">{rep.expertise.size}</div>
                  <div className="text-sm text-base-content/70">Topics</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expertise Tab */}
        {expandedSection === "expertise" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-base-content mb-4">Topic Expertise</h3>

              {expertiseTopics.length === 0 ? (
                <div className="text-center py-8">
                  <AcademicCapIcon className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                  <p className="text-base-content/70">
                    Start participating in discussions to build expertise in topics.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expertiseTopics.map((topic, index) => (
                    <div key={topic.topic} className="flex items-center space-x-4 p-3 bg-base-200 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-base-content">#{topic.topic}</span>
                            <span className={`badge ${topic.level.color} badge-xs`}>
                              {topic.level.level}
                            </span>
                          </div>
                          <span className="text-sm text-base-content/60">{topic.count} contributions</span>
                        </div>
                        <div className="w-full bg-base-300 rounded-full h-2">
                          <div
                            className={`h-full ${topic.level.color} rounded-full transition-all duration-500`}
                            style={{ width: `${getScoreProgress(topic.count, 20)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expertise Distribution */}
            {expertiseTopics.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-base-content mb-4">Expertise Distribution</h3>
                <div className="p-4 bg-base-200 rounded-lg">
                  <div className="space-y-3">
                    {expertiseTopics.slice(0, 5).map(topic => {
                      const percentage = (topic.count / Math.max(...expertiseTopics.map(t => t.count))) * 100;
                      return (
                        <div key={topic.topic} className="flex items-center space-x-3">
                          <span className="text-sm text-base-content/70 w-20 truncate">
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
            )}
          </div>
        )}

        {/* Activity Tab */}
        {expandedSection === "activity" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-base-content mb-4">Activity Analysis</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contribution Types */}
                <div className="p-4 bg-base-200 rounded-lg">
                  <h4 className="font-medium text-base-content mb-3">Contribution Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-base-content/70">Threads Created</span>
                      <span className="font-medium">{rep.threadsCreated || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-base-content/70">Posts Created</span>
                      <span className="font-medium">{rep.postsCreated || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-base-content/70">Reactions Given</span>
                      <span className="font-medium">{rep.reactionsReceived || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-base-content/70">Zaps Sent</span>
                      <span className="font-medium">{formatNumber(rep.zapSent || 0)} sats</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-base-content/70">Zaps Received</span>
                      <span className="font-medium">{formatNumber(rep.zapReceived || 0)} sats</span>
                    </div>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="p-4 bg-base-200 rounded-lg">
                  <h4 className="font-medium text-base-content mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-sm text-base-content/70">Active in community</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-warning rounded-full"></div>
                      <span className="text-sm text-base-content/70">Contributing to topics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-base-content/70">Building reputation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span className="text-sm text-base-content/70">Engaging with others</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Level Progress */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-medium text-base-content mb-3">Activity Level Progress</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/70">Current Level</span>
                  <span className={`font-medium ${getActivityLevelColor(rep.activityLevel)}`}>
                    {rep.activityLevel.charAt(0).toUpperCase() + rep.activityLevel.slice(1)} Activity
                  </span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      rep.activityLevel === 'high' ? 'bg-success' :
                      rep.activityLevel === 'medium' ? 'bg-warning' : 'bg-neutral'
                    }`}
                    style={{
                      width: rep.activityLevel === 'high' ? '100%' :
                             rep.activityLevel === 'medium' ? '60%' : '30%'
                    }}
                  />
                </div>
                <div className="text-xs text-base-content/60">
                  {rep.activityLevel === 'high' ? 'You are highly active in the community!' :
                   rep.activityLevel === 'medium' ? 'Good activity level. Keep it up!' :
                   'Try to engage more with the community to increase your activity level.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Impact Tab */}
        {expandedSection === "impact" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-base-content mb-4">Community Impact</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-success/10 border border-success/20 rounded-lg">
                  <LightningBoltIcon className="w-8 h-8 mx-auto text-success mb-2" />
                  <div className="text-2xl font-bold text-success">{formatNumber(totalScore)}</div>
                  <div className="text-sm text-base-content/70">Total Impact Score</div>
                </div>

                <div className="text-center p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <EyeIcon className="w-8 h-8 mx-auto text-warning mb-2" />
                  <div className="text-2xl font-bold text-warning">{formatNumber((rep.threadsCreated || 0) + (rep.postsCreated || 0))}</div>
                  <div className="text-sm text-base-content/70">Content Contributions</div>
                </div>

                <div className="text-center p-4 bg-info/10 border border-info/20 rounded-lg">
                  <TagIcon className="w-8 h-8 mx-auto text-info mb-2" />
                  <div className="text-2xl font-bold text-info">{rep.expertise.size}</div>
                  <div className="text-sm text-base-content/70">Topics Influenced</div>
                </div>
              </div>
            </div>

            {/* Impact Suggestions */}
            <div className="p-4 bg-base-200 rounded-lg">
              <h4 className="font-medium text-base-content mb-3">Ways to Increase Your Impact</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                  <StarIcon className="w-5 h-5 text-primary" />
                  <span className="text-sm text-base-content">Create high-quality threads and engage with responses</span>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                  <HeartIcon className="w-5 h-5 text-secondary" />
                  <span className="text-sm text-base-content">React to and comment on others' content</span>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                  <LightningBoltIcon className="w-5 h-5 text-accent" />
                  <span className="text-sm text-base-content">Support creators with zaps and tips</span>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                  <AcademicCapIcon className="w-5 h-5 text-warning" />
                  <span className="text-sm text-base-content">Focus on specific topics to build expertise</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserReputation;
