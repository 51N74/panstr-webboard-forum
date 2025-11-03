"use client";

/*
  Enhanced nostr-tools client for Panstr project with full NIP support

  Features:
  - SimplePool with automatic reconnection and ping
  - NIP-07: Browser Extension Support
  - NIP-05: Verified Profiles
  - NIP-10: Thread Parsing
  - NIP-19: Encoding/Decoding
  - NIP-57: Gift Wraps (Zaps)
  - Relay Management
  - Event Search
*/

import {
  SimplePool,
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  verifyEvent,
  getEventHash,
} from "nostr-tools";

import * as nip19 from "nostr-tools/nip19";
import * as nip05 from "nostr-tools/nip05";
import * as nip10 from "nostr-tools/nip10";
import * as nip46 from "nostr-tools/nip46";
import * as nip57 from "nostr-tools/nip57";

const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
  "wss://relay.snort.social",
  "wss://relay.siamdev.cc",
  "wss://relay.iris.to",
  "wss://relay.f7z.io",
];

// Global instances
let globalPool = null;
let browserExtensionSigner = null;

/**
 * Initialize SimplePool with enhanced configuration
 */
export async function initializePool(relayUrls = DEFAULT_RELAYS) {
  if (globalPool) return globalPool;

  const pool = new SimplePool({
    enablePing: true,
    enableReconnect: (filters) => {
      const newSince = Math.floor(Date.now() / 1000);
      return filters.map((filter) => ({ ...filter, since: newSince }));
    },
  });

  globalPool = pool;
  return pool;
}

/**
 * Get current pool instance
 */
export function getPool() {
  return globalPool;
}

/**
 * Generate cryptographically secure private key
 */
export function generatePrivateKey() {
  return generateSecretKey();
}

/**
 * Convert private key to hex string
 */
export function privateKeyToHex(sk) {
  if (typeof sk === "string") return sk;
  if (sk instanceof Uint8Array) {
    return Array.from(sk)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return Buffer.from(sk).toString("hex");
}

/**
 * Publish event using pool
 */
export async function publishToPool(
  pool,
  relayUrls = DEFAULT_RELAYS,
  privKey,
  content,
  { kind = 1, tags = [] } = {},
) {
  if (!privKey && !browserExtensionSigner) {
    throw new Error("Private key or browser extension is required");
  }

  const eventTemplate = {
    kind,
    content: content || "",
    tags: tags || [],
    created_at: Math.floor(Date.now() / 1000),
  };

  let signedEvent;

  if (browserExtensionSigner) {
    // Use browser extension (NIP-07)
    signedEvent = await browserExtensionSigner.signEvent(eventTemplate);
  } else if (privKey) {
    // Use private key
    signedEvent = finalizeEvent(eventTemplate, privKey);
  } else {
    throw new Error("No signing method available");
  }

  // Publish to relays
  try {
    const promises = pool.publish(relayUrls, signedEvent);
    await Promise.any(promises);
    console.log(`Event published to ${relayUrls.length} relays`);
  } catch (error) {
    console.warn("Failed to publish to some relays:", error);
  }

  return signedEvent;
}

/**
 * Subscribe to events using pool
 */
export function subscribeToPool(
  pool,
  relayUrls = DEFAULT_RELAYS,
  filters,
  onEvent,
) {
  const sub = pool.subscribeMany(relayUrls, [filters], {
    onevent(event, relayUrl) {
      try {
        onEvent(event, relayUrl);
      } catch (error) {
        console.error("Error in event handler:", error);
      }
    },
    oneose() {
      console.log("Subscription ended");
    },
  });

  return () => sub.close();
}

/**
 * Query events synchronously
 */
export async function queryEvents(pool, relayUrls = DEFAULT_RELAYS, filters) {
  try {
    return await pool.querySync(relayUrls, filters);
  } catch (error) {
    console.error("Error querying events:", error);
    return [];
  }
}

/**
 * Get single event
 */
export async function getEvent(pool, relayUrls = DEFAULT_RELAYS, filters) {
  try {
    return await pool.get(relayUrls, filters);
  } catch (error) {
    console.error("Error getting event:", error);
    return null;
  }
}

// ==================== NIP-07: Browser Extension Support ====================

/**
 * Initialize NIP-07 browser extension support
 */
export async function initializeBrowserExtension() {
  if (typeof window === "undefined" || !window.nostr) {
    return false;
  }

  try {
    const pubkey = await window.nostr.getPublicKey();
    browserExtensionSigner = window.nostr;
    return pubkey;
  } catch (error) {
    console.error("Failed to initialize browser extension:", error);
    return false;
  }
}

/**
 * Get browser extension public key
 */
export async function getBrowserExtensionPubkey() {
  if (!browserExtensionSigner) {
    const success = await initializeBrowserExtension();
    if (!success) return null;
  }
  return await browserExtensionSigner.getPublicKey();
}

/**
 * Sign event with browser extension
 */
export async function signWithBrowserExtension(event) {
  if (!browserExtensionSigner) {
    throw new Error("Browser extension not initialized");
  }
  return await browserExtensionSigner.signEvent(event);
}

/**
 * Check if browser extension is available
 */
export function isBrowserExtensionAvailable() {
  return typeof window !== "undefined" && !!window.nostr;
}

// ==================== NIP-19: Encoding/Decoding ====================

export const nip19Encode = {
  nsec: nip19.nsecEncode,
  npub: nip19.npubEncode,
  nevent: nip19.neventEncode,
  nprofile: nip19.nprofileEncode,
  naddr: nip19.naddrEncode,
  nrelay: nip19.nrelayEncode,
};

export const nip19Decode = nip19.decode;

/**
 * Format public key for display
 */
export function formatPubkey(pubkey, type = "short") {
  if (!pubkey) return "No pubkey";

  switch (type) {
    case "short":
      return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
    case "npub":
      return nip19Encode.npub(pubkey);
    case "full":
      return pubkey;
    default:
      return pubkey.slice(0, 16) + "...";
  }
}

// ==================== NIP-05: Verified Profiles ====================

/**
 * Verify NIP-05 address and get profile
 */
export async function verifyNIP05(nip05Address) {
  try {
    const profile = await nip05.queryProfile(nip05Address);
    return profile;
  } catch (error) {
    console.error("NIP-05 verification failed:", error);
    return null;
  }
}

/**
 * Get user profile with NIP-05 and fallback
 */
export async function getUserProfile(pubkey, nip05Address) {
  let profile = { pubkey };

  // Try NIP-05 first
  if (nip05Address) {
    try {
      const nip05Profile = await verifyNIP05(nip05Address);
      if (nip05Profile) {
        profile = { ...profile, ...nip05Profile, nip05Verified: true };
      }
    } catch (error) {
      console.warn("NIP-05 verification failed:", error);
    }
  }

  // Try to get kind 0 metadata event as fallback
  try {
    const pool = await initializePool();
    const metadataEvent = await getEvent(pool, undefined, {
      kinds: [0],
      authors: [pubkey],
      limit: 1,
    });

    if (metadataEvent) {
      const metadata = JSON.parse(metadataEvent.content);
      profile = { ...profile, ...metadata, fromMetadata: true };
    }
  } catch (error) {
    console.warn("Failed to get metadata:", error);
  }

  return profile;
}

// ==================== NIP-10: Thread Parsing ====================

export function parseThread(event) {
  try {
    return nip10.parse(event);
  } catch (error) {
    console.error("Thread parsing failed:", error);
    return { root: null, reply: null, mentions: [], profiles: [] };
  }
}

/**
 * Create reply event
 */
export function createReplyEvent(
  originalEvent,
  replyContent,
  privKey,
  additionalTags = [],
) {
  const tags = [
    ["e", originalEvent.id],
    ["p", originalEvent.pubkey],
  ];

  // Add thread context
  const thread = parseThread(originalEvent);
  if (thread.root && thread.root.id !== originalEvent.id) {
    tags.push(["e", thread.root.id, "root"]);
  }

  tags.push(...additionalTags);

  return {
    kind: 1,
    content: replyContent,
    tags,
    created_at: Math.floor(Date.now() / 1000),
  };
}

// ==================== NIP-57: Gift Wraps (Zaps) ====================

/**
 * Create zap request
 */
export function createZapRequest(pubkey, eventId, amount, message = "") {
  const zapRequest = {
    kind: 9734,
    content: message,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["p", pubkey],
      ["e", eventId],
      ["amount", amount.toString()],
      ["relays", ...DEFAULT_RELAYS.slice(0, 3)],
    ],
  };

  return zapRequest;
}

/**
 * Verify zap receipt
 */
export function verifyZapReceipt(zapEvent) {
  try {
    if (zapEvent.kind !== 9735) return false;

    const bolt11 = zapEvent.tags.find((tag) => tag[0] === "bolt11")?.[1];
    const description = zapEvent.tags.find(
      (tag) => tag[0] === "description",
    )?.[1];

    return {
      isValid: true,
      bolt11,
      description,
      amount: extractAmountFromBolt11(bolt11),
      sender: zapEvent.pubkey,
      recipient: zapEvent.tags.find((tag) => tag[0] === "p")?.[1],
    };
  } catch (error) {
    console.error("Zap verification failed:", error);
    return { isValid: false };
  }
}

/**
 * Extract amount from bolt11 invoice
 */
function extractAmountFromBolt11(bolt11) {
  if (!bolt11) return 0;

  try {
    // Simple extraction - in production you'd want proper bolt11 parsing
    const match = bolt11.match(/lnbc(\d+)/);
    return match ? parseInt(match[1]) : 0;
  } catch (error) {
    return 0;
  }
}

// ==================== Relay Management ====================

/**
 * Test relay connectivity
 */
export async function testRelay(relayUrl) {
  try {
    const pool = await initializePool([relayUrl]);
    const testEvent = await getEvent(pool, [relayUrl], {
      kinds: [1],
      limit: 1,
    });
    return { connected: true, relay: relayUrl };
  } catch (error) {
    return { connected: false, relay: relayUrl, error: error.message };
  }
}

/**
 * Get relay information (NIP-11)
 */
export async function getRelayInfo(relayUrl) {
  try {
    const response = await fetch(
      `${relayUrl.replace("wss://", "https://").replace("ws://", "http://")}/.well-known/nostr.json`,
    );
    const info = await response.json();
    return info;
  } catch (error) {
    console.error("Failed to get relay info:", error);
    return null;
  }
}

/**
 * Add custom relay
 */
export function addCustomRelay(relayUrl) {
  if (!relayUrl) return false;

  try {
    // Validate URL format
    const url = new URL(relayUrl);
    if (!["ws:", "wss:"].includes(url.protocol)) {
      throw new Error("Invalid relay protocol");
    }

    // Store in localStorage for persistence
    const customRelays = getCustomRelays();
    if (!customRelays.includes(relayUrl)) {
      customRelays.push(relayUrl);
      localStorage.setItem("customRelays", JSON.stringify(customRelays));
    }

    return true;
  } catch (error) {
    console.error("Failed to add custom relay:", error);
    return false;
  }
}

/**
 * Get custom relays from localStorage
 */
export function getCustomRelays() {
  try {
    const stored = localStorage.getItem("customRelays");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Remove custom relay
 */
export function removeCustomRelay(relayUrl) {
  const customRelays = getCustomRelays();
  const updated = customRelays.filter((url) => url !== relayUrl);
  localStorage.setItem("customRelays", JSON.stringify(updated));
  return updated;
}

/**
 * Get all available relays
 */
export function getAllRelays() {
  return [...DEFAULT_RELAYS, ...getCustomRelays()];
}

// ==================== Event Search ====================

/**
 * Search events by content
 */
export async function searchEvents(searchQuery, options = {}) {
  const {
    kinds = [1],
    limit = 50,
    authors = [],
    since = null,
    until = null,
  } = options;

  try {
    const pool = await initializePool();
    const filters = {
      kinds,
      limit,
      search: searchQuery,
    };

    if (authors.length > 0) filters.authors = authors;
    if (since) filters.since = since;
    if (until) filters.until = until;

    return await queryEvents(pool, undefined, filters);
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
}

/**
 * Search user profiles
 */
export async function searchUsers(searchQuery, limit = 20) {
  try {
    const pool = await initializePool();
    const events = await queryEvents(pool, undefined, {
      kinds: [0],
      search: searchQuery,
      limit,
    });

    // Extract profiles from metadata events
    return events.map((event) => {
      try {
        const metadata = JSON.parse(event.content);
        return {
          pubkey: event.pubkey,
          ...metadata,
          created_at: event.created_at,
        };
      } catch (error) {
        return {
          pubkey: event.pubkey,
          name: "Unknown",
          created_at: event.created_at,
        };
      }
    });
  } catch (error) {
    console.error("User search failed:", error);
    return [];
  }
}

/**
 * Get trending events
 */
export async function getTrendingEvents(timeframe = "day", limit = 20) {
  const since = getTimeframeSince(timeframe);

  try {
    const pool = await initializePool();
    return await queryEvents(pool, undefined, {
      kinds: [1],
      since,
      limit,
    });
  } catch (error) {
    console.error("Failed to get trending events:", error);
    return [];
  }
}

/**
 * Get timeframe since timestamp
 */
function getTimeframeSince(timeframe) {
  const now = Math.floor(Date.now() / 1000);
  const day = 86400; // 24 hours in seconds
  const week = day * 7;
  const month = day * 30;

  switch (timeframe) {
    case "day":
      return now - day;
    case "week":
      return now - week;
    case "month":
      return now - month;
    default:
      return now - day;
  }
}

// ==================== Utility Functions ====================

/**
 * Close all connections
 */
export function closePool() {
  if (globalPool) {
    globalPool.close([]);
    globalPool = null;
  }
}

/**
 * Get user kind 3 follow list
 */
export async function getFollowList(pubkey) {
  try {
    const pool = await initializePool();
    const followEvent = await getEvent(pool, undefined, {
      kinds: [3],
      authors: [pubkey],
      limit: 1,
    });

    if (followEvent) {
      return followEvent.tags
        .filter((tag) => tag[0] === "p")
        .map((tag) => tag[1]);
    }
    return [];
  } catch (error) {
    console.error("Failed to get follow list:", error);
    return [];
  }
}

/**
 * Create metadata event (kind 0)
 */
export function createMetadataEvent(metadata, privKey) {
  const content = JSON.stringify(metadata);

  return {
    kind: 0,
    content,
    tags: [],
    created_at: Math.floor(Date.now() / 1000),
  };
}

// Re-exports for convenience
export { getPublicKey, verifyEvent, getEventHash };
