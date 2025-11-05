"use client";

import { useNostrAuth } from "../context/NostrAuthContext";
import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, logout, authMethod } = useNostrAuth();
  const [activeTab, setActiveTab] = useState("general");

  if (!user) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Not Connected</h2>
          <p className="text-base-content/70 mb-6">Please connect to Nostr to access settings</p>
          <Link href="/" className="btn btn-primary">
            Connect Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-content mb-2">Settings</h1>
          <p className="text-base-content/70">
            Manage your account preferences and configuration
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6">
          <button
            className={`tab ${activeTab === "general" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
          <button
            className={`tab ${activeTab === "account" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("account")}
          >
            Account
          </button>
          <button
            className={`tab ${activeTab === "privacy" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("privacy")}
          >
            Privacy
          </button>
          <button
            className={`tab ${activeTab === "relays" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("relays")}
          >
            Relays
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">General Settings</h2>
                <p className="text-base-content/70 mb-6">
                  Configure your general preferences and behavior
                </p>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Display Theme</span>
                </label>
                <select className="select select-bordered">
                  <option>Auto (System)</option>
                  <option>Light</option>
                  <option>Dark</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Language</span>
                </label>
                <select className="select select-bordered">
                  <option>English</option>
                  <option>Thai</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email Notifications</span>
                </label>
                <label className="cursor-pointer label">
                  <span className="label-text">Receive email notifications for replies</span>
                  <input type="checkbox" className="toggle toggle-primary" />
                </label>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Account Information</h2>
                <p className="text-base-content/70 mb-6">
                  View and manage your account details
                </p>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Authentication Method</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className={`badge ${authMethod === "extension" ? "badge-success" : "badge-info"}`}>
                    {authMethod === "extension" ? "Browser Extension" : "Private Key"}
                  </span>
                  <span className="text-sm text-base-content/60">
                    {authMethod === "extension" ? "Connected via Nostr browser extension" : "Logged in with private key"}
                  </span>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Public Key</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={user.npub}
                    readOnly
                    className="input input-bordered input-sm flex-1 font-mono text-xs"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(user.npub)}
                    className="btn btn-sm btn-outline"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {authMethod === "privatekey" && (
                <div className="alert alert-warning">
                  <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="font-bold">Security Reminder</h3>
                    <div className="text-xs">Your private key is stored locally. Make sure it's backed up securely!</div>
                  </div>
                </div>
              )}

              <div className="divider"></div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-error">Danger Zone</h3>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to logout? You'll need to reconnect with your Nostr account.")) {
                      logout();
                      window.location.href = "/";
                    }
                  }}
                  className="btn btn-error"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
                <p className="text-base-content/70 mb-6">
                  Control your privacy and data sharing preferences
                </p>
              </div>

              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">Make profile public</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </label>
                <label className="label">
                  <span className="label-text-alt">Allow other users to view your profile and posts</span>
                </label>
              </div>

              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">Show email in profile</span>
                  <input type="checkbox" className="toggle toggle-primary" />
                </label>
                <label className="label">
                  <span className="label-text-alt">Display your email address publicly</span>
                </label>
              </div>

              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">Receive DMs from anyone</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </label>
                <label className="label">
                  <span className="label-text-alt">Allow direct messages from all users</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Profile Visibility</span>
                </label>
                <select className="select select-bordered">
                  <option>Public</option>
                  <option>Followers Only</option>
                  <option>Private</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "relays" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Relay Configuration</h2>
                <p className="text-base-content/70 mb-6">
                  Manage your Nostr relay connections
                </p>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Active Relays</span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div>
                      <div className="font-medium">wss://relay.damus.io</div>
                      <div className="text-sm text-base-content/60">Primary relay</div>
                    </div>
                    <div className="badge badge-success">Connected</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div>
                      <div className="font-medium">wss://relay.snort.social</div>
                      <div className="text-sm text-base-content/60">Secondary relay</div>
                    </div>
                    <div className="badge badge-success">Connected</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div>
                      <div className="font-medium">wss://nos.lol</div>
                      <div className="text-sm text-base-content/60">Tertiary relay</div>
                    </div>
                    <div className="badge badge-warning">Connecting</div>
                  </div>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Add Custom Relay</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="wss://your-relay.com"
                    className="input input-bordered flex-1"
                  />
                  <button className="btn btn-primary">Add</button>
                </div>
              </div>

              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">Auto-connect to relays</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </label>
                <label className="label">
                  <span className="label-text-alt">Automatically connect to available relays on startup</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
