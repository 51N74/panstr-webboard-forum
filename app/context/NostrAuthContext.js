"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  generatePrivateKey,
  getPublicKey,
  initializeBrowserExtension,
  getBrowserExtensionPubkey,
  formatPubkey,
  getUserProfile,
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
            authMethod: "extension"
          });
          setAuthMethod("extension");
          return;
        }
      }

      // Check for stored private key
      const storedPrivKey = localStorage.getItem("nostr_private_key");
      if (storedPrivKey) {
        const pubkey = getPublicKey(storedPrivKey);
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
          authMethod: "privatekey"
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
        authMethod: "extension"
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

      let privKey = privateKey;

      // Handle nsec format
      if (privateKey.startsWith("nsec")) {
        try {
          const { type, data } = require("nostr-tools/nip19").decode(privateKey);
          if (type === "nsec") {
            privKey = data;
          } else {
            throw new Error("Invalid nsec format");
          }
        } catch (decodeErr) {
          throw new Error("Failed to decode nsec key");
        }
      }

      // Validate private key
      try {
        const pubkey = getPublicKey(privKey);

        // Store private key (encrypted in production)
        localStorage.setItem("nostr_private_key", privKey);

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
          authMethod: "privatekey"
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

      const newPrivateKey = generatePrivateKey();
      const pubkey = getPublicKey(newPrivateKey);

      // Store the new key
      localStorage.setItem("nostr_private_key", newPrivateKey);

      const user = {
        pubkey,
        npub: formatPubkey(pubkey, "npub"),
        display_name: "New User",
        name: "New User",
        picture: `https://robohash.org/${pubkey}.png`,
        about: "New Nostr user",
        nip05: null,
        lud16: null,
        authMethod: "privatekey"
      };

      setUser(user);
      setAuthMethod("privatekey");
      return { user, privateKey: newPrivateKey };
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

  const updateProfile = useCallback(async (profileData) => {
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
  }, [user]);

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
