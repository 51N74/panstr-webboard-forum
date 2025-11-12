/**
 * Communities Page
 * Main page for NIP-72 Moderated Communities
 */

'use client';

import { useState, useEffect } from 'react';
import ProfessionalFeaturesNav from '../components/ProfessionalFeaturesNav';
import CommunityDashboard from '../components/communities/CommunityDashboard';
import { useNostrAuth } from '../context/NostrAuthContext';

export default function CommunitiesPage() {
  const { userPubkey, privateKey } = useNostrAuth();
  const [activeFeature, setActiveFeature] = useState('communities');

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfessionalFeaturesNav
        userPubkey={userPubkey}
        activeFeature={activeFeature}
        onFeatureChange={setActiveFeature}
      />

      <CommunityDashboard userPubkey={userPubkey} />
    </div>
  );
}
