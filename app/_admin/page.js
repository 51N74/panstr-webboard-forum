"use client";

import { useNostrAuth } from "../../context/NostrAuthContext";
import { formatPubkey } from "../../lib/nostrClient";

export default function AdminPage() {
  const { user, error, isLoading } = useNostrAuth();

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );

  if (error)
    return (
      <div className="alert alert-error max-w-md mx-auto mt-8">
        <span>{error}</span>
      </div>
    );

  if (!user)
    return (
      <div className="alert alert-warning max-w-md mx-auto mt-8">
        <span>Please connect to Nostr to access admin features</span>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-base-100 shadow-xl rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

        {/* Admin User Info */}
        <div className="bg-base-200 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Admin User</h2>
          <div className="flex items-center gap-4">
            <div className="avatar">
              <div className="w-16 rounded-full">
                <img
                  src={user.picture}
                  alt={user.display_name || user.name}
                  onError={(e) => {
                    e.target.src = `https://robohash.org/${user.pubkey}.png`;
                  }}
                />
              </div>
            </div>
            <div>
              <div className="font-semibold text-lg">
                {user.display_name || user.name}
              </div>
              <div className="text-sm text-gray-600">
                {formatPubkey(user.pubkey, "short")}
              </div>
              <div className="text-xs text-gray-500">
                Auth Method:{" "}
                {user.authMethod === "extension"
                  ? "Browser Extension"
                  : "Private Key"}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Content Management */}
          <div className="bg-base-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Content Management</h3>
            <div className="space-y-2">
              <button className="btn btn-outline btn-block w-full text-left">
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
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
                View All Posts
              </button>
              <button className="btn btn-outline btn-block w-full text-left">
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Posts
              </button>
              <button className="btn btn-outline btn-block w-full text-left">
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Posts
              </button>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-base-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">User Management</h3>
            <div className="space-y-2">
              <button className="btn btn-outline btn-block w-full text-left">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                View All Users
              </button>
              <button className="btn btn-outline btn-block w-full text-left">
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
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                Ban Users
              </button>
              <button className="btn btn-outline btn-block w-full text-left">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Verify Profiles
              </button>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-base-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">System Settings</h3>
            <div className="space-y-2">
              <button className="btn btn-outline btn-block w-full text-left">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Relay Settings
              </button>
              <button className="btn btn-outline btn-block w-full text-left">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Analytics
              </button>
              <button className="btn btn-outline btn-block w-full text-left">
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
                Site Settings
              </button>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-base-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-base-100 rounded p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connected Relays</span>
                <span className="badge badge-success">7</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                All relays operational
              </div>
            </div>
            <div className="bg-base-100 rounded p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Users</span>
                <span className="badge badge-info">--</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Last 24 hours</div>
            </div>
            <div className="bg-base-100 rounded p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Posts</span>
                <span className="badge badge-warning">--</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">All time</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-base-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-2">
            <div className="bg-base-100 rounded p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">System initialized successfully</span>
                <span className="text-xs text-gray-500">Just now</span>
              </div>
            </div>
            <div className="bg-base-100 rounded p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  Admin panel accessed by {formatPubkey(user.pubkey, "short")}
                </span>
                <span className="text-xs text-gray-500">Just now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
