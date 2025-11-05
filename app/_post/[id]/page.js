"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  initializePool,
  queryEvents,
  formatPubkey,
} from "../../lib/nostrClient";

// Official Room Configuration
const OFFICIAL_ROOMS = [
  {
    tag: "#BluePlanet",
    name: "Travel Diaries - เที่ยวไทย",
    description: "การท่องเที่ยว",
    icon: "🌍",
    color: "blue",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    tag: "#KlaoKrua",
    name: "Foodie Thailand - ครัว",
    description: "อาหาร, ทำอาหาร",
    icon: "🍳",
    color: "orange",
    gradient: "from-orange-500 to-red-600",
  },
  {
    tag: "#SinThorn",
    name: "Crypto Corner - การเงิน",
    description: "การเงิน, หุ้น",
    icon: "💰",
    color: "green",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    tag: "#Mbk",
    name: "Tech Hub Thailand - MBK",
    description: "เทคโนโลยี, มือถือ",
    icon: "📱",
    color: "purple",
    gradient: "from-purple-500 to-pink-600",
  },
];

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const [mainPost, setMainPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (params.id) {
      loadThread(params.id);
    }
  }, [params.id]);

  const loadThread = async (postId) => {
    setLoading(true);
    try {
      const pool = await initializePool();

      // Load main post (Kind 23)
      const mainPostEvents = await queryEvents(pool, undefined, {
        kinds: [23],
        ids: [postId],
        limit: 1,
      });

      if (mainPostEvents.length === 0) {
        router.push("/");
        return;
      }

      const post = mainPostEvents[0];
      setMainPost(post);

      // Load comments (Kind 1) with NIP-10 threading
      const commentEvents = await queryEvents(pool, undefined, {
        kinds: [1],
        "#e": [postId], // NIP-10: Reply to event
        limit: 50,
      });

      // Sort comments by timestamp and build thread structure
      const sortedComments = commentEvents.sort(
        (a, b) => a.created_at - b.created_at,
      );
      setComments(sortedComments);
    } catch (error) {
      console.error("Failed to load thread:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "เมื่อสักครู่";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diff / 86400000)} วันที่แล้ว`;
  };

  const getPostTitle = (event) => {
    const titleMatch = event.content.match(/^#\s+(.+)$/m);
    if (titleMatch) return titleMatch[1];

    const titleTag = event.tags?.find((tag) => tag[0] === "title");
    if (titleTag) return titleTag[1];

    return "กระทู้ไม่มีชื่อ";
  };

  const getRoomForTag = (tag) => {
    return OFFICIAL_ROOMS.find((room) => room.tag === `#${tag}`);
  };

  const renderContent = (content) => {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/^#\s+(.+)$/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(
        /^##\s+(.+)$/gm,
        '<h2 class="text-xl font-semibold mb-3">$1</h2>',
      )
      .replace(/^###\s+(.+)$/gm, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, "<br />");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!mainPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบกระทู้</h2>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            กลับไปหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  const roomTag = mainPost.tags?.find((tag) => tag[0] === "t")?.[1];
  const room = roomTag ? getRoomForTag(roomTag) : OFFICIAL_ROOMS[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded"></div>
                <span className="font-bold text-gray-900">Panstr</span>
              </Link>
              {room && (
                <span className="text-sm text-gray-500">/ {room.name}</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700">
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m9.032 4.026A9.001 9.001 0 012.968 10.326m9.032 4.026a9.001 9.001 0 01-9.032-4.026"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Post */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">
                      ผู้เขียนกระทู้
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500 font-mono">
                        {formatPubkey(mainPost.pubkey, "short")}
                      </span>
                      {/* NIP-05 Verified Badge */}
                      <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>NIP-05</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatTime(mainPost.created_at)}
                  </div>
                </div>
              </div>
              {room && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    room.color === "blue"
                      ? "bg-blue-100 text-blue-800"
                      : room.color === "orange"
                        ? "bg-orange-100 text-orange-800"
                        : room.color === "green"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {room.tag}
                </span>
              )}
            </div>

            {/* Post Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {getPostTitle(mainPost)}
            </h1>

            {/* Post Content */}
            <div
              className="prose max-w-none text-gray-700 mb-8"
              dangerouslySetInnerHTML={{
                __html: `<p class="mb-4">${renderContent(mainPost.content)}</p>`,
              }}
            />

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 text-gray-500 hover:text-red-600 transition-colors">
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
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="text-sm">ถูกใจ</span>
                </button>

                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-sm">{comments.length} ความคิดเห็น</span>
                </button>

                <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="text-sm font-medium">⚡ Zap</span>
                </button>
              </div>

              <button className="text-gray-500 hover:text-gray-700 transition-colors">
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m9.032 4.026A9.001 9.001 0 012.968 10.326m9.032 4.026a9.001 9.001 0 01-9.032-4.026"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              ความคิดเห็น ({comments.length})
            </h2>
          </div>

          {/* Add Comment */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="เขียนความคิดเห็น..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    ส่งความคิดเห็น
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="divide-y divide-gray-200">
            {comments.map((comment) => (
              <Comment key={comment.id} comment={comment} />
            ))}

            {comments.length === 0 && (
              <div className="p-8 text-center text-gray-500">
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
                <p>ยังไม่มีความคิดเห็น</p>
                <p className="text-sm mt-2">
                  เป็นคนแรกที่แสดงความคิดเห็นในกระทู้นี้
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Comment Component
function Comment({ comment }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "เมื่อสักครู่";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diff / 86400000)} วันที่แล้ว`;
  };

  // Use the imported formatPubkey function from nostrClient.js
  // Local formatPubkey function removed to avoid conflicts

  // Check if user is verified (mock implementation)
  const isVerified = Math.random() > 0.5;

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-gray-900">ผู้ใช้ Nostr</span>
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-gray-500 font-mono">
                {formatPubkey(comment.pubkey, "short")}
              </span>
              {isVerified ? (
                <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>NIP-05</span>
                </div>
              ) : (
                <div className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  ไม่ยืนยันตัวตน
                </div>
              )}
            </div>
            <span className="text-gray-500 text-sm">
              • {formatTime(comment.created_at)}
            </span>
          </div>

          <div className="text-gray-700 text-sm leading-relaxed">
            {comment.content}
          </div>

          <div className="flex items-center space-x-4 mt-3">
            <button className="text-gray-500 hover:text-red-600 text-sm transition-colors">
              <svg
                className="w-4 h-4 inline mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              ถูกใจ
            </button>

            <button className="text-gray-500 hover:text-green-600 text-sm transition-colors">
              <svg
                className="w-4 h-4 inline mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              ⚡ Zap
            </button>

            <button className="text-gray-500 hover:text-blue-600 text-sm transition-colors">
              <svg
                className="w-4 h-4 inline mr-1"
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
              ตอบกลับ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
