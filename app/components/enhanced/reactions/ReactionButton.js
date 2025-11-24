"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactionPicker from "./ReactionPicker";
import { initializePool, publishToPool, createReactionEvent } from "../../../lib/nostrClient";

const ReactionButton = ({ event, currentPubkey, onReact }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [userReaction, setUserReaction] = useState(null);
    const [reactionCounts, setReactionCounts] = useState({});
    const [totalReactions, setTotalReactions] = useState(0);
    const timeoutRef = useRef(null);

    // This would ideally come from props to avoid individual fetching
    // For now, we'll assume counts are passed or handled by parent, 
    // but we'll implement the local optimistic update.

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            setShowPicker(true);
        }, 500);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setTimeout(() => {
            setShowPicker(false);
        }, 300);
    };

    const handleSelectReaction = async (emoji) => {
        setShowPicker(false);
        setUserReaction(emoji);

        // Optimistic update
        setTotalReactions(prev => prev + 1);

        if (onReact) {
            onReact(event, emoji);
        } else {
            // Default implementation if no handler provided
            try {
                const pool = await initializePool();
                const storedHexKey = localStorage.getItem("nostr_private_key");
                if (!storedHexKey) return;

                // Convert hex to Uint8Array
                const privateKeyBytes = new Uint8Array(32);
                for (let i = 0; i < 32; i++) {
                    privateKeyBytes[i] = parseInt(storedHexKey.substr(i * 2, 2), 16);
                }

                const reactionEvent = createReactionEvent(event, emoji);

                await publishToPool(pool, undefined, privateKeyBytes, reactionEvent.content, {
                    kind: reactionEvent.kind,
                    tags: reactionEvent.tags
                });

            } catch (err) {
                console.error("Error publishing reaction:", err);
                // Revert optimistic update
                setTotalReactions(prev => prev - 1);
                setUserReaction(null);
            }
        }
    };

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {showPicker && (
                <ReactionPicker
                    onSelect={handleSelectReaction}
                    currentReaction={userReaction}
                />
            )}

            <button
                className={`
          flex items-center space-x-1.5 px-2 py-1 rounded-full transition-colors
          ${userReaction ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-blue-600 hover:bg-gray-50"}
        `}
                onClick={() => !userReaction && handleSelectReaction("+")} // Default like
            >
                <span className="text-lg">
                    {userReaction || (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                    )}
                </span>
                <span className="font-medium text-sm">
                    {totalReactions > 0 ? totalReactions : "Like"}
                </span>
            </button>
        </div>
    );
};

export default ReactionButton;
