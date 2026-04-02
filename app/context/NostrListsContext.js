"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNostrAuth } from "./NostrAuthContext";
import { getPool, finalizeEvent, publishToPool, createMuteListEvent, createBookmarkListEvent, getEvents } from "../lib/nostrClient";

const NostrListsContext = createContext();

export function useNostrLists() {
  return useContext(NostrListsContext);
}

export function NostrListsProvider({ children }) {
  const { user } = useNostrAuth();
  const [mutes, setMutes] = useState({ p: [], e: [], t: [], word: [] });
  const [bookmarks, setBookmarks] = useState({ e: [], a: [] });
  const [isLoading, setIsLoading] = useState(false);

  const fetchLists = useCallback(async () => {
    if (!user?.pubkey) return;
    
    setIsLoading(true);
    try {
      const filter = { kinds: [10000, 10003], authors: [user.pubkey] };
      const events = await getEvents(filter);

      const muteEvent = events.find(e => e.kind === 10000);
      const bookmarkEvent = events.find(e => e.kind === 10003);

      if (muteEvent) {
        const p = muteEvent.tags.filter(t => t[0] === 'p').map(t => t[1]);
        const e = muteEvent.tags.filter(t => t[0] === 'e').map(t => t[1]);
        const t = muteEvent.tags.filter(t => t[0] === 't').map(t => t[1]);
        const word = muteEvent.tags.filter(t => t[0] === 'word').map(t => t[1]);
        setMutes({ p, e, t, word });
      }

      if (bookmarkEvent) {
        const e = bookmarkEvent.tags.filter(t => t[0] === 'e').map(t => t[1]);
        const a = bookmarkEvent.tags.filter(t => t[0] === 'a').map(t => t[1]);
        setBookmarks({ e, a });
      }
    } catch (err) {
      console.error("Error fetching NIP-51 lists:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.pubkey]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const updateMuteList = async (type, value, action = 'add') => {
    if (!user?.pubkey) return;

    const newMutes = { ...mutes };
    if (action === 'add') {
      if (!newMutes[type].includes(value)) {
        newMutes[type] = [...newMutes[type], value];
      }
    } else {
      newMutes[type] = newMutes[type].filter(v => v !== value);
    }

    try {
      const pool = getPool();
      const eventTemplate = createMuteListEvent(newMutes.p, newMutes.e, newMutes.t, newMutes.word);
      
      let signedEvent;
      if (user.authMethod === 'extension') {
        signedEvent = await window.nostr.signEvent(eventTemplate);
      } else {
        const storedHexKey = localStorage.getItem("nostr_private_key");
        const privateKeyBytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          privateKeyBytes[i] = parseInt(storedHexKey.substr(i * 2, 2), 16);
        }
        signedEvent = finalizeEvent(eventTemplate, privateKeyBytes);
      }

      await publishToPool(pool, undefined, undefined, "", { kind: 10000, tags: signedEvent.tags });
      setMutes(newMutes);
    } catch (err) {
      console.error("Error updating mute list:", err);
      throw err;
    }
  };

  const updateBookmarkList = async (type, value, action = 'add') => {
    if (!user?.pubkey) return;

    const newBookmarks = { ...bookmarks };
    if (action === 'add') {
      if (!newBookmarks[type].includes(value)) {
        newBookmarks[type] = [...newBookmarks[type], value];
      }
    } else {
      newBookmarks[type] = newBookmarks[type].filter(v => v !== value);
    }

    try {
      const pool = getPool();
      const eventTemplate = createBookmarkListEvent(newBookmarks.e, newBookmarks.a);
      
      let signedEvent;
      if (user.authMethod === 'extension') {
        signedEvent = await window.nostr.signEvent(eventTemplate);
      } else {
        const storedHexKey = localStorage.getItem("nostr_private_key");
        const privateKeyBytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          privateKeyBytes[i] = parseInt(storedHexKey.substr(i * 2, 2), 16);
        }
        signedEvent = finalizeEvent(eventTemplate, privateKeyBytes);
      }

      await publishToPool(pool, undefined, undefined, "", { kind: 10003, tags: signedEvent.tags });
      setBookmarks(newBookmarks);
    } catch (err) {
      console.error("Error updating bookmark list:", err);
      throw err;
    }
  };

  const isMuted = (type, value) => mutes[type]?.includes(value);
  const isBookmarked = (type, value) => bookmarks[type]?.includes(value);

  return (
    <NostrListsContext.Provider value={{ 
      mutes, 
      bookmarks, 
      isLoading, 
      updateMuteList, 
      updateBookmarkList, 
      isMuted, 
      isBookmarked,
      refreshLists: fetchLists 
    }}>
      {children}
    </NostrListsContext.Provider>
  );
}
