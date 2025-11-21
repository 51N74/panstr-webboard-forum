"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import UserProfile from "../../components/profiles/UserProfile";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function ProfilePage() {
  const params = useParams();
  const { pubkey } = params;
  const [isValidPubkey, setIsValidPubkey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validatePubkey();
  }, [pubkey]);

  const validatePubkey = () => {
    // Basic validation for npub format or hex pubkey
    const npubRegex = /^npub1[acdefghjklmnpqrstuvwxyz023456789]{58}$/;
    const hexRegex = /^[0-9a-f]{64}$/i;

    if (npubRegex.test(pubkey) || hexRegex.test(pubkey)) {
      setIsValidPubkey(true);
    } else {
      setIsValidPubkey(false);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isValidPubkey) {
    return (
      <div className="min-h-screen bg-base-200">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center">
            <div className="text-6xl mb-6 opacity-50">🚫</div>
            <h1 className="text-3xl font-bold text-base-content mb-4">
              Invalid Profile ID
            </h1>
            <p className="text-lg text-base-content/70 mb-8">
              The profile ID you provided is not a valid Nostr public key.
            </p>
            <a href="/" className="btn btn-primary">
              Back to Forums
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Header />
      <UserProfile
        pubkey={pubkey}
        onClose={() => window.history.back()}
        isModal={false}
      />
      <Footer />
    </div>
  );
}
