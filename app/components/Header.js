"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useNostrAuth } from "../context/NostrAuthContext";
import NostrLoginModal from "./NostrLoginModal";
import { formatPubkey, getAllRelays, testRelay } from "../lib/nostrClient";

/**
 * Header component - merged the main page header + official rooms navigation
 * and the previous Nostr auth header logic. This component manages its own
 * active room and relay check logic. If a parent wants to synchronize room
 * changes it can pass an `onRoomChange` callback prop.
 */

// Official Room Configuration - copied from page to keep the same logic
export const OFFICIAL_ROOMS = [
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

export default function Header({
  activeRoom,
  setActiveRoom,
  setShowCreatePost,
} = {}) {
  const { user, isLoading, error, logout } = useNostrAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Header is fully controlled for activeRoom; keep relayCount internal
  const [relayCount, setRelayCount] = useState(0);

  useEffect(() => {
    // When the controlled activeRoom prop changes, refresh relay status
    checkRelays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom]);

  useEffect(() => {
    // initial check on mount
    checkRelays();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkRelays = async () => {
    try {
      const relays = getAllRelays();
      let connected = 0;

      await Promise.all(
        relays.map(async (relay) => {
          const status = await testRelay(relay);
          if (status.connected) connected++;
        }),
      );

      setRelayCount(connected);
    } catch (err) {
      console.error("Failed to check relays:", err);
      setRelayCount(0);
    }
  };

  // Render loading state for auth
  if (isLoading) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Panstr</span>
              </Link>
            </div>

            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาในห้องที่เลือก..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="loading loading-spinner loading-sm"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Panstr</span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาในห้องที่เลือก..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* User Profile / Actions */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700">
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>

              {/* If no user, show connect button; otherwise show avatar dropdown (kept from original Header) */}
              {!user ? (
                <>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-gray-600"
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
                    <span className="text-sm font-medium text-gray-700">
                      เข้าสู่ระบบ
                    </span>
                  </button>
                  <NostrLoginModal
                    isOpen={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                  />
                </>
              ) : (
                <div className="flex-none gap-2">
                  {/* <div className="form-control">
                    <button
                      onClick={() =>
                        setShowCreatePost && setShowCreatePost(true)
                      }
                      className="btn btn-outline btn-primary"
                    >
                      Create Post
                    </button>
                  </div>*/}

                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() =>
                        setIsProfileDropdownOpen(!isProfileDropdownOpen)
                      }
                      className="relative flex items-center justify-center w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all"
                    >
                      <img
                        src={user.picture}
                        alt={user.display_name || user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://robohash.org/${user.pubkey}.png`;
                        }}
                      />
                    </button>

                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {user.display_name || user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPubkey(user.pubkey, "short")}
                          </p>
                          {user.nip05 && (
                            <p className="text-xs text-green-600 flex items-center mt-1">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {user.nip05}
                            </p>
                          )}
                        </div>

                        <Link
                          href="/user/profile"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <div className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Profile
                          </div>
                        </Link>

                        <Link
                          href="/user/settings"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <div className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            Settings
                          </div>
                        </Link>

                        <div className="border-t border-gray-100 my-1"></div>

                        <button
                          onClick={() => {
                            logout();
                            setIsProfileDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Official Rooms Navigation */}
        <nav className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {OFFICIAL_ROOMS.map((room) => (
                <button
                  key={room.tag}
                  onClick={() => setActiveRoom && setActiveRoom(room)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeRoom && activeRoom.tag === room.tag
                      ? `border-blue-500 text-blue-600`
                      : `border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{room.icon}</span>
                    <div>
                      <div className="font-semibold">{room.name}</div>
                      <div className="text-xs text-gray-500">
                        {room.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
