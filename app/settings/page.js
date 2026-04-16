"use client";

import { useNostrAuth } from "../context/NostrAuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, logout, authMethod } = useNostrAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [theme, setTheme] = useState("auto");

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "auto";
    setTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === "auto") {
      localStorage.removeItem("theme");
      const supportDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (supportDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      localStorage.setItem("theme", newTheme);
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-muted flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Not Connected</h2>
          <p className="text-secondary mb-6">Please connect to Nostr to access settings</p>
          <Link href="/" className="btn-primary px-6 py-3">
            Connect Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Settings</h1>
          <p className="text-secondary">
            Manage your account preferences and configuration
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-surface-muted p-1 rounded-lg mb-6 gap-1 border border-surface-border">
          {["general", "account", "privacy", "relays"].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                activeTab === tab
                  ? "bg-surface text-primary shadow-sm"
                  : "text-secondary hover:text-primary"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-surface rounded-lg border border-surface-border shadow-soft p-6 md:p-10">
          {activeTab === "general" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-2">General Settings</h2>
                <p className="text-secondary text-sm">
                  Configure your general preferences and behavior
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-2">Display Theme</span>
                  <select 
                    value={theme}
                    onChange={(e) => handleThemeChange(e.target.value)}
                    className="input h-12 bg-surface-muted border-transparent"
                  >
                    <option value="auto">Auto (System)</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
              </div>

              {/* Language Selection - Hidden as requested */}
              {/* 
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-2">Language</span>
                  <select className="input h-12 bg-surface-muted border-transparent">
                    <option>English</option>
                    <option>Thai</option>
                  </select>
                </label>
              </div>
              */}

              <div className="flex items-center justify-between py-4 border-t border-surface-border">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary">Email Notifications</div>
                  <div className="text-xs text-secondary">Receive email notifications for replies</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-2">Account Information</h2>
                <p className="text-secondary text-sm">
                  View and manage your account details
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-2">Authentication Method</span>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                      authMethod === "extension" 
                        ? "bg-success/10 text-success border border-success/20" 
                        : "bg-accent/10 text-accent border border-accent/20"
                    }`}>
                      {authMethod === "extension" ? "Browser Extension" : "Private Key"}
                    </span>
                    <span className="text-xs text-secondary">
                      {authMethod === "extension" ? "Connected via Nostr browser extension" : "Logged in with private key"}
                    </span>
                  </div>
                </label>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-2">Public Key</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={user.npub}
                      readOnly
                      className="input h-12 flex-1 font-mono text-[10px] bg-surface-muted border-transparent"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(user.npub);
                        alert("Copied to clipboard");
                      }}
                      className="btn-outline h-12 px-4"
                    >
                      <span className="material-symbols-outlined text-lg">content_copy</span>
                    </button>
                  </div>
                </label>
              </div>

              {authMethod === "privatekey" && (
                <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg flex gap-4">
                  <span className="material-symbols-outlined text-warning">warning</span>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-warning">Security Reminder</h3>
                    <p className="text-xs text-secondary mt-1">Your private key is stored locally. Make sure it's backed up securely!</p>
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-surface-border">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-error mb-4">Danger Zone</h3>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to logout? You'll need to reconnect with your Nostr account.")) {
                      logout();
                      window.location.href = "/";
                    }
                  }}
                  className="btn bg-error/10 text-error hover:bg-error hover:text-white transition-all px-6 py-3 font-bold"
                >
                  Logout Account
                </button>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-2">Privacy Settings</h2>
                <p className="text-secondary text-sm">
                  Control your privacy and data sharing preferences
                </p>
              </div>

              {[
                { label: "Make profile public", desc: "Allow other users to view your profile and posts", checked: true },
                { label: "Show email in profile", desc: "Display your email address publicly", checked: false },
                { label: "Receive DMs from anyone", desc: "Allow direct messages from all users", checked: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-surface-border last:border-0">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary">{item.label}</div>
                    <div className="text-xs text-secondary">{item.desc}</div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                    <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "relays" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-2">Relay Configuration</h2>
                <p className="text-secondary text-sm">
                  Manage your Nostr relay connections
                </p>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-2">Active Relays</span>
                <div className="space-y-2">
                  {[
                    { url: "wss://relay.damus.io", status: "Connected", sub: "Primary relay" },
                    { url: "wss://relay.snort.social", status: "Connected", sub: "Secondary relay" },
                    { url: "wss://nos.lol", status: "Connecting", sub: "Tertiary relay" },
                  ].map((relay, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-surface-muted rounded-lg border border-surface-border/50">
                      <div>
                        <div className="text-xs font-bold text-primary">{relay.url}</div>
                        <div className="text-[10px] text-secondary">{relay.sub}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        relay.status === "Connected" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}>
                        {relay.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-2">Add Custom Relay</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="wss://your-relay.com"
                      className="input h-12 flex-1 bg-surface-muted border-transparent"
                    />
                    <button className="btn-primary px-6 h-12">Add</button>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
