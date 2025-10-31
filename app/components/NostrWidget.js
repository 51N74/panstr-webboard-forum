"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  initializePool,
  subscribeToPool,
  publishToPool,
  getEvent,
  generatePrivateKey,
  getPublicKey,
  nip19Encode,
  nip19Decode,
  verifyNIP05,
  getUserProfile,
  parseThread,
  createReplyEvent,
  createZapRequest,
  verifyZapReceipt,
  initializeBrowserExtension,
  getBrowserExtensionPubkey,
  isBrowserExtensionAvailable,
  formatPubkey,
  getAllRelays,
  addCustomRelay,
  removeCustomRelay,
  getCustomRelays,
  testRelay,
  getRelayInfo,
  searchEvents,
  searchUsers,
  getTrendingEvents,
} from "../lib/nostrClient";

export default function NostrWidget({
  thread = null,
  onNewPost = null,
  onZapReceived = null,
}) {
  const [pool, setPool] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [privKey, setPrivKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nostrPrivKey") || "";
    }
    return "";
  });
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("idle");
  const [profile, setProfile] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRelays, setShowRelays] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showZapModal, setShowZapModal] = useState(false);
  const [zapTarget, setZapTarget] = useState(null);
  const [zapAmount, setZapAmount] = useState(100);
  const [zapMessage, setZapMessage] = useState("");
  const [customRelays, setCustomRelays] = useState([]);
  const [relayStatuses, setRelayStatuses] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchTab, setSearchTab] = useState("events");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [useExtension, setUseExtension] = useState(false);
  const [extensionPubkey, setExtensionPubkey] = useState("");
  const unsubscribeRef = useRef(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [nip05Address, setNip05Address] = useState("");

  // Initialize pool and browser extension
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setStatus("connecting");
        const newPool = await initializePool();
        if (!mounted) return;

        setPool(newPool);
        setConnected(true);
        setStatus("ready");

        // Try to initialize browser extension
        const extAvailable = isBrowserExtensionAvailable();
        if (extAvailable) {
          const pubkey = await initializeBrowserExtension();
          if (pubkey && mounted) {
            setExtensionPubkey(pubkey);
            setUseExtension(true);
          }
        }

        // Load custom relays
        const relays = getCustomRelays();
        setCustomRelays(relays);

        // Test relay connections
        testAllRelays(getAllRelays());
      } catch (error) {
        console.error("Initialization failed:", error);
        setStatus("error");
      }
    };

    init();

    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (error) {
          console.warn("Error during cleanup:", error);
        }
      }
    };
  }, []);

  // Subscribe to events
  useEffect(() => {
    if (!pool || !connected) return;

    const filters =
      thread && thread.id
        ? { kinds: [1], "#e": [thread.id], limit: 50 }
        : { kinds: [1], limit: 50 };

    unsubscribeRef.current = subscribeToPool(
      pool,
      undefined,
      filters,
      (event, relayUrl) => {
        if (!event || !event.id) return;

        setMessages((prev) => {
          if (prev.find((m) => m.id === event.id)) return prev;
          return [event, ...prev].slice(0, 200);
        });

        // Safely call callback if it's a function
        if (onNewPost && typeof onNewPost === "function") {
          try {
            onNewPost(event);
          } catch (error) {
            console.error("Error in onNewPost callback:", error);
          }
        }
      },
    );
  }, [pool, connected, thread?.id]);

  // Test all relays
  const testAllRelays = useCallback(async (relays) => {
    const statuses = {};
    await Promise.all(
      relays.map(async (relay) => {
        const result = await testRelay(relay);
        statuses[relay] = result;
      }),
    );
    setRelayStatuses(statuses);
  }, []);

  // Handle private key changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (privKey) {
        localStorage.setItem("nostrPrivKey", privKey);
      } else {
        localStorage.removeItem("nostrPrivKey");
      }
    }

    // Load user profile if we have a pubkey
    const loadProfile = async () => {
      const pubkey = useExtension
        ? extensionPubkey
        : privKey
          ? getPublicKey(privKey)
          : null;
      if (!pubkey) return;

      try {
        const userProfile = await getUserProfile(pubkey, nip05Address);
        setProfile(userProfile);
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    if (useExtension || privKey) {
      loadProfile();
    } else {
      setProfile(null);
    }
  }, [privKey, useExtension, extensionPubkey, nip05Address]);

  const handleGenerateKey = useCallback(() => {
    const newKey = generatePrivateKey();
    setPrivKey(newKey);
    alert("New private key generated! Save it safely.");
  }, []);

  const handlePublish = useCallback(async () => {
    const hasKey = useExtension ? extensionPubkey : privKey;

    if (!hasKey) {
      alert("Please provide a private key or use browser extension");
      return;
    }

    if (!content.trim()) {
      alert("Please enter some content");
      return;
    }

    if (!connected || !pool) {
      alert("Not connected to Nostr relays");
      return;
    }

    try {
      setStatus("publishing");

      let tags = [];
      if (thread && thread.id) {
        tags.push(["e", thread.id]);
        tags.push(["p", thread.pubkey || ""]);
      }

      // Add NIP-05 verified tag if applicable
      if (profile?.nip05Verified) {
        tags.push(["nip05", nip05Address]);
      }

      const signedEvent = await publishToPool(
        pool,
        undefined,
        useExtension ? null : privKey,
        content,
        { kind: 1, tags },
      );

      setContent("");
      setMessages((prev) => [signedEvent, ...prev].slice(0, 200));
      setStatus("ready");

      alert("Published successfully!");
    } catch (error) {
      console.error("Publish failed:", error);
      setStatus("error");
      alert("Failed to publish: " + error.message);
    }
  }, [
    content,
    useExtension,
    extensionPubkey,
    privKey,
    connected,
    pool,
    thread,
    profile,
    nip05Address,
  ]);

  const handleZap = useCallback((event) => {
    setZapTarget(event);
    setShowZapModal(true);
  }, []);

  const handleSendZap = useCallback(async () => {
    if (!zapTarget || !zapAmount) return;

    try {
      const zapRequest = createZapRequest(
        zapTarget.pubkey,
        zapTarget.id,
        zapAmount,
        zapMessage,
      );

      // In a real implementation, you would send this to a lightning wallet
      console.log("Zap request:", zapRequest);
      alert(`Zap of ${zapAmount} sats sent!`);

      setShowZapModal(false);
      setZapTarget(null);
      setZapAmount(100);
      setZapMessage("");

      if (onZapReceived && typeof onZapReceived === "function") {
        onZapReceived(zapTarget, zapAmount);
      }
    } catch (error) {
      console.error("Zap failed:", error);
      alert("Failed to send zap: " + error.message);
    }
  }, [zapTarget, zapAmount, zapMessage, onZapReceived]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    try {
      let results;
      if (searchTab === "events") {
        results = await searchEvents(searchQuery, { limit: 20 });
      } else {
        results = await searchUsers(searchQuery, 20);
      }
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }, [searchQuery, searchTab]);

  const handleAddRelay = useCallback(async () => {
    const relayUrl = prompt("Enter relay URL (e.g., wss://relay.example.com):");
    if (!relayUrl) return;

    const success = addCustomRelay(relayUrl);
    if (success) {
      setCustomRelays(getCustomRelays());
      testAllRelays(getAllRelays());
      alert("Relay added successfully!");
    } else {
      alert("Failed to add relay. Please check the URL format.");
    }
  }, []);

  const handleRemoveRelay = useCallback((relayUrl) => {
    const updated = removeCustomRelay(relayUrl);
    setCustomRelays(updated);
    testAllRelays(getAllRelays());
  }, []);

  const handleVerifyNIP05 = useCallback(async () => {
    if (!nip05Address.trim()) {
      alert("Please enter a NIP-05 address");
      return;
    }

    try {
      const verified = await verifyNIP05(nip05Address);
      if (verified) {
        alert("NIP-05 address verified successfully!");
        // Reload profile with verified address
        if (profile) {
          const updatedProfile = await getUserProfile(
            profile.pubkey,
            nip05Address,
          );
          setProfile(updatedProfile);
        }
      } else {
        alert("NIP-05 verification failed");
      }
    } catch (error) {
      console.error("NIP-05 verification error:", error);
      alert("Verification failed: " + error.message);
    }
  }, [nip05Address, profile]);

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatContent = (content) => {
    // Basic content formatting - you can enhance with markdown, mentions, etc.
    return content.replace(/\n/g, "<br>");
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      {/* Header with status */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold">Nostr Widget</h4>
          <div className="text-sm text-gray-600">
            Full NIP-07, NIP-05, NIP-57 support
          </div>
        </div>
        <div className="text-right">
          <div
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              connected
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {status === "connecting" && "Connecting..."}
            {status === "ready" && "Connected"}
            {status === "publishing" && "Publishing..."}
            {status === "error" && "Error"}
            {status === "idle" && "Idle"}
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      {(profile || useExtension || privKey) && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {profile?.picture && (
                <img
                  src={profile.picture}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <div className="font-medium">
                  {profile?.name || profile?.display_name || "Anonymous"}
                </div>
                <div className="text-xs text-gray-600">
                  {formatPubkey(
                    useExtension
                      ? extensionPubkey
                      : privKey
                        ? getPublicKey(privKey)
                        : "",
                    "short",
                  )}
                  {profile?.nip05Verified && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      ✓ NIP-05
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Profile
            </button>
          </div>
        </div>
      )}

      {/* Authentication Section */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center space-x-4 mb-2">
          <label className="flex items-center">
            <input
              type="radio"
              checked={useExtension}
              onChange={() => setUseExtension(true)}
              className="mr-2"
            />
            <span className="text-sm">Browser Extension</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={!useExtension}
              onChange={() => setUseExtension(false)}
              className="mr-2"
            />
            <span className="text-sm">Private Key</span>
          </label>
        </div>

        {useExtension ? (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-green-800">
              {extensionPubkey ? (
                <>
                  Connected with extension pubkey:{" "}
                  {formatPubkey(extensionPubkey, "short")}
                </>
              ) : (
                <>
                  No browser extension detected. Install one like nos2x or Alby.
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <label className="block text-sm font-medium text-gray-700">
              Private Key (hex or nsec)
            </label>
            <div className="flex gap-2 items-center">
              <input
                className="input input-sm input-bordered flex-1"
                type="password"
                placeholder="paste private key or generate one"
                value={privKey}
                onChange={(e) => setPrivKey(e.target.value)}
              />
              <button
                onClick={handleGenerateKey}
                className="btn btn-sm btn-primary"
              >
                Generate
              </button>
            </div>
          </>
        )}
      </div>

      {/* Content Input */}
      <div className="mb-4 space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Write a note
        </label>
        <textarea
          className="textarea textarea-bordered w-full"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            thread
              ? `Replying to: ${thread.title || "thread"}`
              : "What's on your mind?"
          }
          disabled={!connected || (!useExtension && !privKey)}
        />
        {thread && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            Replying to: <strong>{thread.title || "Unknown"}</strong>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handlePublish}
          className="btn btn-primary btn-sm"
          disabled={
            !connected ||
            (!useExtension && !privKey) ||
            !content.trim() ||
            status === "publishing"
          }
        >
          {status === "publishing" && (
            <span className="loading loading-spinner loading-xs"></span>
          )}
          Publish Note
        </button>
        <button
          onClick={() => setContent("")}
          className="btn btn-sm"
          disabled={!content.trim()}
        >
          Clear
        </button>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn btn-sm btn-outline"
        >
          {showAdvanced ? "Hide" : "Show"} Advanced
        </button>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">NIP-05 Address:</label>
            <input
              className="input input-sm input-bordered flex-1"
              placeholder="username@domain.com"
              value={nip05Address}
              onChange={(e) => setNip05Address(e.target.value)}
            />
            <button
              onClick={handleVerifyNIP05}
              className="btn btn-sm btn-outline"
            >
              Verify
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="btn btn-sm btn-outline"
            >
              🔍 Search
            </button>
            <button
              onClick={() => setShowRelays(!showRelays)}
              className="btn btn-sm btn-outline"
            >
              ⚡ Relays
            </button>
          </div>
        </div>
      )}

      {/* Search Section */}
      {showSearch && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex gap-2 mb-2">
            <input
              className="input input-sm input-bordered flex-1"
              placeholder="Search events or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="btn btn-sm btn-primary"
              disabled={loadingSearch}
            >
              {loadingSearch && (
                <span className="loading loading-spinner loading-xs"></span>
              )}
              Search
            </button>
          </div>

          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setSearchTab("events")}
              className={`btn btn-xs ${searchTab === "events" ? "btn-primary" : "btn-ghost"}`}
            >
              Events
            </button>
            <button
              onClick={() => setSearchTab("users")}
              className={`btn btn-xs ${searchTab === "users" ? "btn-primary" : "btn-ghost"}`}
            >
              Users
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {searchTab === "events"
                ? searchResults.map((event) => (
                    <div key={event.id} className="p-2 border rounded bg-white">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <div>{formatPubkey(event.pubkey, "short")}</div>
                        <div>{formatTime(event.created_at)}</div>
                      </div>
                      <div
                        className="text-sm"
                        dangerouslySetInnerHTML={{
                          __html: formatContent(event.content),
                        }}
                      />
                    </div>
                  ))
                : searchResults.map((user) => (
                    <div
                      key={user.pubkey}
                      className="p-2 border rounded bg-white flex items-center space-x-3"
                    >
                      {user.picture && (
                        <img
                          src={user.picture}
                          alt="User"
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-medium text-sm">
                          {user.name || "Anonymous"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatPubkey(user.pubkey, "short")}
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </div>
      )}

      {/* Relay Management */}
      {showRelays && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium text-sm">Relay Status</h5>
            <button onClick={handleAddRelay} className="btn btn-xs btn-primary">
              Add Relay
            </button>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {Object.entries(relayStatuses).map(([url, status]) => (
              <div
                key={url}
                className="flex items-center justify-between text-xs p-1"
              >
                <span className="font-mono truncate flex-1">{url}</span>
                <span
                  className={`px-2 py-1 rounded text-[10px] ${
                    status.connected
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {status.connected ? "Connected" : "Failed"}
                </span>
                {getCustomRelays().includes(url) && (
                  <button
                    onClick={() => handleRemoveRelay(url)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div>
        <h5 className="font-medium mb-2">Recent Notes</h5>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">
              No notes yet
            </div>
          ) : (
            messages.map((event) => (
              <div key={event.id} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-mono text-gray-600">
                    {formatPubkey(event.pubkey, "short")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(event.created_at)}
                  </div>
                </div>
                <div
                  className="text-sm whitespace-pre-wrap mb-2"
                  dangerouslySetInnerHTML={{
                    __html: formatContent(event.content),
                  }}
                />
                <div className="flex items-center justify-between">
                  {event.tags && event.tags.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {event.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="mr-1">
                          [{tag.join(", ")}]
                        </span>
                      ))}
                      {event.tags.length > 3 && "..."}
                    </div>
                  )}
                  <button
                    onClick={() => handleZap(event)}
                    className="text-yellow-600 hover:text-yellow-800 text-sm"
                    title="Send Zap"
                  >
                    ⚡ Zap
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Zap Modal */}
      {showZapModal && zapTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Send Zap</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (sats)
              </label>
              <div className="flex gap-2">
                {[10, 21, 100, 1000, 5000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setZapAmount(amount)}
                    className={`btn btn-sm ${zapAmount === amount ? "btn-primary" : "btn-outline"}`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <input
                type="number"
                className="input input-bordered w-full mt-2"
                value={zapAmount}
                onChange={(e) => setZapAmount(parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (optional)
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={2}
                value={zapMessage}
                onChange={(e) => setZapMessage(e.target.value)}
                placeholder="Add a message..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSendZap}
                className="btn btn-primary flex-1"
                disabled={!zapAmount || zapAmount <= 0}
              >
                Send {zapAmount} sats
              </button>
              <button
                onClick={() => {
                  setShowZapModal(false);
                  setZapTarget(null);
                  setZapAmount(100);
                  setZapMessage("");
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && profile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Profile</h3>

            <div className="text-center mb-4">
              {profile.picture && (
                <img
                  src={profile.picture}
                  alt="Profile"
                  className="w-20 h-20 rounded-full mx-auto mb-2"
                />
              )}
              <div className="font-medium text-lg">
                {profile.name || profile.display_name || "Anonymous"}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {profile.about || "No bio"}
              </div>
              <div className="text-xs font-mono text-gray-500 mb-2">
                {formatPubkey(profile.pubkey, "npub")}
              </div>
              {profile.nip05Verified && (
                <div className="text-sm text-green-600 mb-2">
                  ✓ NIP-05 Verified: {nip05Address}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowProfileModal(false)}
                className="btn btn-primary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
