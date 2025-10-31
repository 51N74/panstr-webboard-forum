"use client";
import { useState } from "react";
import Link from "next/link";
import { useNostrAuth } from "../context/NostrAuthContext";
import NostrLoginModal from "./NostrLoginModal";
import { formatPubkey } from "../lib/nostrClient";

export default function Header() {
  const { user, isLoading, error, logout } = useNostrAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (isLoading) {
    return (
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl" href="/">
            Panstr
          </a>
        </div>
        <div className="flex-none gap-2">
          <div className="loading loading-spinner loading-sm"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="navbar bg-base-100">
          <div className="flex-1">
            <a className="btn btn-ghost text-xl" href="/">
              Panstr
            </a>
          </div>
          <div className="flex-none gap-2">
            <button
              onClick={() => setShowLoginModal(true)}
              className="btn btn-outline btn-accent"
            >
              Connect Nostr
            </button>
          </div>
        </div>
        <NostrLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl" href="/">
            Panstr
          </a>
        </div>
        <div className="flex-none gap-2">
          <div className="form-control">
            <Link href="/create">
              <button className="btn btn-outline btn-primary">
                Create Post
              </button>
            </Link>
          </div>
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
            >
              <div className="w-10 rounded-full">
                <img
                  src={user.picture}
                  alt={user.display_name || user.name}
                  onError={(e) => {
                    e.target.src = `https://robohash.org/${user.pubkey}.png`;
                  }}
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
            >
              <li>
                <div className="p-2 border-b">
                  <div className="font-semibold">
                    {user.display_name || user.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatPubkey(user.pubkey, "short")}
                  </div>
                  {user.nip05 && (
                    <div className="text-xs text-green-600 flex items-center">
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
                    </div>
                  )}
                </div>
              </li>
              <li>
                <Link href="/user/profile">
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
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
              </li>
              <li>
                <Link href="/user/settings">
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
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
              </li>
              <div className="divider my-1"></div>
              <li>
                <button
                  onClick={logout}
                  className="text-red-600 hover:bg-red-50"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
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
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
