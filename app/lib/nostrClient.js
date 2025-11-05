import { SimplePool } from "nostr-tools/pool";
import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  verifyEvent,
  getEventHash,
} from "nostr-tools/pure";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

// Re-export core functions for use in other modules
export { getPublicKey, bytesToHex, hexToBytes };

// Default relay URLs for the pool
const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://fenrir-s.notoshi.win",
  "wss://relayrs.notoshi.win",
  "wss://relay.siamdev.cc",
  "wss://nfrelay.app",
  "wss://nos.lol",
  "wss://relay.notoshi.win",
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
  return generateSecretKey(); // Returns Uint8Array
}

/**
 * Generate a deterministic thread id from a title.
 */
export function generateThreadId(title) {
  // Create a slug from title
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Simple hash function for title
  const simpleHash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h = h & h; // Convert to 32-bit integer
    }
    return Math.abs(h);
  };

  const hash = simpleHash(title).toString(16).padStart(8, "0");
  return slug ? `${slug}-${hash}` : hash;
}

/**
 * Convert private key to hex string
 */
export function privateKeyToHex(sk) {
  if (typeof sk === "string") return sk;
  if (sk instanceof Uint8Array) {
    return bytesToHex(sk);
  }
  return Buffer.from(sk).toString("hex");
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToUint8Array(hex) {
  if (hex instanceof Uint8Array) return hex;
  if (typeof hex !== "string") {
    throw new Error("hexToUint8Array expects a string or Uint8Array");
  }

  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("Hex string must be exactly 64 characters");
  }

  return hexToBytes(hex);
}

/**
 * Publish event using pool
 */
export async function publishToPool(
  pool,
  relayUrls = DEFAULT_RELAYS,
  privateKeyBytes, // Expect Uint8Array
  content,
  { kind = 1, tags = [] } = {},
) {
  if (!privateKeyBytes && !browserExtensionSigner) {
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
  } else if (privateKeyBytes) {
    // Use private key (expecting Uint8Array)
    signedEvent = finalizeEvent(eventTemplate, privateKeyBytes);
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
export function subscribeToPool(pool, relayUrls, filters, callback) {
  // Use default relays if relayUrls is not provided
  const relays = relayUrls || DEFAULT_RELAYS;
  const sub = pool.subscribe(relays, filters, callback);
  return sub;
}

/**
 * Query events from pool
 */
export async function queryEvents(pool, relayUrls, filters) {
  // Use default relays if relayUrls is not provided
  const relays = relayUrls || DEFAULT_RELAYS;
  return await pool.querySync(relays, filters);
}

/**
 * Get single event from pool
 */
export async function getEvent(pool, relayUrls, eventId) {
  // Use default relays if relayUrls is not provided
  const relays = relayUrls || DEFAULT_RELAYS;
  return await pool.get(relays, { ids: [eventId] });
}

/**
 * Initialize browser extension signer
 */
export async function initializeBrowserExtension() {
  if (typeof window === "undefined" || !window.nostr) {
    return false;
  }

  try {
    const pubkey = await window.nostr.getPublicKey();
    if (pubkey) {
      browserExtensionSigner = window.nostr;
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to initialize browser extension:", error);
    return false;
  }
}

/**
 * Get public key from browser extension
 */
export async function getBrowserExtensionPubkey() {
  if (!browserExtensionSigner) {
    throw new Error("Browser extension not initialized");
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

// NIP-19 encoding helpers
// Import NIP-19 functions from proper module
import * as nip19 from "nostr-tools/nip19";
// Import NIP-05 functions from proper module
import { queryProfile } from "nostr-tools/nip05";
// Import NIP-10 functions from proper module
import * as nip10 from "nostr-tools/nip10";

const nip19Encode = {
  nsec: (bytes) => {
    return nip19.nsecEncode(bytes);
  },
  npub: (hex) => {
    return nip19.npubEncode(hex);
  },
  nevent: (id, relays = [], author = undefined) => {
    return nip19.neventEncode({ id, relays, author });
  },
  nprofile: (pubkey, relays = []) => {
    return nip19.nprofileEncode({ pubkey, relays });
  },
  naddr: (kind, pubkey, identifier, relays = []) => {
    return nip19.naddrEncode({ kind, pubkey, identifier, relays });
  },
  nrelay: (url) => {
    return nip19.nrelayEncode(url);
  },
};

const nip19Decode = (encoded) => {
  return nip19.decode(encoded);
};

// Export nip19 functions for external use
export { nip19Encode, nip19Decode };

/**
 * Format public key for display
 */
export function formatPubkey(pubkey, format = "npub") {
  if (!pubkey) return "";

  switch (format) {
    case "hex":
      return pubkey;
    case "npub":
      return nip19Encode.npub(pubkey);
    case "short":
      const npub = nip19Encode.npub(pubkey);
      return npub.substring(0, 12) + "...";
    case "medium":
      const npubMed = nip19Encode.npub(pubkey);
      return npubMed.substring(0, 20) + "...";
    default:
      return pubkey;
  }
}

/**
 * Verify NIP-05 address
 */
export async function verifyNIP05(address, pubkey) {
  try {
    const profile = await queryProfile(address);
    return profile?.pubkey === pubkey;
  } catch (error) {
    console.error("Error verifying NIP-05:", error);
    return false;
  }
}

/**
 * Get user profile metadata
 */
export async function getUserProfile(pubkey) {
  try {
    const pool = await initializePool();
    const metadataEvent = await pool.get(DEFAULT_RELAYS, {
      kinds: [0],
      authors: [pubkey],
      limit: 1,
    });

    if (!metadataEvent) {
      return {
        name: "Anonymous",
        picture: `https://robohash.org/${pubkey}.png`,
        about: "",
      };
    }

    const metadata = JSON.parse(metadataEvent.content);
    return {
      name: metadata.name || "Anonymous",
      display_name: metadata.display_name || metadata.name || "Anonymous",
      picture: metadata.picture || `https://robohash.org/${pubkey}.png`,
      about: metadata.about || "",
      nip05: metadata.nip05 || null,
      lud16: metadata.lud16 || null,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      name: "Anonymous",
      picture: `https://robohash.org/${pubkey}.png`,
      about: "",
    };
  }
}

/**
 * Parse thread from event using NIP-10
 */
export function parseThread(event) {
  try {
    // Use official NIP-10 parsing
    const refs = nip10.parse(event);

    return {
      root: refs.root ? refs.root.id : null,
      reply: refs.reply ? refs.reply.id : null,
      mentions: refs.mentions.map((mention) => mention.id),
      profiles: refs.profiles.map((profile) => profile.pubkey),
    };
  } catch (error) {
    console.warn(
      "Failed to parse thread with NIP-10, falling back to custom parser:",
      error,
    );

    // Fallback to custom implementation
    const root = event.tags.find((tag) => tag[0] === "e" && tag[3] === "root");
    const reply = event.tags.find(
      (tag) => tag[0] === "e" && tag[3] === "reply",
    );
    const mentions = event.tags.filter((tag) => tag[0] === "p");
    const profiles = event.tags.filter((tag) => tag[0] === "profile");

    return {
      root: root ? root[1] : null,
      reply: reply ? reply[1] : null,
      mentions: mentions.map((tag) => tag[1]),
      profiles: profiles.map((tag) => tag[1]),
    };
  }
}

/**
 * Create reply event
 */
export function createReplyEvent(
  originalEvent,
  replyContent,
  privateKeyBytes,
  boardId = null,
) {
  const thread = parseThread(originalEvent);
  const tags = [];

  // Add root event tag
  if (thread.root) {
    tags.push(["e", thread.root, "", "root"]);
  }

  // Add reply to tag
  tags.push(["e", originalEvent.id, "", "reply"]);

  // Add author tag
  tags.push(["p", originalEvent.pubkey]);

  // Add board tag if provided
  if (boardId) {
    tags.push(["board", boardId]);
  }

  // Add forum tags
  tags.push(["t", "forum"]);
  tags.push(["t", "webboard"]);

  const eventTemplate = {
    kind: 1, // Regular text note
    content: replyContent,
    created_at: Math.floor(Date.now() / 1000),
    tags,
  };

  return finalizeEvent(eventTemplate, privateKeyBytes);
}

/**
 * Create zap request
 */
export function createZapRequest(
  amount,
  recipient,
  eventId,
  relays,
  message = "",
) {
  const zapRequest = {
    kind: 9734,
    content: message,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["p", recipient],
      ["amount", amount.toString()],
      ["relays", ...relays],
    ],
    ...(eventId ? [["e", eventId]] : []),
  };

  return zapRequest;
}

/**
 * Verify zap receipt
 */
export function verifyZapReceipt(zapEvent) {
  try {
    const bolt11 = zapEvent.tags.find((tag) => tag[0] === "bolt11")?.[1];
    const description = zapEvent.tags.find(
      (tag) => tag[0] === "description",
    )?.[1];

    if (!bolt11 || !description) return false;

    // In a real implementation, you would verify the bolt11 invoice
    // This is a simplified check
    const isValid = verifyEvent(zapEvent);
    const amount = extractAmountFromBolt11(bolt11);
    const sender = zapEvent.tags.find((tag) => tag[0] === "p")?.[1];
    const recipient = zapEvent.tags.find((tag) => tag[0] === "P")?.[1];

    return {
      isValid,
      amount,
      sender,
      recipient,
    };
  } catch (error) {
    console.error("Error verifying zap receipt:", error);
    return { isValid: false };
  }
}

/**
 * Extract amount from bolt11 invoice
 */
export function extractAmountFromBolt11(bolt11) {
  try {
    const match = bolt11.match(/lnbc(\d+)n1/);
    return match ? parseInt(match[1]) : 0;
  } catch (error) {
    console.error("Error extracting amount from bolt11:", error);
    return 0;
  }
}

/**
 * Test relay connection
 */
export async function testRelay(relayUrl) {
  try {
    const pool = await initializePool([relayUrl]);
    const testEvent = {
      kinds: [1],
      limit: 1,
    };

    const events = await pool.querySync([relayUrl], testEvent);
    const connected = events.length >= 0; // If we get any response, relay is working

    return {
      relay: relayUrl,
      connected,
      error: null,
    };
  } catch (error) {
    return {
      relay: relayUrl,
      connected: false,
      error: error.message,
    };
  }
}

/**
 * Get relay info
 */
export async function getRelayInfo(relayUrl) {
  try {
    const response = await fetch(
      `${relayUrl.replace("wss://", "https://")}/info`,
    );
    const info = await response.json();
    return info;
  } catch (error) {
    console.error("Error getting relay info:", error);
    return null;
  }
}

/**
 * Add custom relay
 */
export function addCustomRelay(relayUrl) {
  try {
    const url = new URL(relayUrl);
    if (url.protocol !== "wss:" && url.protocol !== "ws:") {
      throw new Error("Relay URL must use ws:// or wss:// protocol");
    }

    const customRelays = getCustomRelays();
    if (!customRelays.includes(relayUrl)) {
      customRelays.push(relayUrl);
      localStorage.setItem("custom_relays", JSON.stringify(customRelays));
    }

    return true;
  } catch (error) {
    console.error("Error adding custom relay:", error);
    return false;
  }
}

/**
 * Get custom relays
 */
export function getCustomRelays() {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("custom_relays");
  return stored ? JSON.parse(stored) : [];
}

/**
 * Remove custom relay
 */
export function removeCustomRelay(relayUrl) {
  const customRelays = getCustomRelays();
  const updated = customRelays.filter((relay) => relay !== relayUrl);
  localStorage.setItem("custom_relays", JSON.stringify(updated));
}

/**
 * Get all relays (default + custom)
 */
export function getAllRelays() {
  return [...DEFAULT_RELAYS, ...getCustomRelays()];
}

/**
 * Search events
 */
export async function searchEvents(query) {
  try {
    const pool = await initializePool();
    const filters = {
      search: query,
      kinds: [1, 30023],
      limit: 50,
    };

    const events = await pool.querySync(DEFAULT_RELAYS, filters);
    return events;
  } catch (error) {
    console.error("Error searching events:", error);
    return [];
  }
}

/**
 * Search users
 */
export async function searchUsers(query) {
  try {
    const pool = await initializePool();
    const events = await pool.querySync(DEFAULT_RELAYS, {
      kinds: [0],
      search: query,
      limit: 20,
    });

    const users = events.map((metadata) => ({
      pubkey: metadata.pubkey,
      name: JSON.parse(metadata.content).name || "Anonymous",
      picture: JSON.parse(metadata.content).picture || "",
      created_at: metadata.created_at,
    }));

    return users;
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}

/**
 * Get trending events
 */
export async function getTrendingEvents(timeframe = "day") {
  try {
    const since = getTimeframeSince(timeframe);
    const pool = await initializePool();

    const events = await pool.querySync(DEFAULT_RELAYS, {
      kinds: [1, 30023],
      since,
      limit: 100,
    });

    return events;
  } catch (error) {
    console.error("Error getting trending events:", error);
    return [];
  }
}

/**
 * Get timeframe since timestamp
 */
function getTimeframeSince(timeframe) {
  const now = Math.floor(Date.now() / 1000);
  switch (timeframe) {
    case "hour":
      return now - 3600;
    case "day":
      return now - 86400;
    case "week":
      return now - 604800;
    case "month":
      return now - 2592000;
    default:
      return now - 86400;
  }
}

/**
 * Close pool connections
 */
export function closePool() {
  if (globalPool) {
    globalPool.close(DEFAULT_RELAYS);
    globalPool = null;
  }
}

/**
 * Get follow list
 */
export async function getFollowList(pubkey) {
  try {
    const pool = await initializePool();
    const followEvent = await pool.get(DEFAULT_RELAYS, {
      kinds: [3],
      authors: [pubkey],
      limit: 1,
    });

    if (!followEvent) return [];

    const pubkeys = followEvent.tags
      .filter((tag) => tag[0] === "p")
      .map((tag) => tag[1]);

    return pubkeys;
  } catch (error) {
    console.error("Error getting follow list:", error);
    return [];
  }
}

/**
 * Create metadata event
 */
export function createMetadataEvent(metadata, privateKeyBytes) {
  const eventTemplate = {
    kind: 0,
    content: JSON.stringify(metadata),
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
  };

  return finalizeEvent(eventTemplate, privateKeyBytes);
}

/**
 * Helper to publish a forum thread event (kind: 30023 - long-form / NIP-23)
 *
 * Required tags (per project spec):
 *  - ["d", "unique-thread-id"]          // unique replaceable id
 *  - ["title", "thread title"]
 *  - ["board", "board-name"]
 *  - ["t", "forum"]
 *  - ["t", "webboard"]
 *  - ["published_at", "timestamp"]
 * Optional:
 *  - ["summary", "brief description"]
 *  - ["sticky", "true"/"false"]
 *  - ["locked", "true"/"false"]
 *  - ["category", "category-name"]
 *
 * Parameters:
 *  - pool: SimplePool instance (from initializePool)
 *  - relayUrls: array of relay URLs (optional)
 *  - privateKeyBytes: Uint8Array private key (required if no browser extension)
 *  - opts: object with fields:
 *      - threadId (required) : string
 *      - title (required-ish) : string
 *      - board (required-ish) : string (e.g., "nostr-cafe")
 *      - content : markdown string (body)
 *      - published_at : unix timestamp (seconds) - defaults to now
 *      - summary, sticky, locked, category : optional metadata
 *
 * Returns the signed and published event.
 */
export async function publishThread(
  pool,
  relayUrls = DEFAULT_RELAYS,
  privateKeyBytes,
  opts = {},
) {
  const {
    threadId,
    title = "",
    board = "",
    content = "",
    published_at = Math.floor(Date.now() / 1000),
    summary,
    sticky,
    locked,
    category,
  } = opts || {};

  if (!threadId) {
    throw new Error("publishThread: 'threadId' (d-tag) is required");
  }

  // Build required tags
  const tags = [
    ["d", threadId],
    ["title", title],
    ["board", board],
    ["t", "forum"],
    ["t", "webboard"],
    ["published_at", String(published_at)],
  ];

  // Optional tags
  if (summary) tags.push(["summary", summary]);
  if (typeof sticky !== "undefined")
    tags.push(["sticky", sticky ? "true" : "false"]);
  if (typeof locked !== "undefined")
    tags.push(["locked", locked ? "true" : "false"]);
  if (category) tags.push(["category", category]);

  // Use the existing publish helper which handles signing (browser extension or private key)
  const event = await publishToPool(pool, relayUrls, privateKeyBytes, content, {
    kind: 30023,
    tags,
  });

  return event;
}
