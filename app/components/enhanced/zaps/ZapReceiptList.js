"use client";

import React, { useState, useEffect } from "react";
import { useNostr } from "../../../context/NostrContext";
import { formatTimeAgo } from "../../../lib/nostrClient";

export default function ZapReceiptList({ eventId, zaps = [] }) {
  const { getProfile } = useNostr();
  const [enrichedZaps, setEnrichedZaps] = useState([]);

  useEffect(() => {
    const loadProfiles = async () => {
      const enriched = await Promise.all(zaps.map(async (zap) => {
        const profile = await getProfile(zap.senderPubkey || zap.sender);
        return { ...zap, profile };
      }));
      setEnrichedZaps(enriched);
    };

    if (zaps.length > 0) {
      loadProfiles();
    }
  }, [zaps, getProfile]);

  if (zaps.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        Latest Zaps
      </h4>
      <div className="flex flex-wrap gap-2">
        {enrichedZaps.map((zap, i) => (
          <div 
            key={i} 
            className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-full pl-1 pr-3 py-1 text-xs shadow-sm hover:shadow-md transition-shadow cursor-default group"
            title={zap.message || "No message"}
          >
            <img 
              className="w-6 h-6 rounded-full ring-1 ring-orange-200" 
              src={zap.profile?.picture || `https://robohash.org/${zap.senderPubkey}.png`} 
              alt="" 
            />
            <span className="font-bold text-orange-700">{zap.amount} sats</span>
            <span className="text-orange-400">by</span>
            <span className="font-medium text-gray-700">{zap.profile?.display_name || "Anon"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
