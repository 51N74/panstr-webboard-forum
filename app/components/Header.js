"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useNostrAuth } from "../context/NostrAuthContext";
import { OFFICIAL_ROOMS } from "../data/boardsConfig";
import NostrLoginModal from "./NostrLoginModal";
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
      <header className="bg-base-100 border-b border-base-300 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <span className="text-2xl">🌏</span>
              <span className="text-xl font-bold text-base-content">
                Panstr Forum
              </span>
            </div>
            <div className="loading loading-spinner loading-sm"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-base-100 border-b border-base-300 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl">🌏</span>
              <span className="text-xl font-bold text-base-content">
                Panstr Forum
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-base-content hover:text-primary transition-colors font-medium"
            >
              Forums
            </Link>
            <div className="relative group">
              <button className="text-base-content hover:text-primary transition-colors font-medium flex items-center space-x-1">
                <span>Rooms</span>
                <svg
                  className="w-4 h-4"
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
              <div className="absolute top-full left-0 mt-2 w-80 bg-base-100 border border-base-300 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="p-4 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {OFFICIAL_ROOMS.map((room) => (
                      <Link
                        key={room.tag}
                        href={`/room/${room.tag.substring(1)}`}
                        className="flex items-center space-x-2 p-3 rounded-lg hover:bg-base-200 transition-colors"
                      >
                        <span className="text-xl">{room.icon}</span>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {room.name}
                          </div>
                          <div className="text-xs text-base-content/60 truncate">
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
            {/* Relay Status */}
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${relayCount > 0 ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <span className="text-base-content/60">{relayCount} relays</span>
            </div>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-base-200 transition-colors"
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || "User"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center font-medium">
                      {user.name?.[0]?.toUpperCase() ||
                        user.npub?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <svg
                    className="w-4 h-4 text-base-content/60"
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
                  <div className="absolute top-full right-0 mt-2 w-72 bg-base-100 border border-base-300 rounded-lg shadow-xl p-4 z-50">
                    <div className="flex items-center space-x-3 pb-3 border-b border-base-300 mb-3">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name || "User"}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary text-primary-content rounded-full flex items-center justify-center font-bold text-lg">
                          {user.name?.[0]?.toUpperCase() ||
                            user.npub?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-base-content truncate">
                          {user.display_name || user.name || "Anonymous"}
                        </div>
                        <div className="text-sm text-base-content/60 font-mono truncate">
                          {user.npub?.substring(0, 12)}...
                        </div>
                        {user.nip05 && (
                          <div className="text-xs text-green-600 flex items-center space-x-1 mt-1">
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
                            <span>{user.nip05}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Link
                        href="/profile"
                        className="block w-full text-left px-3 py-2 rounded-lg hover:bg-base-200 transition-colors"
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="block w-full text-left px-3 py-2 rounded-lg hover:bg-base-200 transition-colors"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 rounded-lg hover:bg-base-200 transition-colors text-error"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="btn btn-primary btn-sm"
              >
                Connect Nostr
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
