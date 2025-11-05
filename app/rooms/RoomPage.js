'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRoomById, getCategoryByRoomId } from '../data/boardsConfig';
import { useNostr } from '../context/NostrContext';
import Link from 'next/link';
import ThreadCard from '../components/ThreadCard';

export default function RoomPage({ roomId }) {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const [filter, setFilter] = useState('all');
  const { getEvents } = useNostr();

  const room = getRoomById(roomId);
  const category = getCategoryByRoomId(roomId);

  useEffect(() => {
    if (!room) {
      router.push('/');
      return;
    }
    fetchThreads();
  }, [roomId, sortBy, filter]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const filters = {
        kinds: [30023], // Long-form posts
        '#t': ['forum'],
        '#board': [roomId],
        limit: 100
      };

      let events = await getEvents(filters);

      // Apply filters
      if (filter === 'pinned') {
        events = events.filter(event =>
          event.tags.some(tag => tag[0] === 'pinned' && tag[1] === 'true')
        );
      } else if (filter === 'unlocked') {
        events = events.filter(event =>
          !event.tags.some(tag => tag[0] === 'locked' && tag[1] === 'true')
        );
      }

      // Apply sorting
      switch (sortBy) {
        case 'latest':
          events.sort((a, b) => b.created_at - a.created_at);
          break;
        case 'oldest':
          events.sort((a, b) => a.created_at - b.created_at);
          break;
        case 'replies':
          // Sort by reply count (would need additional data)
          events.sort((a, b) => {
            const aReplies = a.tags.find(tag => tag[0] === 'reply_count')?.[1] || 0;
            const bReplies = b.tags.find(tag => tag[0] === 'reply_count')?.[1] || 0;
            return parseInt(bReplies) - parseInt(aReplies);
          });
          break;
      }

      setThreads(events);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Room Not Found</h2>
          <Link href="/" className="btn btn-primary">
            Back to Forums
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className={`bg-gradient-to-r ${room.gradient} text-white p-8`}>
        <div className="container mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm mb-4 opacity-90">
            <Link href="/" className="hover:underline">Home</Link>
            <span>›</span>
            <Link href={`/category/${category.id}`} className="hover:underline">
              {category.name}
            </Link>
            <span>›</span>
            <span>{room.name}</span>
          </nav>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">{room.icon}</span>
              <div>
                <h1 className="text-3xl font-bold">{room.name}</h1>
                <p className="text-white/90">{room.description}</p>
              </div>
            </div>
            <Link href={`/room/${roomId}/new`} className="btn btn-primary bg-white text-gray-900 hover:bg-gray-100 border-none">
              Create New Thread
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Sort by:</span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="replies">Most Replies</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Filter:</span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Threads</option>
                <option value="pinned">Pinned Only</option>
                <option value="unlocked">Unlocked</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-base-content/70">
            {threads.length} thread{threads.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        ) : threads.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 bg-base-100 rounded-lg">
            <div className="text-6xl mb-4 opacity-50">📭</div>
            <h3 className="text-xl font-semibold mb-2">No threads yet</h3>
            <p className="text-base-content/70 mb-6">
              Be the first to start a conversation in {room.name}!
            </p>
            <Link href={`/room/${roomId}/new`} className="btn btn-primary">
              Create First Thread
            </Link>
          </div>
        ) : (
          /* Thread List */
          <div className="space-y-4">
            {threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} roomId={roomId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
