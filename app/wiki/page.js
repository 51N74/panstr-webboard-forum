/**
 * Wiki Page
 * Main page for NIP-54 Wiki System
 */

'use client';

import { useState, useEffect } from 'react';
import ProfessionalFeaturesNav from '../components/ProfessionalFeaturesNav';
import WikiInterface from '../components/wiki/WikiInterface';
import { useNostrAuth } from '../context/NostrAuthContext';

export default function WikiPage() {
  const { userPubkey, privateKey } = useNostrAuth();
  const [activeFeature, setActiveFeature] = useState('wiki');

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfessionalFeaturesNav
        userPubkey={userPubkey}
        activeFeature={activeFeature}
        onFeatureChange={setActiveFeature}
      />

      <WikiInterface
        userPubkey={userPubkey}
        privateKey={privateKey}
      />
    </div>
  );
}
