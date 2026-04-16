"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useNostrAuth } from "../context/NostrAuthContext";
import { OFFICIAL_ROOMS } from "../data/boardsConfig";
import SearchComponent from "./search/SearchComponent";
import Notifications from "./notifications/Notifications";
import UserProfile from "./profiles/UserProfile";
import { formatPubkey, getAllRelays, testRelay } from "../lib/nostrClient";

/**
 * Header component - Panstr Minimal
 * Clean, functional navbar with high-contrast design
 */

export default function Header() {
  const { user, isLoading, logout, setShowLoginModal } = useNostrAuth();
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

  const checkRelays = async () => {
    const relays = getAllRelays();
    let connected = 0;
    try {
      await Promise.all(
        relays.map(async (relay) => {
          try {
            const result = await testRelay(relay);
            if (result.connected) connected++;
          } catch (err) {}
        }),
      );
    } catch (err) {}
    setRelayCount(connected);
  };

  if (isLoading) {
    return (
      <header className="fixed top-0 w-full z-fixed bg-white/80 backdrop-blur-md border-b border-surface-border">
        <div className="flex justify-between items-center px-4 md:px-6 h-14 mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded-sm animate-pulse"></div>
            <span className="text-lg font-bold tracking-tighter">Panstr</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 w-full z-fixed bg-white/90 backdrop-blur-md border-b border-surface-border">
      <div className="flex justify-between items-center px-4 md:px-6 h-14 mx-auto">
        {/* Brand & Desktop Nav */}
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center text-[10px] text-white font-black group-hover:bg-accent transition-colors">
              P
            </div>
            <span className="text-lg font-bold tracking-tighter">Panstr</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-secondary hover:text-primary transition-colors">
              Forums
            </Link>
            <div className="relative group">
              <button className="text-sm font-medium text-secondary hover:text-primary transition-colors flex items-center gap-1">
                Rooms
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
              
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-surface-border rounded-lg shadow-mid opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-modal p-2">
                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                  {OFFICIAL_ROOMS.map((room) => (
                    <Link
                      key={room.tag}
                      href={`/room/${room.tag}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-muted transition-colors"
                    >
                      <span className="text-lg">{room.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-primary truncate">{room.name}</div>
                        <div className="text-[10px] text-secondary truncate">{room.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search Placeholder - Visible only on LG up */}
          <div className="hidden lg:flex items-center bg-surface-muted px-3 py-1.5 rounded-md border border-surface-border focus-within:border-accent/50 transition-colors">
            <span className="material-symbols-outlined text-sm text-secondary">search</span>
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none focus:ring-0 text-xs w-48 p-0 ml-2 placeholder:text-secondary/50"
            />
          </div>

          {/* Relay Status - Hidden on extra small screens */}
          <div className="hidden xs:flex items-center gap-1.5 px-2 py-1 bg-surface-muted rounded border border-surface-border text-[9px] font-bold text-secondary">
            <div className={`w-1.5 h-1.5 rounded-full ${relayCount > 0 ? "bg-success" : "bg-error"}`}></div>
            <span className="uppercase">{relayCount} RELAYS</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Notifications compact={true} />
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-8 h-8 rounded-full overflow-hidden border border-surface-border hover:border-accent transition-colors flex-shrink-0"
                >
                  {user.picture ? (
                    <img src={user.picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-muted flex items-center justify-center text-[10px] font-bold">
                      {user.name?.[0] || "?"}
                    </div>
                  )}
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-surface-border rounded-lg shadow-mid p-1 z-modal">
                    <div className="px-3 py-2 mb-1 border-b border-surface-border">
                      <div className="text-xs font-bold text-primary truncate">{user.display_name || user.name || "Anonymous"}</div>
                      <div className="text-[10px] font-mono text-secondary truncate">{user.npub?.substring(0, 16)}...</div>
                    </div>
                    <Link href="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-secondary hover:bg-surface-muted hover:text-primary rounded-md transition-colors">
                      <span className="material-symbols-outlined text-base">person</span> Profile
                    </Link>
                    <Link href="/settings" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-secondary hover:bg-surface-muted hover:text-primary rounded-md transition-colors">
                      <span className="material-symbols-outlined text-base">settings</span> Settings
                    </Link>
                    <button 
                      onClick={() => { logout(); setIsProfileDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-error hover:bg-error/10 rounded-md transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-base">logout</span> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="btn-primary px-3 py-1.5 text-[11px] rounded-md font-bold uppercase tracking-tight"
            >
              Connect
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-1 text-secondary hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-2xl">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-14 left-0 w-full bg-white border-b border-surface-border shadow-mid z-fixed animate-fade-in max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <nav className="flex flex-col p-4 space-y-2">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-sm font-bold rounded-md hover:bg-surface-muted transition-colors border border-transparent hover:border-surface-border/50">Forums</Link>
            <Link href="/discovery" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-sm font-bold rounded-md hover:bg-surface-muted transition-colors border border-transparent hover:border-surface-border/50">Discovery</Link>
            
            <div className="pt-4 border-t border-surface-border mt-4">
              <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest px-4 mb-2">Relay Status</h4>
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-muted rounded-md border border-surface-border">
                <div className={`w-2 h-2 rounded-full ${relayCount > 0 ? "bg-success" : "bg-error"}`}></div>
                <span className="text-[10px] font-bold text-primary">{relayCount} CONNECTED RELAYS</span>
              </div>
            </div>

            {!user && (
              <div className="pt-6">
                <button 
                  onClick={() => { setShowLoginModal(true); setIsMobileMenuOpen(false); }}
                  className="w-full btn-primary py-3 text-sm font-bold uppercase tracking-widest"
                >
                  Connect Identity
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
