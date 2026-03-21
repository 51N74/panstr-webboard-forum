/**
 * Communities Page
 * Main page for NIP-72 Moderated Communities
 */

'use client';

import { useState } from 'react';
import ProfessionalFeaturesNav from '../components/ProfessionalFeaturesNav';
import CommunityDashboard from '../components/communities/CommunityDashboard';
import { useNostrAuth } from '../context/NostrAuthContext';

export default function CommunitiesPage() {
  const { user, isLoading } = useNostrAuth();
  const [activeFeature, setActiveFeature] = useState('communities');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfessionalFeaturesNav
        userPubkey={user?.pubkey}
        activeFeature={activeFeature}
        onFeatureChange={setActiveFeature}
      />

      <div className="container mx-auto py-8">
        <CommunityDashboard userPubkey={user?.pubkey} />
      </div>
    </div>
  );
}
