"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useNostrAuth } from "../context/NostrAuthContext";
import { OFFICIAL_ROOMS } from "../data/boardsConfig";
import NostrLoginModal from "./NostrLoginModal";
import SearchComponent from "./search/SearchComponent";
import Notifications from "./notifications/Notifications";
import UserProfile from "./profiles/UserProfile";
import { formatPubkey, getAllRelays, testRelay } from "../lib/nostrClient";

/**
 * Header component - updated to use new board configuration
 * This provides navigation to all rooms and manages user authentication
 */

export default function Header() {
  const { user, isLoading, logout } = useNostrAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [relayCount, setRelayCount] = useState(0);
  const dropdownRef = useRef(null);

  // Check relay connections on mount
  useEffect(() => {
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Set up global profile display function
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.showUserProfile = (pubkey) => {
        const profileModal = document.createElement("div");
        profileModal.id = "profile-modal";
        document.body.appendChild(profileModal);

        const { createRoot } = require("react-dom/client");
        const root = createRoot(profileModal);

        const handleClose = () => {
          root.unmount();
          document.body.removeChild(profileModal);
        };

        root.render(
          <UserProfile pubkey={pubkey} onClose={handleClose} isModal={true} />,
        );
      };
    }
  }, []);

  const checkRelays = async () => {
    const relays = getAllRelays();
    let connected = 0;
    const status = {};

    await Promise.all(
      relays.map(async (relay) => {
        try {
          const result = await testRelay(relay);
          status[relay] = result.connected;
          if (result.connected) connected++;
        } catch (err) {
          status[relay] = false;
        }
      }),
    );

    setRelayCount(connected);
    return { connected, status };
  };

  if (isLoading) {
    return (
      <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <span className="text-3xl animate-pulse">🌏</span>
              <span className="text-xl font-bold gradient-text">
                Panstr Forum
              </span>
            </div>
            <div className="loading loading-spinner loading-sm text-blue-600"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-all duration-200 group"
            >
              <span className="text-3xl group-hover:animate-pulse">🌏</span>
              <span className="text-xl font-bold gradient-text">
                Panstr Forum
              </span>
            </Link>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden flex-1 mx-4">
            <SearchComponent compact={true} />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium relative group"
            >
              Forums
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-200"></span>
            </Link>
            <div className="relative group">
              <button className="text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium flex items-center space-x-2 group">
                <span>Rooms</span>
                <svg
                  className="w-4 h-4 transform group-hover:rotate-180 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Room Dropdown */}
              <div className="absolute top-full left-0 mt-3 w-96 glass-morphism rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                <div className="p-6 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    {OFFICIAL_ROOMS.map((room) => (
                      <Link
                        key={room.tag}
                        href={`/room/${room.tag.substring(1)}`}
                        className="group/room flex items-center space-x-3 p-4 rounded-xl hover:bg-white/60 transition-all duration-200 border border-transparent hover:border-gray-200/50"
                      >
                        <span className="text-2xl group-hover/room:scale-110 transition-transform duration-200">
                          {room.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate text-gray-800 group-hover/room:text-blue-600 transition-colors">
                            {room.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {room.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block">
              <SearchComponent compact={true} />
            </div>

            {/* Relay Status */}
            <div className="hidden sm:flex items-center space-x-2 text-sm px-3 py-1.5 rounded-full bg-gray-100/80 backdrop-blur-sm">
              <div
                className={`w-2 h-2 rounded-full ${relayCount > 0 ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
              ></div>
              <span className="text-gray-600 font-medium">
                {relayCount} relays
              </span>
            </div>

            {/* Notifications */}
            {user && <Notifications compact={true} />}

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100/60 transition-all duration-200 group"
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || "User"}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white group-hover:ring-blue-500/50 transition-all duration-200"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md group-hover:shadow-lg transition-all duration-200">
                      {user.name?.[0]?.toUpperCase() ||
                        user.npub?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <svg
                    className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transform group-hover:rotate-180 transition-all duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-3 w-80 glass-morphism rounded-2xl shadow-2xl p-6 z-50 animate-fade-in">
                    <div className="flex items-center space-x-4 pb-4 border-b border-gray-200/50 mb-4">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name || "User"}
                          className="w-14 h-14 rounded-full object-cover ring-3 ring-white shadow-lg"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                          {user.name?.[0]?.toUpperCase() ||
                            user.npub?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-800 truncate text-base">
                          {user.display_name || user.name || "Anonymous"}
                        </div>
                        <div className="text-sm text-gray-500 font-mono truncate">
                          {user.npub?.substring(0, 16)}...
                        </div>
                        {user.nip05 && (
                          <div className="text-xs text-green-600 flex items-center space-x-1 mt-2 px-2 py-1 bg-green-50/80 rounded-full w-fit">
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
                            <span className="font-medium">{user.nip05}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Link
                        href="/profile"
                        className="block w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100/60 transition-all duration-200 text-gray-700 hover:text-blue-600 font-medium"
                      >
                        👤 My Profile
                      </Link>
                      <div className="border-t border-gray-200/50 my-2"></div>
                      <div className="text-xs font-semibold text-gray-500 px-4 py-2 uppercase tracking-wider">
                        Professional Features
                      </div>
                      <Link
                        href="/services"
                        className="block w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100/60 transition-all duration-200 text-gray-700 hover:text-blue-600 font-medium"
                      >
                        🏪 Service Marketplace
                      </Link>
                      <Link
                        href="/communities"
                        className="block w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100/60 transition-all duration-200 text-gray-700 hover:text-blue-600 font-medium"
                      >
                        🏛️ Communities
                      </Link>
                      <Link
                        href="/wiki"
                        className="block w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100/60 transition-all duration-200 text-gray-700 hover:text-blue-600 font-medium"
                      >
                        📚 Wiki System
                      </Link>
                      <div className="border-t border-gray-200/50 my-2"></div>
                      <Link
                        href="/settings"
                        className="block w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100/60 transition-all duration-200 text-gray-700 hover:text-blue-600 font-medium"
                      >
                        ⚙️ Settings
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 text-red-600 hover:text-red-700 font-medium"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="modern-button-primary text-sm px-5 py-2.5 shadow-lg hover:shadow-xl"
              >
                🔗 Connect Nostr
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <NostrLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </header>
  );
}
