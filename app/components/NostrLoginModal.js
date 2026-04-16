"use client";

import React, { useState } from "react";
import { useNostrAuth } from "../context/NostrAuthContext";
import { privateKeyToHex, nip19Encode } from "../lib/nostrClient";

/**
 * NostrLoginModal - Panstr Minimal
 * Standardized layering: z-modal for the card, z-overlay for backdrop.
 * Precision-centered authentication interface using fixed positioning and flexbox.
 */

export default function NostrLoginModal({ isOpen, onClose }) {
  const { loginWithExtension, loginWithPrivateKey, generateNewKey, isLoading } = useNostrAuth();
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleExtensionLogin = async () => {
    try {
      setError("");
      await loginWithExtension();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePrivateKeyLogin = async () => {
    try {
      setError("");
      if (!privateKeyInput.trim()) {
        setError("Please enter a private key");
        return;
      }
      await loginWithPrivateKey(privateKeyInput.trim());
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGenerateKey = async () => {
    try {
      setError("");
      const { user, privateKey } = await generateNewKey();
      const nsec = nip19Encode.nsec(privateKey);
      const privateKeyHex = privateKeyToHex(privateKey);
      setGeneratedKey({ nsec, hex: privateKeyHex, npub: user.npub });
    } catch (err) {
      setError(err.message);
    }
  };

  const copy = (txt) => navigator.clipboard.writeText(txt);

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 overflow-hidden">
      {/* 
        Standardized Overlay (z-overlay) 
        Escapes parent clipping and dims background properly.
      */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in z-overlay" 
        onClick={onClose}
      />

      {/* Modal Card - Precision Centering and Constrained width */}
      <div className="relative bg-surface border border-surface-border rounded-xl shadow-2xl w-full max-w-[440px] overflow-hidden animate-slide-up z-modal">
        <header className="px-10 py-6 border-b border-surface-border flex justify-between items-center bg-surface">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Connect Identity</h2>
          <button 
            onClick={onClose} 
            className="text-secondary hover:text-primary transition-colors focus:outline-none p-1 -mr-2"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </header>

        <div className="p-10">
          {error && (
            <div className="mb-8 p-4 bg-error/5 border border-error/20 rounded text-[11px] font-bold text-error animate-fade-in flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {!generatedKey ? (
            <div className="space-y-8">
              {/* Browser Extension Section */}
              <section>
                <button 
                  onClick={handleExtensionLogin}
                  disabled={isLoading}
                  className="w-full btn-primary h-14 flex items-center justify-center gap-4 mb-4 text-[11px] font-black uppercase tracking-[0.1em] transition-all hover:shadow-lg"
                >
                  <span className="material-symbols-outlined text-xl">extension</span>
                  {isLoading ? "Connecting..." : "Use Extension"}
                </button>
                <p className="text-[9px] text-secondary text-center uppercase tracking-widest font-bold opacity-50">
                  Recommended: Alby, nos2x, or Flamingo
                </p>
              </section>

              {/* Visual Divider */}
              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-border"></div>
                </div>
                <span className="relative px-6 bg-surface text-[9px] font-black text-secondary uppercase tracking-[0.3em] opacity-40">or</span>
              </div>

              {/* Private Key Section */}
              <section className="space-y-6">
                <div className="relative flex items-center">
                  <input 
                    type={showPrivateKey ? "text" : "password"}
                    value={privateKeyInput}
                    onChange={(e) => setPrivateKeyInput(e.target.value)}
                    placeholder="Enter nsec or hex key"
                    className="input h-14 pr-14 text-sm font-medium tracking-tight border-surface-border focus:border-accent focus:ring-0 text-primary bg-surface-muted"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="absolute right-0 h-14 w-14 flex items-center justify-center text-secondary hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPrivateKey ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <button 
                  onClick={handlePrivateKeyLogin}
                  disabled={isLoading || !privateKeyInput.trim()}
                  className="w-full btn-outline h-14 text-[11px] font-black uppercase tracking-[0.1em] transition-all"
                >
                  Sign In
                </button>
              </section>

              {/* Footer Action */}
              <section className="pt-6 border-t border-surface-border/50 text-center">
                <button 
                  onClick={handleGenerateKey}
                  disabled={isLoading}
                  className="py-2 text-[10px] font-black text-secondary hover:text-accent uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto group"
                >
                  New to Nostr? Generate a key 
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </section>
            </div>
          ) : (
            /* Backup Keys Section */
            <div className="space-y-8 animate-fade-in">
              <div className="p-5 bg-success/5 border border-success/20 rounded flex items-start gap-4">
                <span className="material-symbols-outlined text-success text-2xl">check_circle</span>
                <div>
                  <p className="text-[11px] text-success font-black uppercase tracking-widest">Identity Created</p>
                  <p className="text-[10px] text-secondary mt-1 leading-relaxed font-medium">Copy and save your keys securely. You won't see them again.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] opacity-60">Public Key (npub)</label>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={generatedKey.npub} className="input h-12 text-[10px] font-mono bg-surface-muted border-transparent" />
                    <button 
                      onClick={() => copy(generatedKey.npub)} 
                      className="w-12 h-12 flex items-center justify-center btn-secondary rounded flex-shrink-0"
                      title="Copy Public Key"
                    >
                      <span className="material-symbols-outlined text-lg">content_copy</span>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-error uppercase tracking-[0.2em] opacity-80">Private Key (nsec) — DO NOT LOSE</label>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={generatedKey.nsec} className="input h-12 text-[10px] font-mono bg-error/5 border-error/20" />
                    <button 
                      onClick={() => copy(generatedKey.nsec)} 
                      className="w-12 h-12 flex items-center justify-center btn-secondary text-error rounded flex-shrink-0 border-error/10"
                      title="Copy Private Key"
                    >
                      <span className="material-symbols-outlined text-lg">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={onClose} 
                className="w-full btn-primary h-14 text-[11px] font-black uppercase tracking-widest mt-4 shadow-xl"
              >
                Start Using Panstr
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
