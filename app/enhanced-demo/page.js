"use client";

import { useState, useEffect } from "react";
import EnhancedThreadView from "../components/enhanced/threading/EnhancedThreadView";
import EnhancedZapComponent from "../components/enhanced/zaps/EnhancedZapComponent";
import RelayManagement from "../components/enhanced/relay/RelayManagement";
import EnhancedSecurity from "../components/enhanced/security/EnhancedSecurity";
import {
  queryEvents,
  generatePrivateKey,
  getPublicKey,
  getUserProfile,
} from "../lib/nostrClient";

const EnhancedDemoPage = () => {
  const [activeDemo, setActiveDemo] = useState("threading");
  const [sampleEvents, setSampleEvents] = useState([]);
  const [currentPubkey, setCurrentPubkey] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize demo user
  useEffect(() => {
    const initDemo = () => {
      try {
        // Generate demo keys or use existing ones
        const demoPrivateKey = localStorage.getItem("demo_private_key");
        if (demoPrivateKey) {
          setPrivateKey(demoPrivateKey);
          const demoPubkey = getPublicKey(hexToBytes(demoPrivateKey));
          setCurrentPubkey(demoPubkey);
        } else {
          const newPrivateKey = generatePrivateKey();
          const newPubkey = getPublicKey(newPrivateKey);
          const privateKeyHex = bytesToHex(newPrivateKey);

          setPrivateKey(privateKeyHex);
          setCurrentPubkey(newPubkey);
          localStorage.setItem("demo_private_key", privateKeyHex);
        }
      } catch (error) {
        console.error("Error initializing demo:", error);
      }
    };

    initDemo();
  }, []);

  // Load sample events for threading demo
  useEffect(() => {
    if (activeDemo === "threading") {
      loadSampleEvents();
    }
  }, [activeDemo]);

  const loadSampleEvents = async () => {
    setLoading(true);
    try {
      // Query for sample events - using kind 1 (text notes) for demo
      const events = await queryEvents(
        {
          kinds: [1],
          limit: 20,
        },
        ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.siamdev.cc"],
      );
      setSampleEvents(events);
    } catch (error) {
      console.error("Error loading sample events:", error);
      // Create mock events for demo if real ones fail
      setSampleEvents(createMockEvents());
    } finally {
      setLoading(false);
    }
  };

  const createMockEvents = () => {
    const now = Math.floor(Date.now() / 1000);
    return [
      {
        id: "mock-root-1",
        pubkey: "e9fe51d4b5c0e7a5c3d8c5b9b8a7d6e5f4c3b2a1",
        created_at: now - 3600,
        kind: 1,
        content:
          "This is a root post demonstrating enhanced NIP-10 threading with proper markers and depth calculation.",
        tags: [],
      },
      {
        id: "mock-reply-1",
        pubkey: "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
        created_at: now - 1800,
        kind: 1,
        content:
          "This is a reply with proper reply marker and depth calculation.",
        tags: [
          ["e", "mock-root-1", "", "reply"],
          ["p", "e9fe51d4b5c0e7a5c3d8c5b9b8a7d6e5f4c3b2a1"],
        ],
      },
      {
        id: "mock-reply-2",
        pubkey: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
        created_at: now - 900,
        kind: 1,
        content: "This is a nested reply showing thread depth calculation.",
        tags: [
          ["e", "mock-root-1", "", "root"],
          ["e", "mock-reply-1", "", "reply"],
          ["p", "e9fe51d4b5c0e7a5c3d8c5b9b8a7d6e5f4c3b2a1"],
          ["p", "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"],
        ],
      },
    ];
  };

  const handleReply = (event) => {
    console.log("Reply to event:", event);
    // In a real implementation, this would open a reply form
    alert(`Reply functionality would be implemented for event: ${event.id}`);
  };

  const handleZap = async (zapRequest, amount) => {
    console.log("Zap request:", zapRequest, amount);
    // In a real implementation, this would process the zap
    alert(`Zap of ${amount} sats would be processed here.`);
  };

  const demoFeatures = [
    {
      id: "threading",
      name: "Enhanced NIP-10 Threading",
      description:
        "Improved thread parsing with all marker types (root, reply, mention), depth calculation, and optimized structure",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
          />
        </svg>
      ),
    },
    {
      id: "zaps",
      name: "Enhanced NIP-57 Zaps",
      description:
        "Zap splits, goals, analytics dashboard, and improved validation with custom messages",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
    },
    {
      id: "relay",
      name: "NIP-65 Relay Management",
      description:
        "Relay list metadata, health monitoring, automatic discovery, and performance optimization",
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
    },
    {
      id: "security",
      name: "Enhanced Security (Week 3-4)",
      description:
        "NIP-49 private key encryption, NIP-44 versioned messaging, NIP-42 client authentication",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Phase 1 NIP Enhancements Demo (Weeks 1-4)
              </h1>
              <p className="mt-2 text-gray-600">
                Showcase of enhanced Nostr Implementation Possibilities -
                Foundation & Security
              </p>
            </div>
            {currentPubkey && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Demo User</div>
                <div className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                  {currentPubkey.slice(0, 8)}...{currentPubkey.slice(-8)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {demoFeatures.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveDemo(feature.id)}
              className={`p-6 rounded-lg border-2 transition-all ${
                activeDemo === feature.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className={`p-2 rounded-lg ${
                    activeDemo === feature.id
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.name}
                </h3>
              </div>
              <p className="text-sm text-gray-600 text-left">
                {feature.description}
              </p>
            </button>
          ))}
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Threading Demo */}
          {activeDemo === "threading" && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Enhanced NIP-10 Threading
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Features Demonstrated:
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>
                      ✅ Official NIP-10 parsing with fallback to enhanced
                      custom parser
                    </li>
                    <li>✅ All marker types: root, reply, mention</li>
                    <li>✅ Thread depth calculation</li>
                    <li>✅ Optimized thread structure for display</li>
                    <li>✅ Profile resolution and display</li>
                    <li>✅ Collapsible thread navigation</li>
                  </ul>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading sample events...</p>
                </div>
              ) : (
                <EnhancedThreadView
                  events={sampleEvents}
                  onReply={handleReply}
                  currentPubkey={currentPubkey}
                />
              )}
            </div>
          )}

          {/* Zaps Demo */}
          {activeDemo === "zaps" && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Enhanced NIP-57 Zaps
                </h2>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">
                    Features Demonstrated:
                  </h3>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>✅ Zap splits with multiple recipients</li>
                    <li>✅ Zap goals (NIP-75) with progress tracking</li>
                    <li>✅ Analytics dashboard with timeframes</li>
                    <li>✅ Custom messages and anonymity options</li>
                    <li>✅ Enhanced receipt validation</li>
                  </ul>
                </div>
              </div>

              <EnhancedZapComponent
                recipientPubkey={
                  currentPubkey || "e9fe51d4b5c0e7a5c3d8c5b9b8a7d6e5f4c3b2a1"
                }
                currentPubkey={currentPubkey}
                onZap={handleZap}
              />
            </div>
          )}

          {/* Relay Management Demo */}
          {activeDemo === "relay" && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  NIP-65 Relay Management
                </h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">
                    Features Demonstrated:
                  </h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✅ NIP-65 relay list metadata (kind: 10002)</li>
                    <li>✅ Real-time relay health monitoring</li>
                    <li>✅ Automatic relay discovery from network</li>
                    <li>✅ Performance scoring and optimization</li>
                    <li>✅ Optimal relay selection</li>
                    <li>✅ Comprehensive statistics dashboard</li>
                  </ul>
                </div>
              </div>

              <RelayManagement
                currentPubkey={currentPubkey}
                privateKey={privateKey}
              />
            </div>
          )}

          {/* Security Demo */}
          {activeDemo === "security" && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Enhanced Security Features (Week 3-4)
                </h2>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">
                    Features Demonstrated:
                  </h3>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>
                      ✅ NIP-49 private key encryption with scrypt &
                      ChaCha20-Poly1305
                    </li>
                    <li>✅ NIP-06 mnemonic key derivation and recovery</li>
                    <li>✅ NIP-44 versioned encryption with forward secrecy</li>
                    <li>
                      ✅ NIP-42 client authentication with challenge-response
                    </li>
                    <li>✅ Role-based access control and permissions</li>
                    <li>✅ Token-based authentication system</li>
                  </ul>
                </div>
              </div>

              <EnhancedSecurity currentPubkey={currentPubkey} />
            </div>
          )}
        </div>

        {/* Implementation Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">
            🚀 Implementation Notes
          </h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>
              <strong>Phase 1 Week 1-2 Goals:</strong> Foundation stability and
              core NIP improvements
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                Fixed NIP-10 threading with proper marker support and depth
                calculation
              </li>
              <li>Enhanced NIP-57 zaps with splits, goals, and analytics</li>
              <li>
                Implemented NIP-65 relay management with health monitoring
              </li>
              <li>Added automatic relay discovery and optimization</li>
              <li>Improved error handling and fallback mechanisms</li>
            </ul>
            <p className="mt-3">
              <strong>Phase 1 Week 3-4 Goals (Implemented):</strong> Enhanced
              security with NIP-49 private key encryption, NIP-44 versioned
              encryption, and NIP-42 client authentication
            </p>
            <p className="mt-3">
              <strong>Next Steps (Phase 2 Week 5-6):</strong> Rich content with
              NIP-30 custom emoji, NIP-92 media attachments, and enhanced NIP-23
              long-form content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions (normally imported from nostr-tools)
function hexToBytes(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default EnhancedDemoPage;
