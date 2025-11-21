"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  generatePrivateKey,
  getPublicKey,
  initializeBrowserExtension,
  getBrowserExtensionPubkey,
  formatPubkey,
  getUserProfile,
  nip19Decode,
} from "../lib/nostrClient";

const NostrAuthContext = createContext();

export function useNostrAuth() {
  const context = useContext(NostrAuthContext);
  if (!context) {
    throw new Error("useNostrAuth must be used within NostrAuthProvider");
  }
  return context;
}

export function NostrAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authMethod, setAuthMethod] = useState(null); // 'extension' | 'privatekey' | null

  // Convert Uint8Array to hex string for localStorage storage
  const uint8ArrayToHex = (uint8Array) => {
    return Array.from(uint8Array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  // Convert hex string back to Uint8Array
  const hexToUint8Array = (hex) => {
    if (hex instanceof Uint8Array) return hex;
    const result = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      result[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return result;
  };

  // Check for existing auth on mount
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      setIsLoading(true);

      // Check for browser extension first
      const extAvailable = await initializeBrowserExtension();
      if (extAvailable) {
        const pubkey = await getBrowserExtensionPubkey();
        if (pubkey) {
          const profile = await getUserProfile(pubkey);
          setUser({
            pubkey,
            npub: formatPubkey(pubkey, "npub"),
            display_name: profile.display_name || profile.name || "Anonymous",
            name: profile.name || "Anonymous",
            picture: profile.picture || `https://robohash.org/${pubkey}.png`,
            about: profile.about || "",
            nip05: profile.nip05 || null,
            lud16: profile.lud16 || null,
            authMethod: "extension",
          });
          setAuthMethod("extension");
          return;
        }
      }

      // Check for stored private key
      const storedHexKey = localStorage.getItem("nostr_private_key");
      if (storedHexKey) {
        // Convert hex string back to Uint8Array for getPublicKey
        const privateKeyBytes = hexToUint8Array(storedHexKey);
        const pubkey = getPublicKey(privateKeyBytes);
        const profile = await getUserProfile(pubkey);
        setUser({
          pubkey,
          npub: formatPubkey(pubkey, "npub"),
          display_name: profile.display_name || profile.name || "Anonymous",
          name: profile.name || "Anonymous",
          picture: profile.picture || `https://robohash.org/${pubkey}.png`,
          about: profile.about || "",
          nip05: profile.nip05 || null,
          lud16: profile.lud16 || null,
          authMethod: "privatekey",
        });
        setAuthMethod("privatekey");
        return;
      }

      // No existing auth found
      setUser(null);
      setAuthMethod(null);
    } catch (err) {
      console.error("Error checking existing auth:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithExtension = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const pubkey = await getBrowserExtensionPubkey();
      if (!pubkey) {
        throw new Error("Browser extension not available or not connected");
      }

      const profile = await getUserProfile(pubkey);
      const user = {
        pubkey,
        npub: formatPubkey(pubkey, "npub"),
        display_name: profile.display_name || profile.name || "Anonymous",
        name: profile.name || "Anonymous",
        picture: profile.picture || `https://robohash.org/${pubkey}.png`,
        about: profile.about || "",
        nip05: profile.nip05 || null,
        lud16: profile.lud16 || null,
        authMethod: "extension",
      };

      setUser(user);
      setAuthMethod("extension");
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPrivateKey = async (privateKey) => {
    try {
      setIsLoading(true);
      setError(null);

      let privKeyBytes = privateKey;

      // Handle nsec format
      if (privateKey.startsWith("nsec")) {
        try {
          const { type, data } = nip19Decode(privateKey);
          if (type === "nsec") {
            privKeyBytes = data; // nsec decode returns Uint8Array
          } else {
            throw new Error("Invalid nsec format");
          }
        } catch (decodeErr) {
          throw new Error("Failed to decode nsec key");
        }
      } else if (typeof privateKey === "string") {
        // Handle hex string input
        if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
          throw new Error("Private key must be 64-character hex string");
        }
        privKeyBytes = hexToUint8Array(privateKey);
      } else if (!(privateKey instanceof Uint8Array)) {
        throw new Error("Invalid private key format");
      }

      // Validate private key
      try {
        const pubkey = getPublicKey(privKeyBytes);

        // Store as hex string in localStorage
        localStorage.setItem(
          "nostr_private_key",
          uint8ArrayToHex(privKeyBytes),
        );

        const profile = await getUserProfile(pubkey);
        const user = {
          pubkey,
          npub: formatPubkey(pubkey, "npub"),
          display_name: profile.display_name || profile.name || "Anonymous",
          name: profile.name || "Anonymous",
          picture: profile.picture || `https://robohash.org/${pubkey}.png`,
          about: profile.about || "",
          nip05: profile.nip05 || null,
          lud16: profile.lud16 || null,
          authMethod: "privatekey",
        };

        setUser(user);
        setAuthMethod("privatekey");
        return user;
      } catch (keyErr) {
        throw new Error("Invalid private key");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewKey = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const newPrivateKeyBytes = generatePrivateKey(); // This returns Uint8Array
      const pubkey = getPublicKey(newPrivateKeyBytes);

      // Store the key as hex string
      const hexKey = uint8ArrayToHex(newPrivateKeyBytes);
      localStorage.setItem("nostr_private_key", hexKey);

      const user = {
        pubkey,
        npub: formatPubkey(pubkey, "npub"),
        display_name: "New User",
        name: "New User",
        picture: `https://robohash.org/${pubkey}.png`,
        about: "New Nostr user",
        nip05: null,
        lud16: null,
        authMethod: "privatekey",
      };

      setUser(user);
      setAuthMethod("privatekey");
      return { user, privateKey: newPrivateKeyBytes };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    // Clear stored data
    localStorage.removeItem("nostr_private_key");
    setUser(null);
    setAuthMethod(null);
    setError(null);
  }, []);

  const updateProfile = useCallback(
    async (profileData) => {
      if (!user) {
        throw new Error("No authenticated user");
      }

      try {
        // This would publish a kind 0 metadata event
        // For now, just update local state
        const updatedUser = {
          ...user,
          ...profileData,
        };

        setUser(updatedUser);
        return updatedUser;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [user],
  );

  const value = {
    user,
    isLoading,
    error,
    authMethod,
    loginWithExtension,
    loginWithPrivateKey,
    generateNewKey,
    logout,
    updateProfile,
    refreshProfile: checkExistingAuth,
  };

  return (
    <NostrAuthContext.Provider value={value}>
      {children}
    </NostrAuthContext.Provider>
  );
}
