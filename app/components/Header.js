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
 * Header component - The Curator Design System
 * Elegant, modern navbar with Material 3 inspired styling
 */

export default function Header() {
  const { user, isLoading, logout } = useNostrAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [relayCount, setRelayCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    checkRelays();
  }, []);

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
      <header className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-xl shadow-[0px_12px_32px_rgba(24,25,51,0.06)]">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-screen-2xl mx-auto">
          <div className="flex items-center space-x-3">
            <span className="text-3xl animate-pulse">🌏</span>
            <span className="text-2xl font-black text-primary tracking-tighter">
              Panstr
            </span>
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-xl shadow-[0px_12px_32px_rgba(24,25,51,0.06)]">
      <div className="flex justify-between items-center px-4 sm:px-6 py-4 w-full max-w-screen-2xl mx-auto">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-2xl font-black text-primary tracking-tighter hover:opacity-80 transition-opacity"
          >
            <span className="flex items-center gap-2">
              <span className="text-3xl">🌏</span>
              <span className="hidden sm:inline">Panstr</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link
              href="/"
              className="font-['Manrope'] font-bold text-lg tracking-tight text-secondary opacity-80 hover:text-primary hover:opacity-100 transition-all duration-300 relative group"
            >
              Forums
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-tertiary group-hover:w-full transition-all duration-300"></span>
            </Link>
            <div className="relative group">
              <button className="font-['Manrope'] font-bold text-lg tracking-tight text-secondary opacity-80 hover:text-primary hover:opacity-100 transition-all duration-300 flex items-center gap-2">
                Rooms
                <span className="material-symbols-outlined text-base transform group-hover:rotate-180 transition-transform duration-300">
                  expand_more
                </span>
              </button>

              {/* Enhanced Room Dropdown - The Curator Style */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[650px] bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(24,25,51,0.08)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 border border-outline-variant/20 z-50">
                <div className="p-6">
                  <div className="mb-4 pb-4 border-b border-outline-variant/15">
                    <h3 className="text-lg font-bold text-primary mb-1">Explore Rooms</h3>
                    <p className="text-sm text-secondary">Join conversations across different topics</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-[450px] overflow-y-auto custom-scrollbar">
                    {OFFICIAL_ROOMS.map((room) => (
                      <Link
                        key={room.tag}
                        href={`/room/${room.tag.substring(1)}`}
                        className="group/room flex items-start gap-4 p-4 rounded-xl hover:bg-surface-container-high transition-all duration-300 border border-transparent hover:border-outline-variant/30"
                      >
                        <span className="text-2xl group-hover/room:scale-125 transition-transform duration-300">
                          {room.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-primary group-hover/room:text-tertiary transition-colors duration-300 mb-1">
                            {room.name}
                          </div>
                          <div className="text-xs text-on-surface-variant line-clamp-2">
                            {room.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Link
              href="/communities"
              className="font-['Manrope'] font-bold text-lg tracking-tight text-secondary opacity-80 hover:text-primary hover:opacity-100 transition-all duration-300"
            >
              Communities
            </Link>
            <Link
              href="/discovery"
              className="font-['Manrope'] font-bold text-lg tracking-tight text-tertiary border-b-2 border-tertiary pb-0.5"
            >
              Discover
            </Link>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search - Desktop */}
          <div className="hidden sm:flex items-center bg-surface-container-highest rounded-full px-4 py-2 gap-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <span className="material-symbols-outlined text-outline text-sm">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-40 lg:w-56 font-body text-on-surface placeholder:text-on-surface-variant/50"
              placeholder="Search protocol..."
              type="text"
            />
          </div>

          {/* Relay Status - Desktop */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/20 text-xs font-bold text-secondary">
            <div className="relative">
              <div
                className={`w-2 h-2 rounded-full ${relayCount > 0 ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              {relayCount > 0 && (
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
              )}
            </div>
            <span>{relayCount} {relayCount === 1 ? 'relay' : 'relays'}</span>
          </div>

          {/* Notifications */}
          {user && (
            <div className="hidden sm:block">
              <Notifications compact={true} />
            </div>
          )}

          {/* Action Buttons */}
          <button
            className="hidden sm:flex material-symbols-outlined text-secondary hover:text-primary transition-colors active:scale-95"
            title="Notifications"
          >
            notifications
          </button>

          {/* User Menu */}
          {user ? (
            <>
              {/* Desktop Profile */}
              <div className="hidden sm:block relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-container-high transition-all duration-200 border border-transparent hover:border-outline-variant/30"
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || "User"}
                      className="w-9 h-9 rounded-xl object-cover border border-outline-variant/30"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-white font-bold text-sm">
                      {user.name?.[0]?.toUpperCase() || user.npub?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* Profile Dropdown - The Curator Style */}
                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-4 w-80 bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(24,25,51,0.08)] p-5 z-50 border border-outline-variant/20">
                    <div className="flex items-center gap-4 pb-4 border-b border-outline-variant/15 mb-4">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name || "User"}
                          className="w-14 h-14 rounded-xl object-cover border border-outline-variant/30"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center text-white font-bold text-xl">
                          {user.name?.[0]?.toUpperCase() || user.npub?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-primary truncate text-base">
                          {user.display_name || user.name || "Anonymous"}
                        </div>
                        <div className="text-xs text-secondary font-mono truncate">
                          {user.npub?.substring(0, 16)}...
                        </div>
                        {user.nip05 && (
                          <div className="flex items-center gap-1 mt-1.5 px-2 py-1 bg-tertiary-container/10 rounded-full w-fit">
                            <span className="material-symbols-filled text-tertiary text-xs">verified</span>
                            <span className="text-xs font-bold text-tertiary">{user.nip05}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-surface-container-high hover:text-primary transition-all duration-200 font-medium text-sm"
                      >
                        <span className="material-symbols-outlined text-base">account_circle</span>
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-surface-container-high hover:text-primary transition-all duration-200 font-medium text-sm"
                      >
                        <span className="material-symbols-outlined text-base">settings</span>
                        Settings
                      </Link>
                      <div className="border-t border-outline-variant/15 my-2"></div>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-error hover:bg-error-container/30 transition-all duration-200 font-medium text-sm"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-surface-container-high transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <span className="material-symbols-outlined text-on-surface">close</span>
                ) : (
                  <span className="material-symbols-outlined text-on-surface">menu</span>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-surface-container-high transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <span className="material-symbols-outlined text-on-surface">close</span>
                ) : (
                  <span className="material-symbols-outlined text-on-surface">menu</span>
                )}
              </button>

              {/* Desktop Login Button */}
              <button
                onClick={() => setShowLoginModal(true)}
                className="hidden sm:flex curator-button-primary text-sm"
              >
                Connect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-surface-container-lowest border-t border-outline-variant/20 rounded-b-2xl shadow-lg mx-4 mt-2 mb-4">
          <div className="px-4 py-6 space-y-4">
            {/* Search */}
            <div className="pb-4 border-b border-outline-variant/15">
              <SearchComponent compact={true} />
            </div>

            {/* Navigation Links */}
            <nav className="space-y-2">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-secondary hover:bg-surface-container-high hover:text-primary transition-all duration-200 font-medium"
              >
                <span className="material-symbols-outlined">home</span>
                Forums
              </Link>
              <Link
                href="/discovery"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-secondary hover:bg-surface-container-high hover:text-primary transition-all duration-200 font-medium"
              >
                <span className="material-symbols-outlined">explore</span>
                Discover
              </Link>
              <Link
                href="/communities"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-secondary hover:bg-surface-container-high hover:text-primary transition-all duration-200 font-medium"
              >
                <span className="material-symbols-outlined">groups</span>
                Communities
              </Link>
            </nav>

            {/* Relay Status */}
            {user && (
              <>
                <div className="pt-4 border-t border-outline-variant/15">
                  <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-surface-container-high">
                    <div className="relative">
                      <div className={`w-2 h-2 rounded-full ${relayCount > 0 ? "bg-green-500" : "bg-red-500"}`}></div>
                      {relayCount > 0 && (
                        <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                      )}
                    </div>
                    <span className="font-bold text-secondary">{relayCount} relays</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/15 space-y-2">
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-secondary hover:bg-surface-container-high hover:text-primary transition-all duration-200 font-medium"
                  >
                    <span className="material-symbols-outlined">account_circle</span>
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-secondary hover:bg-surface-container-high hover:text-primary transition-all duration-200 font-medium"
                  >
                    <span className="material-symbols-outlined">settings</span>
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error-container/30 transition-all duration-200 font-medium"
                  >
                    <span className="material-symbols-outlined">logout</span>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
