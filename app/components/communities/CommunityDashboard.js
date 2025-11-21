/**
 * Community Dashboard Component
 * Main dashboard for managing moderated communities
 */

'use client';

import { useState, useEffect } from 'react';
import {
  getAvailableCommunities,
  getUserMemberships,
  getPendingPosts,
  isUserModerator,
  calculateCommunityHealth,
  COMMUNITY_TYPES,
  POST_STATUS
} from '../../lib/communities/nip72.js';

export default function CommunityDashboard({ userPubkey }) {
  const [communities, setCommunities] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [moderationData, setModerationData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');

  useEffect(() => {
    loadDashboardData();
  }, [userPubkey]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [availableCommunities, userMemberships] = await Promise.all([
        getAvailableCommunities(),
        userPubkey ? getUserMemberships(userPubkey) : []
      ]);

      setCommunities(availableCommunities);
      setMemberships(userMemberships);

      // Load moderation data for communities where user is moderator
      const moderationPromises = userMemberships.map(async (membership) => {
        const isMod = await isUserModerator(userPubkey, membership.communityId);
        if (isMod) {
          const pending = await getPendingPosts(membership.communityId);
          return {
            communityId: membership.communityId,
            pendingCount: pending.length,
            pendingPosts: pending
          };
        }
        return null;
      });

      const moderationResults = await Promise.all(moderationPromises);
      const modData = {};
      moderationResults.forEach(result => {
        if (result) {
          modData[result.communityId] = result;
        }
      });
      setModerationData(modData);

      // Set first moderated community as selected
      const moderatedCommunities = userMemberships.filter(m => modData[m.communityId]);
      if (moderatedCommunities.length > 0) {
        setSelectedCommunity(moderatedCommunities[0].communityId);
        setPendingPosts(modData[moderatedCommunities[0].communityId]?.pendingPosts || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async (postId, action, reason) => {
    // This would integrate with the moderation functions
    console.log('Moderation action:', { postId, action, reason });
    // Reload pending posts after action
    if (selectedCommunity) {
      const pending = await getPendingPosts(selectedCommunity);
      setPendingPosts(pending);
    }
  };

  const getCommunityById = (communityId) => {
    return communities.find(c => c.id === communityId);
  };

  const getMembershipForCommunity = (communityId) => {
    return memberships.find(m => m.communityId === communityId);
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      [COMMUNITY_TYPES.PUBLIC]: 'bg-green-100 text-green-800',
      [COMMUNITY_TYPES.RESTRICTED]: 'bg-yellow-100 text-yellow-800',
      [COMMUNITY_TYPES.PRIVATE]: 'bg-red-100 text-red-800',
      [COMMUNITY_TYPES.APPROVAL_REQUIRED]: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      [POST_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
      [POST_STATUS.APPROVED]: 'bg-green-100 text-green-800',
      [POST_STATUS.REJECTED]: 'bg-red-100 text-red-800',
      [POST_STATUS.REMOVED]: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateHealthScore = (community) => {
    // Mock health calculation - in real implementation would use actual stats
    return Math.floor(Math.random() * 40) + 60; // Random between 60-100
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const moderatedCommunities = memberships.filter(m => moderationData[m.communityId]);
  const joinedCommunities = memberships.filter(m => !moderationData[m.communityId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Community Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage and explore moderated communities</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'discover'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Discover Communities
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'joined'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              My Communities ({memberships.length})
            </button>
            {moderatedCommunities.length > 0 && (
              <button
                onClick={() => setActiveTab('moderate')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'moderate'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Moderate ({moderatedCommunities.length})
                {Object.values(moderationData).reduce((sum, m) => sum + m.pendingCount, 0) > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                    {Object.values(moderationData).reduce((sum, m) => sum + m.pendingCount, 0)}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Discover Communities */}
        {activeTab === 'discover' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => {
              const healthScore = calculateHealthScore(community);
              const membership = getMembershipForCommunity(community.id);
              const isMember = !!membership;

              return (
                <div key={community.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{community.definition.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          by {community.pubkey.substring(0, 8)}...
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeBadgeColor(community.definition.community_type)}`}>
                          {community.definition.community_type.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium">{healthScore}%</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-3">{community.definition.description}</p>

                    {community.definition.tags && community.definition.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {community.definition.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {community.definition.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{community.definition.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {isMember ? (
                        <button className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium">
                          Joined
                        </button>
                      ) : (
                        <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                          Join Community
                        </button>
                      )}
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* My Communities */}
        {activeTab === 'joined' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {joinedCommunities.map((membership) => {
              const community = getCommunityById(membership.communityId);
              if (!community) return null;

              return (
                <div key={membership.communityId} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{community.definition.name}</h3>
                      <p className="text-sm text-gray-600">
                        Joined {new Date(membership.membership.joined_at * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {membership.membership.role}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeBadgeColor(community.definition.community_type)}`}>
                        {community.definition.community_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{community.definition.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">--</p>
                      <p className="text-sm text-gray-600">Members</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">--</p>
                      <p className="text-sm text-gray-600">Posts</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      View Community
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Settings
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Moderate Communities */}
        {activeTab === 'moderate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Community List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-bold text-gray-900 mb-4">Communities to Moderate</h3>
                <div className="space-y-2">
                  {moderatedCommunities.map((membership) => {
                    const community = getCommunityById(membership.communityId);
                    const modData = moderationData[membership.communityId];

                    return (
                      <button
                        key={membership.communityId}
                        onClick={() => {
                          setSelectedCommunity(membership.communityId);
                          setPendingPosts(modData?.pendingPosts || []);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedCommunity === membership.communityId
                            ? 'bg-blue-50 border-2 border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">
                            {community?.definition.name}
                          </span>
                          {modData?.pendingCount > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              {modData.pendingCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pending Posts */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Pending Posts
                    {selectedCommunity && (
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        - {getCommunityById(selectedCommunity)?.definition.name}
                      </span>
                    )}
                  </h3>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Approve All
                  </button>
                </div>

                {pendingPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear!</h3>
                    <p className="text-gray-600">No posts pending approval.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPosts.map((post) => (
                      <div key={post.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(post.approval.status)}`}>
                                {post.approval.status}
                              </span>
                              <span className="text-sm text-gray-600">
                                by {post.author.substring(0, 8)}...
                              </span>
                              <span className="text-sm text-gray-600">
                                {new Date(post.created_at * 1000).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-900 font-medium mb-2">
                              Post Content Preview
                            </p>
                            <p className="text-gray-700 text-sm line-clamp-3">
                              {post.approval.post_content.substring(0, 200)}...
                            </p>
                          </div>
                        </div>

                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => handleModerationAction(post.postId, 'approve', '')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleModerationAction(post.postId, 'reject', 'Violation of community rules')}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleModerationAction(post.postId, 'request_changes', 'Please edit before resubmission')}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                          >
                            Request Changes
                          </button>
                          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            View Full Post
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
