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
    <header className="bg-white/95 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-90 transition-all duration-300 group"
            >
              <div className="relative">
                <span className="text-4xl group-hover:scale-110 transition-transform duration-300 inline-block">🌏</span>
                <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full group-hover:bg-blue-500/30 transition-all duration-300"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold gradient-text tracking-tight">
                  Panstr Forum
                </span>
                <span className="text-xs text-gray-500 font-medium">Decentralized Discussions</span>
              </div>
            </Link>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden flex-1 mx-4">
            <SearchComponent compact={true} />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-10">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-semibold relative group text-base"
            >
              <span className="relative z-10">Forums</span>
              <span className="absolute -bottom-2 left-0 w-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300 rounded-full"></span>
            </Link>
            <div className="relative group">
              <button className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-semibold flex items-center space-x-2 group text-base">
                <span className="relative z-10">Rooms</span>
                <svg
                  className="w-5 h-5 transform group-hover:rotate-180 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Enhanced Room Dropdown */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[600px] glass-morphism rounded-3xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 transform group-hover:translate-y-0 translate-y-4 border-2 border-white/40">
                <div className="p-8">
                  {/* Dropdown Header */}
                  <div className="mb-6 pb-4 border-b border-gray-200/50">
                    <h3 className="text-xl font-bold gradient-text mb-1">Explore Rooms</h3>
                    <p className="text-sm text-gray-600">Join conversations across different topics</p>
                  </div>

                  {/* Rooms Grid */}
                  <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {OFFICIAL_ROOMS.map((room) => (
                      <Link
                        key={room.tag}
                        href={`/room/${room.tag.substring(1)}`}
                        className="group/room relative flex items-start space-x-4 p-5 rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border-2 border-transparent hover:border-blue-200/50 hover:shadow-lg transform hover:-translate-y-1"
                      >
                        {/* Icon with glow effect */}
                        <div className="relative flex-shrink-0">
                          <span className="text-3xl group-hover/room:scale-125 transition-transform duration-300 inline-block filter drop-shadow-lg">
                            {room.icon}
                          </span>
                          <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full opacity-0 group-hover/room:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Room Info */}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-base text-gray-800 group-hover/room:text-blue-600 transition-colors duration-300 mb-1">
                            {room.name}
                          </div>
                          <div className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                            {room.description}
                          </div>

                          {/* Hover indicator */}
                          <div className="mt-2 flex items-center space-x-1 text-blue-600 opacity-0 group-hover/room:opacity-100 transition-all duration-300 transform translate-x-0 group-hover/room:translate-x-1">
                            <span className="text-xs font-semibold">Visit Room</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>

                        {/* Decorative corner accent */}
                        <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover/room:opacity-100 transition-opacity duration-300"></div>
                      </Link>
                    ))}
                  </div>

                  {/* Footer CTA */}
                  <div className="mt-6 pt-4 border-t border-gray-200/50 text-center">
                    <Link
                      href="/"
                      className="inline-flex items-center space-x-2 text-sm font-semibold text-blue-600 hover:text-purple-600 transition-colors duration-300"
                    >
                      <span>View All Rooms</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-5">
            {/* Enhanced Search */}
            <div className="hidden md:block">
              <div className="relative group/search">
                <SearchComponent compact={true} />
              </div>
            </div>

            {/* Enhanced Relay Status */}
            <div className="hidden sm:flex items-center space-x-2.5 text-sm px-4 py-2 rounded-full bg-gradient-to-r from-gray-100/90 to-gray-50/90 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="relative">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${relayCount > 0 ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                ></div>
                {relayCount > 0 && (
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                )}
              </div>
              <span className="text-gray-700 font-semibold">
                {relayCount} {relayCount === 1 ? 'relay' : 'relays'}
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
                  className="flex items-center space-x-3 p-2.5 rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group border-2 border-transparent hover:border-blue-200/50"
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || "User"}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-blue-400 transition-all duration-300 shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-base shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                      {user.name?.[0]?.toUpperCase() ||
                        user.npub?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <svg
                    className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transform group-hover:rotate-180 transition-all duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-4 w-80 glass-morphism rounded-3xl shadow-2xl p-6 z-50 animate-fade-in border-2 border-white/40">
                    <div className="flex items-center space-x-4 pb-5 border-b border-gray-200/50 mb-4">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name || "User"}
                          className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-xl"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-xl">
                          {user.name?.[0]?.toUpperCase() ||
                            user.npub?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900 truncate text-lg">
                          {user.display_name || user.name || "Anonymous"}
                        </div>
                        <div className="text-xs text-gray-500 font-mono truncate">
                          {user.npub?.substring(0, 16)}...
                        </div>
                        {user.nip05 && (
                          <div className="text-xs text-green-600 flex items-center space-x-1 mt-2 px-2.5 py-1 bg-green-50/90 rounded-full w-fit border border-green-200/50">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="font-semibold">{user.nip05}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Link
                        href="/profile"
                        className="block w-full text-left px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 text-gray-700 hover:text-blue-600 font-semibold border border-transparent hover:border-blue-200/50"
                      >
                        👤 My Profile
                      </Link>
                      <div className="border-t border-gray-200/50 my-3"></div>
                      <div className="text-xs font-bold text-gray-500 px-4 py-2 uppercase tracking-wider">
                        Professional Features
                      </div>
                      <Link
                        href="/services"
                        className="block w-full text-left px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 text-gray-700 hover:text-blue-600 font-semibold border border-transparent hover:border-blue-200/50"
                      >
                        🏪 Service Marketplace
                      </Link>
                      <Link
                        href="/communities"
                        className="block w-full text-left px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 text-gray-700 hover:text-blue-600 font-semibold border border-transparent hover:border-blue-200/50"
                      >
                        🏛️ Communities
                      </Link>
                      <Link
                        href="/wiki"
                        className="block w-full text-left px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 text-gray-700 hover:text-blue-600 font-semibold border border-transparent hover:border-blue-200/50"
                      >
                        📚 Wiki System
                      </Link>
                      <div className="border-t border-gray-200/50 my-3"></div>
                      <Link
                        href="/settings"
                        className="block w-full text-left px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 text-gray-700 hover:text-blue-600 font-semibold border border-transparent hover:border-blue-200/50"
                      >
                        ⚙️ Settings
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-300 text-red-600 hover:text-red-700 font-semibold border border-transparent hover:border-red-200/50"
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
                className="modern-button-primary text-sm px-6 py-3 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
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
