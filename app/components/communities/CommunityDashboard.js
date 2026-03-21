/**
 * Community Dashboard Component
 * Updated for official NIP-72 specification
 */

'use client';

import { useState, useEffect } from 'react';
import {
  getAvailableCommunities,
  getCommunityPosts,
  isUserModerator,
  createCommunityDefinition,
  NIP72_KINDS
} from '../../lib/communities/nip72.js';
import { initializePool, publishToPool, finalizeEvent } from '../../lib/nostrClient.js';
import ThreadCard from '../ThreadCard';

export default function CommunityDashboard({ userPubkey }) {
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunity, setNewCommunity] = useState({ name: '', description: '', image: '' });

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const available = await getAvailableCommunities();
      setCommunities(available);
      if (available.length > 0 && !selectedCommunity) {
        handleSelectCommunity(available[0]);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCommunity = async (community) => {
    setSelectedCommunity(community);
    setActiveTab('posts');
    setPostsLoading(true);
    try {
      const posts = await getCommunityPosts(community.id, community.pubkey);
      setCommunityPosts(posts);
    } catch (error) {
      console.error('Error loading community posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!userPubkey) return alert("Please login first");

    try {
      const pool = await initializePool();
      const eventTemplate = createCommunityDefinition({
        ...newCommunity,
        moderators: [userPubkey]
      });

      let signedEvent;
      if (window.nostr) {
        signedEvent = await window.nostr.signEvent(eventTemplate);
      } else {
        const storedHexKey = localStorage.getItem("nostr_private_key");
        if (!storedHexKey) throw new Error("No private key found");
        const privateKeyBytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          privateKeyBytes[i] = parseInt(storedHexKey.substr(i * 2, 2), 16);
        }
        signedEvent = finalizeEvent(eventTemplate, privateKeyBytes);
      }

      await publishToPool(pool, undefined, undefined, "", signedEvent);
      setShowCreateModal(false);
      loadCommunities();
    } catch (error) {
      console.error('Error creating community:', error);
      alert("Failed to create community: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nostr Communities</h1>
          <p className="text-gray-600 mt-1">Discover moderated spaces on the Nostr protocol (NIP-72)</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + Create Community
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Community List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Explore</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {communities.map((community) => (
                <button
                  key={`${community.pubkey}-${community.id}`}
                  onClick={() => handleSelectCommunity(community)}
                  className={`w-full text-left p-4 hover:bg-blue-50 transition-colors flex items-center space-x-3 ${
                    selectedCommunity?.id === community.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {community.image ? (
                        <img src={community.image} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : community.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{community.name}</p>
                    <p className="text-xs text-gray-500 truncate">by {community.pubkey.substring(0, 8)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {selectedCommunity ? (
            <div className="space-y-6">
              {/* Community Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCommunity.name}</h2>
                    <p className="text-gray-600 mt-2">{selectedCommunity.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                       Moderated
                    </span>
                    {isUserModerator(userPubkey, selectedCommunity) && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
                            Admin
                        </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500 pt-4 border-t border-gray-50">
                    <div className="flex items-center space-x-1">
                        <span className="font-bold text-gray-900">{selectedCommunity.moderators?.length || 0}</span>
                        <span>Moderators</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="font-bold text-gray-900">{communityPosts.length}</span>
                        <span>Approved Posts</span>
                    </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 border-b border-gray-200">
                <button 
                  onClick={() => setActiveTab('posts')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'posts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Posts
                </button>
                <button 
                  onClick={() => setActiveTab('about')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'about' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  About & Rules
                </button>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === 'posts' && (
                  <div className="space-y-4">
                    {postsLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : communityPosts.length > 0 ? (
                      communityPosts.map(post => (
                        <ThreadCard key={post.id} thread={post} roomId="communities" />
                      ))
                    ) : (
                      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No approved posts yet in this community.</p>
                        <button className="mt-4 text-blue-600 font-medium hover:underline">
                          Be the first to post!
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Moderators</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCommunity.moderators?.map(mod => (
                        <div key={mod} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                            {mod.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{mod.substring(0, 16)}...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <div className="text-6xl mb-6">🏛️</div>
              <h2 className="text-2xl font-bold text-gray-900">Select a Community</h2>
              <p className="text-gray-600 mt-2 max-w-md mx-auto">
                Select a community from the sidebar to explore its content or create your own space.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Create New Community</h3>
            </div>
            <form onSubmit={handleCreateCommunity} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Community Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g. Bitcoin Enthusiasts"
                  value={newCommunity.name}
                  onChange={e => setNewCommunity({...newCommunity, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-24"
                  placeholder="What is this community about?"
                  value={newCommunity.description}
                  onChange={e => setNewCommunity({...newCommunity, description: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                <input 
                  type="url" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="https://example.com/image.png"
                  value={newCommunity.image}
                  onChange={e => setNewCommunity({...newCommunity, image: e.target.value})}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
