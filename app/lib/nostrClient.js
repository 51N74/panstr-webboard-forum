import { SimplePool } from "nostr-tools/pool";
import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  verifyEvent,
  getEventHash,
} from "nostr-tools/pure";
// Simple utility functions to avoid noble/hashes import issues
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}
// Note: For production, install: @noble/hashes @noble/ciphers @scure/bip39
// Basic implementations for demo purposes
import * as nip04 from "nostr-tools/nip04";
import * as nip44 from "nostr-tools/nip44";

// Simple random bytes function
function getRandomBytes(length) {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}
// Note: NIP-44 encryption will use nip44.encrypt/decrypt from nostr-tools

// Re-export core functions for use in other modules
/**
 * NIP-49: Private Key Encryption (Simplified Demo Version)
 */
export async function encryptPrivateKey(privateKeyHex, password, options = {}) {
  try {
    const { name = "" } = options;

    // Simple XOR encryption for demo (NOT SECURE - use proper crypto in production)
    const passwordBytes = new TextEncoder().encode(
      password.padEnd(32, "0").slice(0, 32),
    );
    const keyBytes = hexToBytes(privateKeyHex);
    const encrypted = keyBytes.map(
      (byte, i) => byte ^ passwordBytes[i % passwordBytes.length],
    );

    const encryptedKeyData = {
      version: "2",
      key: bytesToHex(new Uint8Array(encrypted)),
      name: name || "",
      url: "",
      method: "xor", // Demo only
      tags: [],
      timestamp: Math.floor(Date.now() / 1000),
    };

    const payload = JSON.stringify(encryptedKeyData);
    const encoded = Buffer.from(payload).toString("base64");

    return {
      encrypted: bytesToHex(new Uint8Array(encrypted)),
      encoded,
      metadata: {
        version: "2",
        method: "xor",
        timestamp: encryptedKeyData.timestamp,
      },
    };
  } catch (error) {
    console.error("Error encrypting private key:", error);
    throw new Error("Failed to encrypt private key");
  }
}

/**
 * NIP-49: Decrypt private key (Simplified Demo Version)
 */
export async function decryptPrivateKey(encryptedData, password) {
  try {
    let encryptedKeyData;

    if (typeof encryptedData === "string") {
      const decoded = Buffer.from(encryptedData, "base64").toString("utf8");
      encryptedKeyData = JSON.parse(decoded);
    } else {
      encryptedKeyData = encryptedData;
    }

    const { key } = encryptedKeyData;

    // Simple XOR decryption for demo (NOT SECURE - use proper crypto in production)
    const passwordBytes = new TextEncoder().encode(
      password.padEnd(32, "0").slice(0, 32),
    );
    const encrypted = hexToBytes(key);
    const decrypted = encrypted.map(
      (byte, i) => byte ^ passwordBytes[i % passwordBytes.length],
    );

    return bytesToHex(new Uint8Array(decrypted));
  } catch (error) {
    console.error("Error decrypting private key:", error);
    throw new Error(
      "Failed to decrypt private key - invalid password or corrupted data",
    );
  }
}

/**
 * NIP-06: Generate key from mnemonic (Demo Version)
 */
export function generateKeysFromMnemonic(mnemonic, passphrase = "") {
  try {
    // Simple validation for demo
    if (!mnemonic || mnemonic.split(" ").length < 12) {
      throw new Error("Invalid mnemonic phrase - must be at least 12 words");
    }

    // Generate deterministic seed from mnemonic (NOT SECURE - use proper BIP39 in production)
    const seed = new TextEncoder().encode(mnemonic + (passphrase || ""));
    const privateKey = generateSecretKey(seed);
    const publicKey = getPublicKey(privateKey);

    return {
      mnemonic,
      seed: bytesToHex(seed),
      privateKeyHex: bytesToHex(privateKey),
      publicKeyHex: bytesToHex(publicKey),
    };
  } catch (error) {
    console.error("Error generating keys from mnemonic:", error);
    throw new Error("Failed to generate keys from mnemonic");
  }
}

/**
 * Generate new mnemonic phrase (Demo Version)
 */
export function generateMnemonic(strength = 128) {
  try {
    // Simple 12-word mnemonic generator for demo
    const words = [
      "abandon",
      "ability",
      "able",
      "about",
      "above",
      "absent",
      "absorb",
      "abstract",
      "absurd",
      "abuse",
      "access",
      "accident",
      "account",
      "accuse",
      "achieve",
      "acid",
      "acoustic",
      "acquire",
      "across",
      "act",
      "action",
      "actor",
      "actress",
      "actual",
      "adapt",
      "add",
      "addict",
      "address",
      "adjust",
      "admit",
      "adult",
      "advance",
      "advice",
      "aerobic",
      "affair",
      "afford",
      "afraid",
      "again",
      "age",
      "agent",
      "agree",
      "ahead",
      "aim",
      "air",
      "airport",
      "aisle",
      "alarm",
      "album",
    ];

    const wordCount = 12;
    const mnemonic = [];
    for (let i = 0; i < wordCount; i++) {
      const index = Math.floor(Math.random() * words.length);
      mnemonic.push(words[index]);
    }

    return mnemonic.join(" ");
  } catch (error) {
    console.error("Error generating mnemonic:", error);
    throw new Error("Failed to generate mnemonic phrase");
  }
}

/**
 * Secure key storage with encryption
 */
export async function storeEncryptedKey(privateKeyHex, password, name = "") {
  try {
    const encrypted = await encryptPrivateKey(privateKeyHex, password, {
      name,
    });
    const storageKey = `encrypted_key_${encrypted.metadata.timestamp}`;

    // Store in localStorage (in production, use secure storage)
    localStorage.setItem(storageKey, encrypted.encoded);

    // Cache for current session
    encryptedKeyCache.set(storageKey, encrypted);

    return storageKey;
  } catch (error) {
    console.error("Error storing encrypted key:", error);
    throw error;
  }
}

/**
 * Retrieve and decrypt stored key
 */
export async function retrieveEncryptedKey(storageKey, password) {
  try {
    // Check cache first
    if (encryptedKeyCache.has(storageKey)) {
      const cached = encryptedKeyCache.get(storageKey);
      return await decryptPrivateKey(cached.encrypted, password);
    }

    // Retrieve from storage
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      throw new Error("Encrypted key not found");
    }

    return await decryptPrivateKey(stored, password);
  } catch (error) {
    console.error("Error retrieving encrypted key:", error);
    throw error;
  }
}

/**
 * List all stored encrypted keys
 */
export function listStoredKeys() {
  const keys = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("encrypted_key_")) {
      try {
        const stored = localStorage.getItem(key);
        const decoded = Buffer.from(stored, "base64").toString("utf8");
        const data = JSON.parse(decoded);

        keys.push({
          storageKey: key,
          name: data.name || `Key ${keys.length + 1}`,
          timestamp: data.timestamp,
          version: data.version,
        });
      } catch (error) {
        console.warn(`Invalid encrypted key found: ${key}`, error);
      }
    }
  }

  return keys.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Delete stored encrypted key
 */
export function deleteStoredKey(storageKey) {
  try {
    localStorage.removeItem(storageKey);
    encryptedKeyCache.delete(storageKey);
    return true;
  } catch (error) {
    console.error("Error deleting stored key:", error);
    return false;
  }
}

/**
 * NIP-44: Versioned encrypted direct messages (using nostr-tools built-in)
 */
export async function encryptMessageNIP44(
  message,
  recipientPubkey,
  senderPrivateKey,
) {
  try {
    // Use NIP-44 for encryption
    const encrypted = await nip44.encrypt(
      message,
      recipientPubkey,
      senderPrivateKey,
    );

    return {
      encrypted,
      version: "nip44",
      timestamp: Math.floor(Date.now() / 1000),
    };
  } catch (error) {
    console.error("Error encrypting message with NIP-44:", error);
    throw new Error("Failed to encrypt message");
  }
}

/**
 * NIP-44: Decrypt message (using nostr-tools built-in)
 */
export async function decryptMessageNIP44(
  encryptedMessage,
  senderPubkey,
  recipientPrivateKey,
) {
  try {
    const decrypted = await nip44.decrypt(
      encryptedMessage,
      senderPubkey,
      recipientPrivateKey,
    );

    return {
      decrypted,
      timestamp: Math.floor(Date.now() / 1000),
    };
  } catch (error) {
    console.error("Error decrypting message with NIP-44:", error);
    throw new Error("Failed to decrypt message");
  }
}

/**
 * Create NIP-42 authentication event
 */
export function createAuthEvent(
  relayUrl,
  challenge,
  privateKey,
  additionalTags = [],
) {
  try {
    const authEvent = {
      kind: 22242, // NIP-42 authentication kind
      created_at: Math.floor(Date.now() / 1000),
      content: "",
      tags: [["relay", relayUrl], ["challenge", challenge], ...additionalTags],
    };

    const signedEvent = finalizeEvent(authEvent, privateKey);
    return signedEvent;
  } catch (error) {
    console.error("Error creating auth event:", error);
    throw new Error("Failed to create authentication event");
  }
}

/**
 * Authenticate with relay using NIP-42
 */
export async function authenticateWithRelay(
  relayUrl,
  privateKey,
  additionalTags = [],
) {
  try {
    const pool = getPool();
    const relay = pool.relays.get(relayUrl);

    if (!relay) {
      throw new Error("Relay not connected");
    }

    // Get AUTH challenge from relay
    const challenge = relay.auth?.challenge;
    if (!challenge) {
      throw new Error("No authentication challenge available");
    }

    // Create and send AUTH event
    const authEvent = createAuthEvent(
      relayUrl,
      challenge,
      privateKey,
      additionalTags,
    );

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Authentication timeout"));
      }, 5000);

      relay.auth(authEvent, () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    return {
      success: true,
      relayUrl,
      timestamp: Math.floor(Date.now() / 1000),
    };
  } catch (error) {
    console.error("Error authenticating with relay:", error);
    return {
      success: false,
      error: error.message,
      relayUrl,
    };
  }
}

/**
 * Role-based access control for NIP-42
 */
export const ACCESS_ROLES = {
  PUBLIC: "public",
  SUBSCRIBER: "subscriber",
  PREMIUM: "premium",
  ADMIN: "admin",
};

export const ROLE_PERMISSIONS = {
  [ACCESS_ROLES.PUBLIC]: {
    canRead: true,
    canWrite: false,
    canCreateEvents: false,
    maxRateLimit: 10,
  },
  [ACCESS_ROLES.SUBSCRIBER]: {
    canRead: true,
    canWrite: true,
    canCreateEvents: true,
    maxRateLimit: 100,
  },
  [ACCESS_ROLES.PREMIUM]: {
    canRead: true,
    canWrite: true,
    canCreateEvents: true,
    maxRateLimit: 1000,
  },
  [ACCESS_ROLES.ADMIN]: {
    canRead: true,
    canWrite: true,
    canCreateEvents: true,
    maxRateLimit: 10000,
    canModerate: true,
  },
};

/**
 * Check user permissions based on role
 */
export function checkPermission(role, permission) {
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) {
    return false;
  }

  return rolePerms[permission] || false;
}

/**
 * Create token-based authentication payload
 */
export function createAuthToken(payload, privateKey, expiresIn = 3600) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const tokenData = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
      jti: bytesToHex(randomBytes(16)),
    };

    const tokenEvent = {
      kind: 27235, // Custom token event kind
      created_at: now,
      content: JSON.stringify(tokenData),
      tags: [],
    };

    const signedEvent = finalizeEvent(tokenEvent, privateKey);
    return bytesToHex(JSON.stringify(signedEvent));
  } catch (error) {
    console.error("Error creating auth token:", error);
    throw new Error("Failed to create authentication token");
  }
}

/**
 * Verify auth token
 */
export function verifyAuthToken(token, publicKey) {
  try {
    const eventData = JSON.parse(Buffer.from(token, "hex").toString("utf8"));

    // Verify event signature
    if (!verifyEvent(eventData)) {
      throw new Error("Invalid token signature");
    }

    // Verify public key matches
    if (eventData.pubkey !== publicKey) {
      throw new Error("Token public key mismatch");
    }

    // Parse token data
    const tokenData = JSON.parse(eventData.content);
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (tokenData.exp < now) {
      throw new Error("Token expired");
    }

    return {
      valid: true,
      payload: tokenData,
    };
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return {
      valid: false,
      error: error.message,
    };
  }
}

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

// NIP-49 encrypted keys storage
let encryptedKeyCache = new Map();

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
 * Subscribe to events using pool (simple wrapper)
 *
 * NOTE: kept for backward compatibility. Prefer `liveSubscribe` for
 * real-time subscriptions with deduplication and keep-alive management.
 */
export function subscribeToPool(pool, relayUrls, filters, callback) {
  // Use default relays if relayUrls is not provided
  const relays = relayUrls || DEFAULT_RELAYS;
  const sub = pool.subscribe(relays, filters, callback);
  return sub;
}

/**
 * Live subscription helper with:
 * - event deduplication (per-subscription)
 * - optional keep-alive heartbeat to keep relays warm
 * - centralized subscription tracking for easier cleanup/reconnect
 *
 * Usage:
 *   const unsubscribe = liveSubscribe(pool, relays, filters, (event, relay) => { ... }, options);
 *   // When finished:
 *   unsubscribe();
 */
const _activeSubscriptions = new Map(); // id -> { sub, heartbeat, seen }

export function liveSubscribe(pool, relayUrls, filters, onEvent, options = {}) {
  const {
    dedupe = true,
    keepAlive = true,
    heartbeatMs = 30 * 1000, // default 30s
    idempotencyKey = null, // optional external id for tracking
  } = options || {};

  const relays = relayUrls || DEFAULT_RELAYS;
  const subId =
    idempotencyKey || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Per-subscription seen set for deduplication
  const seen = new Set();

  // Wrapped callback applies deduplication and error isolation
  const wrappedCallback = (event, relay) => {
    try {
      if (dedupe && event && event.id) {
        if (seen.has(event.id)) return;
        seen.add(event.id);
      }
      // Forward event
      onEvent && onEvent(event, relay);
    } catch (err) {
      // Prevent subscription callback exceptions from breaking pool internals
      console.error("liveSubscribe wrappedCallback error:", err);
    }
  };

  // Subscribe using pool
  const sub = pool.subscribe(relays, filters, wrappedCallback);

  // Heartbeat: periodically perform a lightweight query to keep connections alive
  let heartbeat = null;
  if (keepAlive && typeof pool.querySync === "function") {
    try {
      heartbeat = setInterval(() => {
        try {
          // A minimal query (limit:1) to ping relays; wrapped in try/catch
          pool.querySync(relays, { limit: 1 });
        } catch (err) {
          // ignore transient errors; they will be reflected in relay health monitoring elsewhere
        }
      }, heartbeatMs);
    } catch (err) {
      // If querySync isn't available or fails, do nothing
      heartbeat = null;
    }
  }

  // Store subscription for external management / debugging
  _activeSubscriptions.set(subId, {
    sub,
    relays,
    filters,
    seen,
    heartbeat,
    createdAt: Date.now(),
  });

  // Return unsubscribe function which cleans up timers and subscription
  const unsubscribe = () => {
    try {
      // Some SimplePool subscribe wrappers expose `.unsub()` or `.unsub` method name variations.
      // Attempt common variants defensively.
      if (sub && typeof sub.unsub === "function") {
        sub.unsub();
      } else if (
        sub &&
        typeof sub.unsub === "undefined" &&
        typeof sub.unsubscribe === "function"
      ) {
        sub.unsubscribe();
      } else if (sub && typeof sub.close === "function") {
        sub.close();
      } else if (sub && typeof sub === "function") {
        // rare case where subscribe returns an unsubscribe function
        try {
          sub();
        } catch (e) {}
      }
    } catch (err) {
      // ignore unsubscribe errors
    } finally {
      if (heartbeat) {
        try {
          clearInterval(heartbeat);
        } catch (e) {}
      }
      _activeSubscriptions.delete(subId);
    }
  };

  // Return unsubscribe and metadata (for consumers who want both)
  return {
    unsubscribe,
    id: subId,
    sub,
  };
}

/**
 * Utility: list active liveSubscribe subscriptions (for diagnostics)
 */
export function listActiveSubscriptions() {
  const result = [];
  for (const [id, info] of _activeSubscriptions.entries()) {
    result.push({
      id,
      relays: info.relays,
      filters: info.filters,
      createdAt: info.createdAt,
      seenCount: info.seen ? info.seen.size : 0,
    });
  }
  return result;
}

/**
 * Utility: forcefully clear all active subscriptions (useful on app teardown)
 */
export function clearAllLiveSubscriptions() {
  for (const [id, info] of _activeSubscriptions.entries()) {
    try {
      const { sub, heartbeat } = info;
      if (sub && typeof sub.unsub === "function") sub.unsub();
      else if (sub && typeof sub.unsubscribe === "function") sub.unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
    } catch (err) {
      // continue cleaning others
    } finally {
      _activeSubscriptions.delete(id);
    }
  }
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
    // nrelayEncode is not available in nostr-tools, return the URL directly
    return url;
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
    // Validate event structure
    if (!event || !event.tags || !Array.isArray(event.tags)) {
      throw new Error("Invalid event structure for thread parsing");
    }

    // Use official NIP-10 parsing
    const refs = nip10.parse(event);

    // Handle all marker types: root, reply, mention
    const parsed = {
      root: refs.root
        ? {
            id: refs.root.id,
            relay: refs.root.relay || null,
            marker: refs.root.marker || "root",
          }
        : null,
      reply: refs.reply
        ? {
            id: refs.reply.id,
            relay: refs.reply.relay || null,
            marker: refs.reply.marker || "reply",
          }
        : null,
      mentions: refs.mentions.map((mention) => ({
        id: mention.id,
        relay: mention.relay || null,
        marker: mention.marker || "mention",
        pubkey: mention.pubkey || null,
      })),
      profiles: refs.profiles.map((profile) => ({
        pubkey: profile.pubkey,
        relay: profile.relay || null,
      })),
    };

    // Calculate thread depth
    parsed.depth = calculateThreadDepth(event);

    return parsed;
  } catch (error) {
    console.warn(
      "Failed to parse thread with NIP-10, falling back to enhanced custom parser:",
      error,
    );

    // Enhanced fallback implementation with all marker types
    const eTags = event.tags.filter((tag) => tag[0] === "e");
    const pTags = event.tags.filter((tag) => tag[0] === "p");

    const root =
      eTags.find((tag) => tag[3] === "root") || eTags.find((tag) => !tag[3]);
    const reply = eTags.find((tag) => tag[3] === "reply");
    const mentions = eTags.filter(
      (tag) =>
        tag[3] === "mention" || (!tag[3] && tag !== root && tag !== reply),
    );

    const profiles = pTags.map((tag) => ({
      pubkey: tag[1],
      relay: tag[2] || null,
    }));

    const parsed = {
      root: root
        ? {
            id: root[1],
            relay: root[2] || null,
            marker: root[3] || "root",
          }
        : null,
      reply: reply
        ? {
            id: reply[1],
            relay: reply[2] || null,
            marker: reply[3] || "reply",
          }
        : null,
      mentions: mentions.map((mention) => ({
        id: mention[1],
        relay: mention[2] || null,
        marker: mention[3] || "mention",
        pubkey: null,
      })),
      profiles: profiles,
      depth: calculateThreadDepth(event),
    };

    return parsed;
  }
}

/**
 * Calculate thread depth based on reply markers and event structure
 */
function calculateThreadDepth(event) {
  try {
    if (!event.tags) return 0;

    const eTags = event.tags.filter((tag) => tag[0] === "e");
    const replyTags = eTags.filter((tag) => tag[3] === "reply");

    // Each reply tag indicates a level of depth
    return replyTags.length;
  } catch (error) {
    console.warn("Error calculating thread depth:", error);
    return 0;
  }
}

/**
 * Optimize thread structure for display
 */
export function optimizeThreadStructure(events) {
  try {
    const eventMap = new Map();
    const threads = [];

    // Create event map
    events.forEach((event) => {
      eventMap.set(event.id, {
        ...event,
        replies: [],
        mentions: [],
      });
    });

    // Build thread structure
    events.forEach((event) => {
      const parsed = parseThread(event);
      const eventData = eventMap.get(event.id);

      if (parsed.root && eventMap.has(parsed.root.id)) {
        eventMap.get(parsed.root.id).replies.push(eventData);
      }

      if (parsed.reply && eventMap.has(parsed.reply.id)) {
        eventMap.get(parsed.reply.id).replies.push(eventData);
      }

      parsed.mentions.forEach((mention) => {
        if (eventMap.has(mention.id)) {
          eventMap.get(mention.id).mentions.push(eventData);
        }
      });

      // If this is a root event, add to threads
      if (!parsed.root && !parsed.reply) {
        threads.push(eventData);
      }
    });

    return threads;
  } catch (error) {
    console.error("Error optimizing thread structure:", error);
    return events;
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
/**
 * Create a zap request with optional splits and metadata
 */
export function createZapRequest(
  amount,
  recipient,
  eventId,
  relays,
  message = "",
  options = {},
) {
  const {
    splits = [],
    anon = false,
    zapType = "public",
    lightningAddress = null,
  } = options;

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
    ...(anon ? [["anon"]] : []),
    ...(zapType !== "public" ? [["zap_type", zapType]] : []),
    ...(lightningAddress ? [["lnurl", lightningAddress]] : []),
  };

  // Add zap splits
  splits.forEach((split) => {
    if (split.pubkey && split.percentage) {
      zapRequest.tags.push([
        "zap_split",
        split.pubkey,
        split.percentage.toString(),
        split.relay || "",
      ]);
    }
  });

  return zapRequest;
}

/**
 * Verify zap receipt with enhanced validation
 */
export function verifyZapReceipt(zapEvent) {
  try {
    if (!zapEvent || !zapEvent.tags) {
      throw new Error("Invalid zap event structure");
    }

    const bolt11 = zapEvent.tags.find((tag) => tag[0] === "bolt11")?.[1];
    const description = zapEvent.tags.find(
      (tag) => tag[0] === "description",
    )?.[1];
    const preimage = zapEvent.tags.find((tag) => tag[0] === "preimage")?.[1];

    if (!bolt11) {
      throw new Error("Missing bolt11 invoice");
    }

    // Parse description to extract zap request
    let zapRequest = null;
    try {
      zapRequest = JSON.parse(description);
    } catch (parseError) {
      throw new Error("Invalid description format");
    }

    // Validate zap request structure
    if (!zapRequest || !zapRequest.tags) {
      throw new Error("Invalid zap request structure");
    }

    // Extract zap details
    const amount = extractAmountFromBolt11(bolt11);
    const sender = zapRequest.tags.find((tag) => tag[0] === "p")?.[1];
    const recipient = zapEvent.tags.find((tag) => tag[0] === "P")?.[1];
    const eventId = zapRequest.tags.find((tag) => tag[0] === "e")?.[1];
    const message = zapRequest.content || "";
    const isAnon = zapRequest.tags.some((tag) => tag[0] === "anon");
    const zapType = zapRequest.tags.find((tag) => tag[0] === "zap_type")?.[1];

    // Extract zap splits
    const splits = zapRequest.tags
      .filter((tag) => tag[0] === "zap_split")
      .map((tag) => ({
        pubkey: tag[1],
        percentage: parseInt(tag[2]),
        relay: tag[3] || null,
      }));

    // Validate event signature
    const isValidSignature = verifyEvent(zapEvent);

    // Validate preimage if present (for paid invoices)
    let isValidPayment = true;
    if (preimage) {
      isValidPayment = verifyPreimage(preimage, bolt11);
    }

    return {
      isValid: isValidSignature && isValidPayment,
      amount,
      sender,
      recipient,
      eventId,
      message,
      isAnon,
      zapType: zapType || "public",
      splits,
      bolt11,
      preimage,
    };
  } catch (error) {
    console.error("Error verifying zap receipt:", error);
    return { isValid: false, error: error.message };
  }
}

/**
 * Create a zap goal (NIP-75)
 */
export function createZapGoal(pubkey, relays, amount, message, options = {}) {
  const { closed = false, image = null, goalId = null } = options;

  const goal = {
    kind: 9041, // Zap goal kind
    content: message,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["p", pubkey],
      ["amount", amount.toString()],
      ["relays", ...relays],
    ],
    ...(closed ? [["closed"]] : []),
    ...(image ? [["image", image]] : []),
    ...(goalId ? [["d", goalId]] : []),
  };

  return goal;
}

/**
 * Calculate zap goal progress
 */
export function calculateZapGoalProgress(goalEvent, zapEvents = []) {
  try {
    const targetAmount = parseInt(
      goalEvent.tags.find((tag) => tag[0] === "amount")?.[1] || "0",
    );
    const recipient = goalEvent.tags.find((tag) => tag[0] === "p")?.[1];
    const goalId = goalEvent.tags.find((tag) => tag[0] === "d")?.[1];

    let currentAmount = 0;
    let zappers = new Set();

    zapEvents.forEach((zapEvent) => {
      const zapReceipt = verifyZapReceipt(zapEvent);
      if (
        zapReceipt.isValid &&
        zapReceipt.recipient === recipient &&
        (!goalId || zapReceipt.eventId === goalId)
      ) {
        currentAmount += zapReceipt.amount;
        if (zapReceipt.sender) {
          zappers.add(zapReceipt.sender);
        }
      }
    });

    return {
      targetAmount,
      currentAmount,
      percentage: targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0,
      zapperCount: zappers.size,
      isCompleted: currentAmount >= targetAmount,
      zappers: Array.from(zappers),
    };
  } catch (error) {
    console.error("Error calculating zap goal progress:", error);
    return {
      targetAmount: 0,
      currentAmount: 0,
      percentage: 0,
      zapperCount: 0,
      isCompleted: false,
      zappers: [],
    };
  }
}

/**
 * Extract zap splits from zap request
 */
export function extractZapSplits(zapRequest) {
  try {
    return zapRequest.tags
      .filter((tag) => tag[0] === "zap_split")
      .map((tag) => ({
        pubkey: tag[1],
        percentage: parseInt(tag[2]),
        relay: tag[3] || null,
      }));
  } catch (error) {
    console.error("Error extracting zap splits:", error);
    return [];
  }
}

/**
 * Verify preimage for bolt11 invoice (simplified implementation)
 */
function verifyPreimage(preimage, bolt11) {
  // In a real implementation, you would verify the preimage against the bolt11 invoice
  // This is a simplified check - in production, use a proper Lightning library
  return preimage && bolt11 && preimage.length > 0;
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
 * Get user's relay list (NIP-65)
 */
export async function getRelayList(pubkey, relays = DEFAULT_RELAYS) {
  try {
    const pool = getPool();
    const filter = {
      kinds: [10002], // Relay list kind
      authors: [pubkey],
      limit: 1,
    };

    const events = await pool.list(relays, [filter]);

    if (events.length === 0) {
      return { read: [], write: [], both: [] };
    }

    const relayList = events[0];
    const read = [];
    const write = [];
    const both = [];

    relayList.tags.forEach((tag) => {
      if (tag[0] === "r") {
        const relay = tag[1];
        const permissions = tag[2];

        if (!permissions || permissions === "both") {
          both.push(relay);
        } else if (permissions === "read") {
          read.push(relay);
        } else if (permissions === "write") {
          write.push(relay);
        }
      }
    });

    return { read, write, both, event: relayList };
  } catch (error) {
    console.error("Error getting relay list:", error);
    return { read: [], write: [], both: [] };
  }
}

/**
 * Create relay list event (NIP-65)
 */
export function createRelayListEvent(readRelays, writeRelays, bothRelays = []) {
  const tags = [];

  readRelays.forEach((relay) => {
    tags.push(["r", relay, "read"]);
  });

  writeRelays.forEach((relay) => {
    tags.push(["r", relay, "write"]);
  });

  bothRelays.forEach((relay) => {
    tags.push(["r", relay, "both"]);
  });

  return {
    kind: 10002,
    content: "",
    created_at: Math.floor(Date.now() / 1000),
    tags,
  };
}

/**
 * Update user's relay list
 */
export async function updateRelayList(
  pubkey,
  privateKey,
  readRelays = [],
  writeRelays = [],
  bothRelays = [],
  targetRelays = DEFAULT_RELAYS,
) {
  try {
    const event = createRelayListEvent(readRelays, writeRelays, bothRelays);

    const signedEvent = await finalizeEvent(event, privateKey);
    await publishToPool(targetRelays, signedEvent);

    return signedEvent;
  } catch (error) {
    console.error("Error updating relay list:", error);
    throw error;
  }
}

/**
 * Test relay health and performance
 */
export async function testRelayHealth(relayUrl, timeout = 5000) {
  const startTime = Date.now();
  const healthMetrics = {
    url: relayUrl,
    connected: false,
    latency: null,
    error: null,
    supportedKinds: [],
    information: null,
  };

  try {
    const pool = getPool();

    // Test basic connectivity
    const testFilter = {
      kinds: [1],
      limit: 1,
    };

    const events = await Promise.race([
      pool.list([relayUrl], [testFilter]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeout),
      ),
    ]);

    healthMetrics.connected = true;
    healthMetrics.latency = Date.now() - startTime;

    // Get relay information (NIP-11)
    try {
      const info = await getRelayInfo(relayUrl);
      healthMetrics.information = info;

      if (info && info.supported_nips) {
        // Map NIPs to kinds
        const nipToKind = {
          1: [1, 2, 3, 4], // Basic protocol
          9: [5], // Event deletion
          10: [1, 42], // Text notes/threads
          11: [], // Relay info (no specific kind)
          12: [], // Generic tag queries
          15: [], // Marketplace
          16: [], // Event treatment
          18: [6], // Reposts
          19: [0], // Metadata
          21: [], // nostr: URIs
          22: [1111], // Comments
          23: [30023], // Long-form content
          25: [7], // Reactions
          26: [], // Delegated event signing
          28: [], // Public chat
          33: [], // Prompts
          34: [], // Git stuff
          40: [], // Event expiration
          42: [22242], // Authentication
          44: [], // Encrypted payloads
          50: [], // Search capability
          51: [30000, 30001], // Lists
          57: [9734, 9735], // Lightning zaps
          58: [], // Badges
          59: [], // Gift wrap
          65: [10002], // Relay list metadata
          70: [], // Protected events
          71: [], // Video events
          72: [], // Moderated communities
          75: [9041], // Zap goals
          84: [], // Highlights
          89: [], // App handlers
          90: [], // Data vending machines
          92: [], // Media attachments
          94: [], // File metadata
          96: [], // HTTP file storage
          98: [], // HTTP auth
          99: [], // Classified listings
        };

        healthMetrics.supportedKinds = [
          ...new Set(
            Object.entries(nipToKind)
              .filter(([nip]) => info.supported_nips.includes(parseInt(nip)))
              .flatMap(([_, kinds]) => kinds),
          ),
        ];
      }
    } catch (infoError) {
      console.warn(`Could not get relay info for ${relayUrl}:`, infoError);
    }
  } catch (error) {
    healthMetrics.error = error.message;
    healthMetrics.latency = Date.now() - startTime;
  }

  return healthMetrics;
}

/**
 * Monitor multiple relays' health
 */
export async function monitorRelayHealth(relayUrls, concurrency = 5) {
  const results = [];

  for (let i = 0; i < relayUrls.length; i += concurrency) {
    const batch = relayUrls.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((relay) => testRelayHealth(relay)),
    );

    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          url: batch[index],
          connected: false,
          latency: null,
          error: result.reason?.message || "Unknown error",
          supportedKinds: [],
          information: null,
        });
      }
    });
  }

  return results;
}

/**
 * Get optimal relays for a user based on their relay list and health
 */
export async function getOptimalRelays(
  pubkey,
  purpose = "both",
  maxRelays = 5,
) {
  try {
    const relayList = await getRelayList(pubkey);

    let candidateRelays = [];

    if (purpose === "read" || purpose === "both") {
      candidateRelays.push(...relayList.read, ...relayList.both);
    }

    if (purpose === "write" || purpose === "both") {
      candidateRelays.push(...relayList.write, ...relayList.both);
    }

    // Fallback to default relays if user has no relays
    if (candidateRelays.length === 0) {
      candidateRelays = DEFAULT_RELAYS;
    }

    // Remove duplicates
    candidateRelays = [...new Set(candidateRelays)];

    // Test health and select best performing relays
    const healthResults = await monitorRelayHealth(candidateRelays);

    const healthyRelays = healthResults
      .filter((result) => result.connected)
      .sort((a, b) => a.latency - b.latency)
      .slice(0, maxRelays)
      .map((result) => result.url);

    return healthyRelays.length > 0
      ? healthyRelays
      : DEFAULT_RELAYS.slice(0, maxRelays);
  } catch (error) {
    console.error("Error getting optimal relays:", error);
    return DEFAULT_RELAYS.slice(0, maxRelays);
  }
}

/**
 * Discover relays from user's network
 */
export async function discoverRelaysFromNetwork(
  pubkey,
  maxDepth = 2,
  maxRelays = 20,
) {
  try {
    const discoveredRelays = new Set(DEFAULT_RELAYS);
    const visitedUsers = new Set([pubkey]);
    let currentDepth = 0;
    let usersToProcess = [pubkey];

    while (currentDepth < maxDepth && usersToProcess.length > 0) {
      const nextBatchUsers = [];

      for (const userPubkey of usersToProcess) {
        if (visitedUsers.has(userPubkey)) continue;

        const followList = await getFollowList(userPubkey);
        const relayList = await getRelayList(userPubkey);

        // Add all relays from this user
        [...relayList.read, ...relayList.write, ...relayList.both].forEach(
          (relay) => {
            discoveredRelays.add(relay);
          },
        );

        // Add followed users for next batch (limit to avoid explosion)
        const followedUsers = followList.slice(0, 10);
        nextBatchUsers.push(
          ...followedUsers.filter((u) => !visitedUsers.has(u)),
        );

        visitedUsers.add(userPubkey);
      }

      usersToProcess = nextBatchUsers;
      currentDepth++;

      // Stop if we have enough relays
      if (discoveredRelays.size >= maxRelays) {
        break;
      }
    }

    return Array.from(discoveredRelays).slice(0, maxRelays);
  } catch (error) {
    console.error("Error discovering relays from network:", error);
    return DEFAULT_RELAYS;
  }
}

/**
 * Score relays based on performance metrics
 */
export function scoreRelays(healthResults) {
  return healthResults
    .map((result) => {
      let score = 0;

      // Connection score (max 40 points)
      if (result.connected) {
        score += 40;

        // Latency bonus (max 30 points)
        if (result.latency < 500) score += 30;
        else if (result.latency < 1000) score += 20;
        else if (result.latency < 2000) score += 10;
        else score += 5;

        // Supported kinds bonus (max 20 points)
        score += Math.min(result.supportedKinds.length * 2, 20);

        // Has relay info bonus (max 10 points)
        if (result.information) score += 10;
      }

      return {
        ...result,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Get relay statistics for analytics dashboard
 */
export async function getRelayStatistics(relayUrls = DEFAULT_RELAYS) {
  try {
    const healthResults = await monitorRelayHealth(relayUrls);
    const scoredRelays = scoreRelays(healthResults);

    const stats = {
      total: scoredRelays.length,
      connected: scoredRelays.filter((r) => r.connected).length,
      averageLatency:
        scoredRelays
          .filter((r) => r.connected && r.latency)
          .reduce((sum, r) => sum + r.latency, 0) /
          scoredRelays.filter((r) => r.connected).length || 0,
      supportedKinds: [
        ...new Set(scoredRelays.flatMap((r) => r.supportedKinds)),
      ],
      topRelays: scoredRelays.slice(0, 10),
      failed: scoredRelays.filter((r) => !r.connected),
    };

    return stats;
  } catch (error) {
    console.error("Error getting relay statistics:", error);
    return {
      total: 0,
      connected: 0,
      averageLatency: 0,
      supportedKinds: [],
      topRelays: [],
      failed: [],
    };
  }
}

/**
 * Get zap analytics dashboard data
 */
export async function getZapAnalytics(pubkey, timeFrame = "7d") {
  try {
    const since = getTimeframeSince(timeFrame);
    const pool = getPool();

    // Query for zap receipts sent to this user
    const receivedZapsFilter = {
      kinds: [9735],
      "#P": [pubkey],
      since,
      limit: 1000,
    };

    // Query for zap receipts sent by this user
    const sentZapsFilter = {
      kinds: [9735],
      authors: [pubkey],
      since,
      limit: 1000,
    };

    // Query for zap goals created by this user
    const zapGoalsFilter = {
      kinds: [9041],
      authors: [pubkey],
      since,
      limit: 100,
    };

    const [receivedZaps, sentZaps, zapGoals] = await Promise.all([
      pool.list(DEFAULT_RELAYS, [receivedZapsFilter]),
      pool.list(DEFAULT_RELAYS, [sentZapsFilter]),
      pool.list(DEFAULT_RELAYS, [zapGoalsFilter]),
    ]);

    // Process received zaps
    const receivedAnalytics = processZapEvents(receivedZaps, "received");

    // Process sent zaps
    const sentAnalytics = processZapEvents(sentZaps, "sent");

    // Process zap goals progress
    const goalsAnalytics = await Promise.all(
      zapGoals.map(async (goal) => {
        const goalZaps = receivedZaps.filter((zap) => {
          const zapData = verifyZapReceipt(zap);
          return zapData.isValid && zapData.eventId === goal.id;
        });

        return calculateZapGoalProgress(goal, goalZaps);
      }),
    );

    return {
      timeFrame,
      received: receivedAnalytics,
      sent: sentAnalytics,
      goals: goalsAnalytics,
      summary: {
        totalReceived: receivedAnalytics.totalAmount,
        totalSent: sentAnalytics.totalAmount,
        netAmount: receivedAnalytics.totalAmount - sentAnalytics.totalAmount,
        totalZappers: receivedAnalytics.uniqueSenders,
        totalGoals: goalsAnalytics.length,
        completedGoals: goalsAnalytics.filter((g) => g.isCompleted).length,
      },
    };
  } catch (error) {
    console.error("Error getting zap analytics:", error);
    return {
      timeFrame,
      received: {
        totalAmount: 0,
        zapCount: 0,
        uniqueSenders: 0,
        dailyTotals: [],
      },
      sent: {
        totalAmount: 0,
        zapCount: 0,
        uniqueRecipients: 0,
        dailyTotals: [],
      },
      goals: [],
      summary: {
        totalReceived: 0,
        totalSent: 0,
        netAmount: 0,
        totalZappers: 0,
        totalGoals: 0,
        completedGoals: 0,
      },
    };
  }
}

// Add NIP-50 Server-side Search functionality
export async function searchEventsWithNIP50(
  pool,
  relayUrls,
  searchQuery,
  options = {},
) {
  const {
    kinds = [1, 30023], // Text notes and forum threads
    authors = [],
    tags = [],
    since = null,
    until = null,
    limit = 100,
    offset = 0,
    sortBy = "relevance", // relevance or created_at
  } = options;

  // Use relays that support NIP-50 search
  const searchCapableRelays = (relayUrls || DEFAULT_RELAYS).filter((relay) =>
    // These relays are known to support NIP-50 search
    SEARCH_CAPABLE_RELAYS.includes(relay),
  );

  if (searchCapableRelays.length === 0) {
    throw new Error("No relays with NIP-50 search capability available");
  }

  try {
    // NIP-50 search filter format
    const searchFilters = {
      kinds,
      search: searchQuery, // This is the NIP-50 search parameter
      limit,
      ...(since && { since }),
      ...(until && { until }),
      ...(authors.length > 0 && { authors }),
      ...(tags.length > 0 && { "#t": tags }),
    };

    // Add offset for pagination if supported
    if (offset > 0) {
      searchFilters.until = offset; // Some relays use 'until' for pagination
    }

    const results = await pool.querySync(searchCapableRelays, searchFilters);

    // If sortBy is relevance, the relay should handle it
    // Otherwise sort locally
    if (sortBy === "created_at" && !results.some((r) => r.score)) {
      results.sort((a, b) => b.created_at - a.created_at);
    }

    return {
      results,
      relayCount: searchCapableRelays.length,
      query: searchQuery,
      filters: searchFilters,
    };
  } catch (error) {
    console.error("NIP-50 search failed:", error);
    throw new Error(`Server-side search failed: ${error.message}`);
  }
}

// Relays known to support NIP-50 search
export const SEARCH_CAPABLE_RELAYS = [
  "wss://relay.nostr.band",
  "wss://search.nos.social",
  "wss://nostr.wine",
  "wss://relay.snort.social",
  "wss://relay.damus.io",
  "wss://relay.mostr.pub",
  "wss://relay.njump.me",
];

// Enhanced search with multiple strategies
export async function enhancedSearch(
  pool,
  relayUrls,
  searchQuery,
  options = {},
) {
  const {
    useServerSide = true,
    useClientSide = true,
    fallbackStrategy = "client-side", // 'client-side' or 'server-side'
  } = options;

  // Try server-side search first if enabled
  if (useServerSide) {
    try {
      const serverResults = await searchEventsWithNIP50(
        pool,
        relayUrls,
        searchQuery,
        {
          ...options,
          limit: Math.min(options.limit || 100, 50), // Limit server-side requests
        },
      );

      if (serverResults.results.length > 0) {
        return {
          ...serverResults,
          searchMethod: "server-side",
          strategy: "nip50-first",
        };
      }
    } catch (serverError) {
      console.warn(
        "Server-side search failed, falling back to client-side:",
        serverError,
      );
    }
  }

  // Fallback to client-side search if enabled and server-side failed
  if (useClientSide) {
    try {
      const { searchManager } = await import("./search/searchManager.js");
      const clientResults = await searchManager.advancedSearch({
        query: searchQuery,
        ...options,
      });

      return {
        results: clientResults.results,
        pagination: clientResults.pagination,
        searchMethod: "client-side",
        strategy: fallbackStrategy,
      };
    } catch (clientError) {
      console.error("Client-side search failed:", clientError);
      throw clientError;
    }
  }

  throw new Error("Both search methods failed");
}

// Search recommendations based on content analysis
export async function getContentRecommendations(pool, eventId, options = {}) {
  const { limit = 10, similarityThreshold = 0.3 } = options;

  try {
    // Get the original event
    const originalEvent = await pool.get(
      (options.relayUrls || DEFAULT_RELAYS).filter((r) =>
        SEARCH_CAPABLE_RELAYS.includes(r),
      ),
      { ids: [eventId] },
    );

    if (!originalEvent) {
      return [];
    }

    // Extract keywords from content
    const keywords = extractKeywords(originalEvent.content);
    if (keywords.length === 0) {
      return [];
    }

    // Search for related content using keywords
    const relatedResults = await searchEventsWithNIP50(
      pool,
      options.relayUrls,
      keywords.join(" "),
      {
        kinds: [1, 30023],
        limit: limit * 2, // Get more to filter for similarity
        excludeIds: [eventId], // Don't include the original
      },
    );

    // Calculate content similarity and return top recommendations
    const recommendations = relatedResults.results
      .map((result) => ({
        ...result,
        similarity: calculateContentSimilarity(
          originalEvent.content,
          result.content,
        ),
      }))
      .filter((result) => result.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return recommendations;
  } catch (error) {
    console.error("Failed to get content recommendations:", error);
    return [];
  }
}

// Extract keywords from text content
function extractKeywords(text) {
  // Remove common stop words and extract meaningful terms
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Keep only letters and spaces
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 10); // Top 10 keywords
}

// Simple content similarity calculation (can be enhanced with better algorithms)
function calculateContentSimilarity(text1, text2) {
  const words1 = new Set(extractKeywords(text1));
  const words2 = new Set(extractKeywords(text2));

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size; // Jaccard similarity
}

// Advanced NIP-50 search with full NIP-50 features
export async function advancedNIP50Search(pool, relayUrls, options = {}) {
  const {
    query,
    filters = {},
    ranking = "relevance", // 'relevance', 'recency', 'popularity'
    timeRange = null,
    geohash = null,
    includeProfiles = false,
  } = options;

  const searchCapableRelays = (relayUrls || DEFAULT_RELAYS).filter((relay) =>
    SEARCH_CAPABLE_RELAYS.includes(relay),
  );

  if (searchCapableRelays.length === 0) {
    throw new Error("No NIP-50 capable relays available");
  }

  try {
    // Build NIP-50 search request with extended features
    const searchRequest = {
      search: query,
      limit: filters.limit || 100,
      kinds: filters.kinds || [1, 30023],
      ...(filters.authors && { authors: filters.authors }),
      ...(filters.tags && { "#t": filters.tags }),
      ...(timeRange && {
        since: timeRange.start
          ? Math.floor(new Date(timeRange.start).getTime() / 1000)
          : undefined,
        until: timeRange.end
          ? Math.floor(new Date(timeRange.end).getTime() / 1000)
          : undefined,
      }),
      ...(geohash && { geohash }),
      ...(ranking && { ranking }),
      // Request profiles for authors if enabled
      ...(includeProfiles && { include_authors: true }),
    };

    const results = await pool.querySync(searchCapableRelays, searchRequest);

    // Apply additional processing based on ranking strategy
    return {
      results,
      searchMethod: "nip50-advanced",
      ranking,
      query,
      appliedFilters: filters,
    };
  } catch (error) {
    console.error("Advanced NIP-50 search failed:", error);
    throw error;
  }
}

/**
 * Initialize search index for local content (fallback when NIP-50 relays are unavailable)
 */
export function initializeLocalSearchIndex(events = []) {
  const documents = events.map((event) => ({
    id: event.id,
    content: event.content,
    title: event.tags?.find((tag) => tag[0] === "title")?.[1] || "",
    author: event.pubkey,
    created_at: event.created_at,
    tags:
      event.tags?.filter((tag) => tag[0] === "t")?.map((tag) => tag[1]) || [],
    kind: event.kind,
  }));

  // Initialize Fuse.js for local search
  if (typeof Fuse !== "undefined") {
    return new Fuse(documents, {
      keys: [
        { name: "content", weight: 0.4 },
        { name: "title", weight: 0.3 },
        { name: "tags", weight: 0.2 },
        { name: "author", weight: 0.1 },
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    });
  }

  return null;
}

// NIP-89 App Handlers implementation
export async function getAppHandlers(
  pool,
  relayUrls,
  appKinds = ["app", "bot", "service"],
) {
  const searchCapableRelays = (relayUrls || DEFAULT_RELAYS).filter((relay) =>
    SEARCH_CAPABLE_RELAYS.includes(relay),
  );

  if (searchCapableRelays.length === 0) {
    throw new Error(
      "No relays with NIP-50 search capability available for app discovery",
    );
  }

  try {
    // Search for NIP-89 app handler events
    const appFilters = {
      kinds: [31989], // NIP-89 app handler kind
      limit: 100,
    };

    const appEvents = await pool.querySync(searchCapableRelays, appFilters);

    // Group events by app type and extract metadata
    const apps = new Map();

    appEvents.forEach((event) => {
      try {
        const appData = JSON.parse(event.content);
        const appType = appData.type || "unknown";

        if (!apps.has(appType)) {
          apps.set(appType, []);
        }

        apps.get(appType).push({
          id: event.id,
          pubkey: event.pubkey,
          name: appData.name || appData.title || "Unknown App",
          description: appData.description || "",
          url: appData.url || "",
          icon: appData.icon || "",
          supports: appData.supports || [],
          tags: event.tags,
          created_at: event.created_at,
          kind: appData.kind || "app",
        });
      } catch (parseError) {
        console.warn("Failed to parse app handler event:", parseError);
        // Skip malformed events
      }
    });

    // Convert to array and sort by recency
    const appList = Array.from(apps.entries())
      .map(([type, items]) => ({
        type,
        apps: items.sort((a, b) => b.created_at - a.created_at),
      }))
      .sort((a, b) => b.apps.length - a.apps.length) // Sort by app count
      .slice(0, 50);

    return {
      apps: appList,
      relayCount: searchCapableRelays.length,
      filters: appFilters,
    };
  } catch (error) {
    console.error("Failed to get app handlers:", error);
    throw new Error(`App discovery failed: ${error.message}`);
  }
}

// Create and publish NIP-89 app handler
export async function createAppHandler(
  pool,
  relayUrls,
  appData,
  privateKeyBytes,
) {
  if (!pool || !relayUrls || !appData) {
    throw new Error("Pool, relays, and app data are required");
  }

  try {
    const appEvent = {
      kind: 31989, // NIP-89 app handler kind
      content: JSON.stringify({
        type: appData.type || "app",
        name: appData.name || appData.title || "Unknown App",
        description: appData.description || "",
        url: appData.url || "",
        icon: appData.icon || "",
        supports: appData.supports || [],
        ...(appData.metadata || {}),
      }),
      tags: [
        ["d", appData.identifier || generateRandomId()], // Identifier
        ["k", appData.type || "app"],
        ...(appData.url ? [["web", appData.url]] : []),
        ...(appData.tags || []),
      ],
      created_at: Math.floor(Date.now() / 1000),
    };

    // Sign and publish using existing publishToPool function
    const signedEvent = await publishToPool(
      pool,
      relayUrls,
      privateKeyBytes,
      appEvent.content,
      { kind: appEvent.kind, tags: appEvent.tags },
    );

    return signedEvent;
  } catch (error) {
    console.error("Failed to create app handler:", error);
    throw new Error(`App handler creation failed: ${error.message}`);
  }
}

// Helper function to generate random ID for app handlers
function generateRandomId() {
  return Math.random().toString(36).substring(2, 15);
}

// Enhanced User Discovery functions
export async function getUserRecommendations(
  pool,
  relayUrls,
  userPubkey,
  options = {},
) {
  const {
    limit = 20,
    timeRange = "30d", // Default to last 30 days
  } = options;

  try {
    // Get user's follows to understand their network
    const followList = await getFollowList(pool, userPubkey);
    const followPubkeys = followList.map((f) => f[1]); // Extract followed pubkeys

    // Get recent events from followed users
    const timeSince = getTimeframeSince(timeRange);
    const userFilters = {
      kinds: [1, 30023, 0], // Posts, threads, metadata
      authors: followPubkeys,
      since: timeSince,
      limit: 200, // More to analyze
    };

    const events = await queryEvents(pool, relayUrls, userFilters);

    // Analyze interaction patterns and interests
    const userInteractions = new Map();

    events.forEach((event) => {
      const author = event.pubkey;
      const currentCount = userInteractions.get(author) || 0;
      userInteractions.set(author, currentCount + 1);

      // Extract topics from tags
      if (event.tags) {
        event.tags.forEach((tag) => {
          if (tag[0] === "t") {
            const topic = tag[1];
            userInteractions.set(
              `${author}_topics`,
              (userInteractions.get(`${author}_topics`) || new Set()).add(
                topic,
              ),
            );
          }
        });
      }
    });

    // Score users based on interaction frequency and shared topics
    const recommendations = Array.from(userInteractions.entries())
      .filter(([key]) => !key.endsWith("_topics")) // Filter out topic entries
      .map(([pubkey, count]) => {
        const topics = userInteractions.get(`${pubkey}_topics`) || new Set();
        return {
          pubkey,
          interactionScore: count,
          topicCount: topics.size,
          sharedTopics: Array.from(topics),
        };
      })
      .sort((a, b) => {
        // Sort by interaction score first, then by topic count
        if (b.interactionScore !== a.interactionScore) {
          return b.interactionScore - a.interactionScore;
        }
        return b.topicCount - a.topicCount;
      })
      .slice(0, limit);

    return {
      recommendations,
      timeRange,
      queryUser: userPubkey,
      strategy: "network-analysis",
    };
  } catch (error) {
    console.error("Failed to get user recommendations:", error);
    return {
      recommendations: [],
      timeRange,
      queryUser: userPubkey,
      strategy: "network-analysis",
      error: error.message,
    };
  }
}

// Trending topics discovery
export async function getTrendingTopics(pool, relayUrls, options = {}) {
  const {
    limit = 10,
    timeRange = "7d", // Default to last 7 days
    minMentions = 3, // Minimum mentions to be considered trending
  } = options;

  try {
    const timeSince = getTimeframeSince(timeRange);

    // Search for posts with topic tags
    const topicFilters = {
      kinds: [1, 30023],
      since: timeSince,
      limit: 500, // Large sample for analysis
    };

    const events = await queryEvents(pool, relayUrls, topicFilters);

    // Count topic mentions
    const topicCounts = new Map();

    events.forEach((event) => {
      if (event.tags) {
        event.tags.forEach((tag) => {
          if (tag[0] === "t") {
            const topic = tag[1].toLowerCase();
            const current = topicCounts.get(topic) || 0;
            topicCounts.set(topic, current + 1);
          }
        });
      }
    });

    // Sort topics by frequency and filter by minimum mentions
    const trending = Array.from(topicCounts.entries())
      .filter(([_, count]) => count >= minMentions)
      .sort((a, b) => b[1] - a[1]) // Sort by count
      .slice(0, limit)
      .map(([topic, count]) => ({
        topic,
        count,
        trend: "rising", // Could be calculated based on velocity
      }));

    return {
      trending,
      timeRange,
      minMentions,
      strategy: "frequency-analysis",
    };
  } catch (error) {
    console.error("Failed to get trending topics:", error);
    return {
      trending: [],
      timeRange,
      minMentions,
      strategy: "frequency-analysis",
      error: error.message,
    };
  }
}

// User reputation and expertise scoring
export async function calculateUserReputation(
  pool,
  relayUrls,
  userPubkey,
  options = {},
) {
  const {
    timeRange = "90d", // Default to last 90 days
  } = options;

  try {
    const timeSince = getTimeframeSince(timeRange);

    // Get user's content and interactions
    const userEvents = await queryEvents(pool, relayUrls, {
      kinds: [1, 30023, 6, 7, 9734, 9735], // Posts, reactions, zaps
      authors: [userPubkey],
      since: timeSince,
      limit: 500,
    });

    // Calculate reputation metrics
    let reputation = {
      contentScore: 0,
      interactionScore: 0,
      zapReceived: 0,
      zapSent: 0,
      reactionsReceived: 0,
      threadsCreated: 0,
      postsCreated: 0,
      expertise: new Map(),
      activityLevel: "low",
    };

    userEvents.forEach((event) => {
      switch (event.kind) {
        case 1: // Regular post
          reputation.postsCreated++;
          reputation.contentScore += 1;
          break;
        case 30023: // Long-form thread
          reputation.threadsCreated++;
          reputation.contentScore += 2; // Higher weight for threads
          break;
        case 6: // Reaction
          reputation.reactionsReceived++;
          reputation.interactionScore += 0.5;
          break;
        case 7: // Repost
          reputation.interactionScore += 1;
          break;
        case 9734: // Zap request
          reputation.zapSent++;
          break;
        case 9735: // Zap receipt
          const amount =
            extractAmountFromBolt11(
              event.tags?.find((t) => t[0] === "bolt11")?.[1],
            ) || "";
          reputation.zapReceived += parseInt(amount) || 0;
          reputation.interactionScore += (parseInt(amount) || 0) / 1000; // Weight zaps
          break;
      }

      // Extract topics from tags for expertise
      if (event.tags) {
        event.tags.forEach((tag) => {
          if (tag[0] === "t") {
            const topic = tag[1];
            const current = reputation.expertise.get(topic) || 0;
            reputation.expertise.set(topic, current + 1);
          }
        });
      }
    });

    // Determine activity level
    const totalScore = reputation.contentScore + reputation.interactionScore;
    if (totalScore > 50) {
      reputation.activityLevel = "high";
    } else if (totalScore > 20) {
      reputation.activityLevel = "medium";
    }

    // Sort expertise by topic frequency
    reputation.topExpertise = Array.from(reputation.expertise.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    return {
      pubkey: userPubkey,
      reputation,
      timeRange,
      strategy: "activity-analysis",
    };
  } catch (error) {
    console.error("Failed to calculate user reputation:", error);
    return {
      pubkey: userPubkey,
      reputation: {
        contentScore: 0,
        interactionScore: 0,
        zapReceived: 0,
        zapSent: 0,
        reactionsReceived: 0,
        threadsCreated: 0,
        postsCreated: 0,
        expertise: new Map(),
        activityLevel: "low",
      },
      timeRange,
      strategy: "activity-analysis",
      error: error.message,
    };
  }
}

/**
 * Process zap events for analytics
 */
function processZapEvents(zapEvents, type) {
  const dailyTotals = {};
  const uniqueSenders = new Set();
  const uniqueRecipients = new Set();
  let totalAmount = 0;

  zapEvents.forEach((zapEvent) => {
    const zapData = verifyZapReceipt(zapEvent);
    if (!zapData.isValid) return;

    const date = new Date(zapEvent.created_at * 1000)
      .toISOString()
      .split("T")[0];

    if (!dailyTotals[date]) {
      dailyTotals[date] = { amount: 0, count: 0 };
    }

    dailyTotals[date].amount += zapData.amount;
    dailyTotals[date].count += 1;
    totalAmount += zapData.amount;

    if (zapData.sender) {
      uniqueSenders.add(zapData.sender);
    }
    if (zapData.recipient) {
      uniqueRecipients.add(zapData.recipient);
    }
  });

  return {
    totalAmount,
    zapCount: zapEvents.length,
    uniqueSenders: uniqueSenders.size,
    uniqueRecipients: uniqueRecipients.size,
    dailyTotals: Object.entries(dailyTotals)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
  };
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

export async function getEvents(filters) {
  try {
    const pool = await initializePool();
    const events = await pool.querySync(DEFAULT_RELAYS, filters);
    return events;
  } catch (error) {
    console.error("Error getting events:", error);
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
