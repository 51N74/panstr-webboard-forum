"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OFFICIAL_ROOMS } from "../components/Header";

export default function CreatePost() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(OFFICIAL_ROOMS[0]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert("กรุณากรอกชื่อกระทู้และเนื้อหา");
      return;
    }

    setIsPublishing(true);

    // Simulate publishing to Nostr
    setTimeout(() => {
      console.log("Publishing post:", {
        title,
        content,
        room: selectedRoom.tag,
        kind: 23, // Long-form content
      });

      setIsPublishing(false);
      router.push(`/?room=${selectedRoom.tag.substring(1)}`);
    }, 2000);
  };

  const formatContent = (text) => {
    // Simple markdown-like formatting for preview
    return text
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
              <span className="text-sm text-gray-500">/ สร้างกระทู้</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  previewMode
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {previewMode ? "แก้ไข" : "ดูตัวอย่าง"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              สร้างกระทู้ใหม่
            </h1>
            <p className="text-gray-600">แชร์เรื่องราวของคุณกับชุมชน Nostr</p>
          </div>

          {!previewMode ? (
            <div className="p-6 space-y-6">
              {/* Room Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกห้อง
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {OFFICIAL_ROOMS.map((room) => (
                    <button
                      key={room.tag}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedRoom.tag === room.tag
                          ? `border-blue-500 ${room.color === "blue" ? "bg-blue-50" : room.color === "orange" ? "bg-orange-50" : room.color === "green" ? "bg-green-50" : "bg-purple-50"}`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{room.icon}</div>
                      <div className="font-medium text-sm">{room.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {room.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  ชื่อกระทู้
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="กรอกชื่อกระทู้ที่น่าสนใจ..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={200}
                />
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {title.length}/200
                </div>
              </div>

              {/* Content */}
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  เนื้อหากระทู้
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="เขียนเนื้อหากระทู้ของคุณ..."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                ></textarea>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    รองรับ Markdown: **ตัวหนา**, *ตัวเอียง*, #หัวข้อ
                  </div>
                  <div className="text-xs text-gray-500">
                    {content.length} ตัวอักษร
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <Link
                  href="/"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </Link>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !title.trim() || !content.trim()}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isPublishing || !title.trim() || !content.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : `bg-gradient-to-r ${selectedRoom.gradient} text-white hover:opacity-90`
                  }`}
                >
                  {isPublishing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>กำลังเผยแพร่...</span>
                    </div>
                  ) : (
                    "เผยแพร่กระทู้"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedRoom.color === "blue"
                        ? "bg-blue-100 text-blue-800"
                        : selectedRoom.color === "orange"
                          ? "bg-orange-100 text-orange-800"
                          : selectedRoom.color === "green"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {selectedRoom.tag}
                  </span>
                  <span className="text-sm text-gray-500">ตัวอย่างกระทู้</span>
                </div>

                {title && (
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    {title}
                  </h1>
                )}

                {content && (
                  <div
                    className="prose max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: `<p class="mb-4">${formatContent(content)}</p>`,
                    }}
                  />
                )}

                {!title && !content && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-lg mb-2">ยังไม่มีเนื้อหา</div>
                    <div className="text-sm">
                      กรุณากรอกชื่อกระทู้และเนื้อหาเพื่อดูตัวอย่าง
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setPreviewMode(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  กลับไปแก้ไข
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !title.trim() || !content.trim()}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isPublishing || !title.trim() || !content.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : `bg-gradient-to-r ${selectedRoom.gradient} text-white hover:opacity-90`
                  }`}
                >
                  {isPublishing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>กำลังเผยแพร่...</span>
                    </div>
                  ) : (
                    "เผยแพร่กระทู้"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            💡 เคล็ดลับสำหรับกระทู้ที่ดี
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• เลือกห้องที่เหมาะสมกับเนื้อหาของคุณ</li>
            <li>• ใช้ชื่อกระทู้ที่กระชับและน่าสนใจ</li>
            <li>• แบ่งเนื้อหาเป็นย่อหน้าให้อ่านง่าย</li>
            <li>• ใช้ Markdown เพื่อจัดรูปแบบข้อความให้สวยงาม</li>
            <li>• ตรวจสอบข้อมูลก่อนเผยแพร่</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
