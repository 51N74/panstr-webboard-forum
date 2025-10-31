"use client";

import { useNostrAuth } from "../../context/NostrAuthContext";
import { formatPubkey } from "../../lib/nostrClient";

export default function ProfileClient() {
  const { user, error, isLoading, updateProfile, refreshProfile } =
    useNostrAuth();

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
        <span>Please connect to Nostr to view your profile</span>
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-8">
      {/* Profile Card */}
      <div className="flex-1 lg:flex-initial lg:w-96">
        <div className="bg-base-100 shadow-xl rounded-lg p-6">
          <div className="flex flex-col items-center">
            <div className="avatar mb-4">
              <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img
                  src={user.picture}
                  alt={user.display_name || user.name}
                  onError={(e) => {
                    e.target.src = `https://robohash.org/${user.pubkey}.png`;
                  }}
                />
              </div>
            </div>

            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold">
                {user.display_name || user.name}
              </h1>
              {user.name &&
                user.display_name &&
                user.name !== user.display_name && (
                  <p className="text-gray-600">@{user.name}</p>
                )}

              <div className="mt-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
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
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  {formatPubkey(user.pubkey, "npub")}
                </div>

                {user.nip05 && (
                  <div className="flex items-center justify-center gap-1 text-sm text-green-600 mt-1">
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
                    {user.nip05}
                  </div>
                )}

                {user.lud16 && (
                  <div className="flex items-center justify-center gap-1 text-sm text-orange-600 mt-1">
                    <svg
                      className="w-3 h-3"
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
                    {user.lud16}
                  </div>
                )}
              </div>
            </div>

            {user.about && (
              <div className="w-full mb-4">
                <p className="text-sm text-gray-600 text-center">
                  {user.about}
                </p>
              </div>
            )}

            <div className="w-full space-y-2">
              <button className="btn btn-primary w-full">Edit Profile</button>
              <button
                onClick={refreshProfile}
                className="btn btn-outline w-full"
              >
                Refresh Profile
              </button>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-base-100 shadow-lg rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">--</div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">--</div>
              <div className="text-sm text-gray-600">Reactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">--</div>
              <div className="text-sm text-gray-600">Zaps Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">--</div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* Settings Section */}
        <div className="bg-base-100 shadow-xl rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>

          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Authentication Method</span>
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`badge ${user.authMethod === "extension" ? "badge-success" : "badge-info"}`}
                >
                  {user.authMethod === "extension"
                    ? "Browser Extension"
                    : "Private Key"}
                </span>
                <span className="text-sm text-gray-500">
                  {user.authMethod === "extension"
                    ? "Connected via Nostr browser extension"
                    : "Logged in with private key"}
                </span>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Public Key (hex)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={user.pubkey}
                  readOnly
                  className="input input-bordered input-sm flex-1 font-mono text-xs"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(user.pubkey)}
                  className="btn btn-sm btn-outline"
                >
                  Copy
                </button>
              </div>
            </div>

            {user.authMethod === "privatekey" && (
              <div className="alert alert-warning">
                <svg
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="font-bold">Security Reminder</h3>
                  <div className="text-xs">
                    You're using a private key. Make sure it's backed up
                    securely!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Posts Section */}
        <div className="bg-base-100 shadow-xl rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 opacity-50"
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
            <p>Your posts will appear here</p>
            <p className="text-sm mt-2">
              Start creating posts to see them in your profile!
            </p>
            <Link href="/create" className="btn btn-primary btn-sm mt-4">
              Create Your First Post
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
