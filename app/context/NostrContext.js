"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNostrAuth } from "./NostrAuthContext";
import { hexToUint8Array } from "../lib/nostrClient";
import {
  initializePool,
  queryEvents,
  publishToPool,
  getUserProfile,
  testRelay,
  getAllRelays,
} from "../lib/nostrClient";

const NostrContext = createContext();

export function useNostr() {
  const context = useContext(NostrContext);
  if (!context) {
    throw new Error("useNostr must be used within NostrProvider");
  }
  return context;
}

export function NostrProvider({ children }) {
  const { user } = useNostrAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [relayCount, setRelayCount] = useState(0);

  const initializeRelayPool = useCallback(async () => {
    try {
      const pool = await initializePool();
      setRelayCount(getAllRelays().length);
    } catch (err) {
      console.error("Error initializing relay pool:", err);
      setError("Failed to connect to Nostr relays");
    }
  }, []);

  useEffect(() => {
    initializeRelayPool();
  }, [initializeRelayPool]);

  const getEvents = useCallback(async (filters) => {
    setLoading(true);
    setError(null);

    try {
      const pool = await initializePool();
      const result = await queryEvents(pool, undefined, filters);
      return result;
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getProfile = useCallback(async (pubkey) => {
    try {
      const profile = await getUserProfile(pubkey);
      return profile;
    } catch (err) {
      console.error("Error fetching profile:", err);
      return null;
    }
  }, []);

  const publishEvent = useCallback(
    async (eventData) => {
      if (!user) {
        throw new Error("User must be authenticated to publish events");
      }

      setLoading(true);
      setError(null);

      try {
        const pool = await initializePool();
        let privateKeyHex = localStorage.getItem("nostr_private_key");
        let privateKeyBytes = null;

        if (privateKeyHex) {
          privateKeyBytes = hexToUint8Array(privateKeyHex);
        }

        const event = await publishToPool(
          pool,
          undefined,
          privateKeyBytes,
          eventData.content,
          {
            kind: eventData.kind || 1,
            tags: eventData.tags || [],
            created_at: eventData.created_at || Math.floor(Date.now() / 1000),
          },
        );

        return event;
      } catch (err) {
        console.error("Error publishing event:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  const checkRelays = useCallback(async () => {
    const relays = getAllRelays();
    let connected = 0;
    const status = {};

    await Promise.all(
      relays.map(async (relay) => {
        try {
          const result = await testRelay(relay);
          status[relay] = result.connected || false;
          if (result.connected) connected++;
        } catch (err) {
          status[relay] = false;
        }
      }),
    );

    setRelayCount(connected);
    return { connected, status };
  }, []);

  const searchEvents = useCallback(
    async (query, options = {}) => {
      const filters = {
        kinds: [1, 30023],
        search: query,
        limit: options.limit || 50,
        ...options,
      };

      return getEvents(filters);
    },
    [getEvents],
  );

  const getTrendingEvents = useCallback(
    async (options = {}) => {
      const filters = {
        kinds: [1, 30023],
        limit: options.limit || 20,
        since: Math.floor(Date.now() / 1000) - 24 * 60 * 60,
        ...options,
      };

      return getEvents(filters);
    },
    [getEvents],
  );

  const replyToEvent = useCallback(
    async (parentEvent, content) => {
      if (!user) {
        throw new Error("User must be authenticated to reply");
      }

      setLoading(true);
      setError(null);

      try {
        const pool = await initializePool();
        let privateKeyHex = localStorage.getItem("nostr_private_key");
        let privateKeyBytes = null;

        if (privateKeyHex) {
          privateKeyBytes = hexToUint8Array(privateKeyHex);
        }

        const replyTags = [
          ["e", parentEvent.id, "", "reply"],
          ["p", parentEvent.pubkey],
        ];

        if (parentEvent.tags) {
          const rootTag = parentEvent.tags.find(
            (tag) => tag[0] === "e" && tag[3] === "root",
          );
          if (rootTag) {
            replyTags.push(["e", rootTag[1], "", "root"]);
          } else {
            replyTags.push(["e", parentEvent.id, "", "root"]);
          }
        }

        const event = await publishToPool(
          pool,
          undefined,
          privateKeyBytes,
          content.trim(),
          {
            kind: 1,
            tags: replyTags,
          },
        );

        return event;
      } catch (err) {
        console.error("Error replying to event:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  const reactToEvent = useCallback(
    async (event, reaction = "+") => {
      if (!user) {
        throw new Error("User must be authenticated to react");
      }

      return publishEvent({
        kind: 7,
        content: reaction,
        tags: [
          ["e", event.id],
          ["p", event.pubkey],
        ],
      });
    },
    [user, publishEvent],
  );

  const value = {
    events,
    loading,
    error,
    user,
    relayCount,
    getEvents,
    getProfile,
    publishEvent,
    checkRelays,
    searchEvents,
    getTrendingEvents,
    replyToEvent,
    reactToEvent,
    setLoading,
    setError,
  };

  return (
    <NostrContext.Provider value={value}>{children}</NostrContext.Provider>
  );
}
