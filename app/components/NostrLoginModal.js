"use client";

import React, { useState } from "react";
import { useNostrAuth } from "../context/NostrAuthContext";
import { formatPubkey, privateKeyToHex } from "../lib/nostrClient";
import * as nip19 from "nostr-tools/nip19";

export default function NostrLoginModal({ isOpen, onClose }) {
  const { loginWithExtension, loginWithPrivateKey, generateNewKey, isLoading } = useNostrAuth();
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [error, setError] = useState("");

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
      setPrivateKeyInput("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGenerateKey = async () => {
    try {
      setError("");
      const { user, privateKey } = await generateNewKey();

      // Convert to nsec for display
      const nsec = nip19.nsecEncode(privateKey);
      setGeneratedKey({
        nsec,
        npub: user.npub,
        privateKey: privateKey
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const closeModal = () => {
    onClose();
    setError("");
    setPrivateKeyInput("");
    setShowPrivateKey(false);
    setGeneratedKey(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Connect to Nostr</h2>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!generatedKey ? (
          <div className="space-y-4">
            {/* Browser Extension Option */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Browser Extension
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Use your Nostr browser extension (nos2x, Alby, Flamingo, etc.)
              </p>
              <button
                onClick={handleExtensionLogin}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Connecting..." : "Connect Extension"}
              </button>
            </div>

            {/* Private Key Option */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Private Key
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Enter your nsec or hex private key
              </p>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showPrivateKey ? "text" : "password"}
                    value={privateKeyInput}
                    onChange={(e) => setPrivateKeyInput(e.target.value)}
                    placeholder="nsec1... or hex key"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    {showPrivateKey ? "Hide" : "Show"}
                  </button>
                </div>
                <button
                  onClick={handlePrivateKeyLogin}
                  disabled={isLoading || !privateKeyInput.trim()}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? "Connecting..." : "Login with Private Key"}
                </button>
              </div>
            </div>

            {/* Generate New Key Option */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Identity
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Generate a new Nostr identity
              </p>
              <button
                onClick={handleGenerateKey}
                disabled={isLoading}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? "Generating..." : "Generate New Key"}
              </button>
            </div>
          </div>
        ) : (
          /* Generated Key Display */
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">New Identity Created!</h3>
              <p className="text-sm text-green-700 mb-4">
                Save your private key securely. This is your only way to access your account.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key (npub)
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={generatedKey.npub}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-l-lg bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedKey.npub)}
                    className="px-3 py-2 bg-gray-200 border rounded-r-lg hover:bg-gray-300"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">
                  Private Key (nsec) - SAVE THIS SECURELY
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={generatedKey.nsec}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-l-lg bg-red-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedKey.nsec)}
                    className="px-3 py-2 bg-red-200 border rounded-r-lg hover:bg-red-300"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Important:</strong> Store your private key in a secure location.
                  If you lose it, you will lose access to your account permanently.
                </p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
