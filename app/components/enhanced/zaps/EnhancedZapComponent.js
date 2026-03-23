"use client";

import React, { useState, useEffect } from "react";
import {
  getUserProfile,
  getLnurlPayInfo,
  fetchZapInvoice,
  createZapRequestEvent,
  formatPubkey,
} from "../../../lib/nostrClient";

const EnhancedZapComponent = ({
  targetEvent,
  recipientPubkey,
  currentPubkey,
  onZap,
}) => {
  const [amount, setAmount] = useState(1000);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [recipientProfile, setRecipientProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (recipientPubkey) {
      loadRecipientProfile();
    }
  }, [recipientPubkey]);

  const loadRecipientProfile = async () => {
    try {
      const profile = await getUserProfile(recipientPubkey);
      setRecipientProfile(profile);
    } catch (err) {
      console.error("Error loading recipient profile:", err);
    }
  };

  const handleZapInit = async () => {
    setLoading(true);
    setError(null);
    setInvoice(null);

    try {
      // 1. Get Lightning Address (lud16 or lud06)
      const lnAddress = recipientProfile?.lud16 || recipientProfile?.lud06;
      if (!lnAddress) {
        throw new Error("Recipient does not have a Lightning Address configured.");
      }

      // 2. Fetch LNURL-pay info
      const lnurlInfo = await getLnurlPayInfo(lnAddress);
      if (!lnurlInfo || !lnurlInfo.allowsNostr || !lnurlInfo.nostrPubkey) {
        throw new Error("Recipient's Lightning provider does not support Zaps.");
      }

      // 3. Create Zap Request
      const zapRequest = await createZapRequestEvent(
        recipientPubkey,
        targetEvent?.id,
        amount,
        ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.snort.social"],
        message
      );

      // 4. Fetch Invoice
      const bolt11 = await fetchZapInvoice(lnurlInfo, amount, zapRequest);
      if (!bolt11) {
        throw new Error("Failed to fetch Lightning invoice.");
      }

      setInvoice(bolt11);

      // 5. Try to pay automatically if WebLN is available
      if (window.webln) {
        try {
          await window.webln.enable();
          const result = await window.webln.sendPayment(bolt11);
          if (result) {
            if (onZap) onZap();
            alert("Zap sent successfully!");
          }
        } catch (weblnErr) {
          console.warn("WebLN payment failed or cancelled:", weblnErr);
          // Don't throw, just let user copy invoice
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat().format(amount) + " sats";
  };

  return (
    <div className="bg-white p-6 max-w-lg mx-auto">
      <div className="flex flex-col items-center mb-6">
        <div className="avatar mb-4">
          <div className="w-20 h-20 rounded-full ring ring-orange-400 ring-offset-base-100 ring-offset-2">
            <img 
              src={recipientProfile?.picture || `https://robohash.org/${recipientPubkey}.png`} 
              alt={recipientProfile?.display_name || "Recipient"} 
            />
          </div>
        </div>
        <h2 className="text-xl font-bold">Zap {recipientProfile?.display_name || recipientProfile?.name || "User"}</h2>
        <p className="text-sm text-gray-500">{recipientProfile?.lud16 || "No Lightning Address"}</p>
      </div>

      {error && (
        <div className="alert alert-error mb-6 text-sm">
          <span>{error}</span>
        </div>
      )}

      {!invoice ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (sats)</label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[21, 1000, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                    amount === preset ? "bg-orange-500 text-white border-orange-600 shadow-md" : "bg-gray-50 hover:bg-orange-50 text-gray-700 border-gray-200"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="Custom amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none h-24"
              placeholder="Nice post! (optional)"
            />
          </div>

          <button
            onClick={handleZapInit}
            disabled={loading || !recipientProfile?.lud16}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
              loading || !recipientProfile?.lud16 ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 active:scale-95"
            }`}
          >
            {loading ? <span className="loading loading-spinner"></span> : `Zap ${formatAmount(amount)}`}
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-orange-200 break-all text-xs font-mono text-gray-600">
            {invoice}
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(invoice);
                alert("Invoice copied!");
              }}
              className="btn btn-outline w-full"
            >
              Copy Invoice
            </button>
            <a 
              href={`lightning:${invoice}`}
              className="btn btn-primary w-full bg-orange-500 border-orange-600 hover:bg-orange-600"
            >
              Open Wallet
            </a>
            <button
              onClick={() => setInvoice(null)}
              className="btn btn-ghost w-full"
            >
              Back
            </button>
          </div>
          
          <p className="text-center text-xs text-gray-400">
            Pay this invoice to complete your zap.
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedZapComponent;
