/**
 * Services Marketplace Page
 * Main page for NIP-90 Data Vending Machines
 */

'use client';

import { useState, useEffect } from 'react';
import ProfessionalFeaturesNav from '../components/ProfessionalFeaturesNav';
import VendingMarketplace from '../components/vending/VendingMarketplace';
import { useNostrAuth } from '../context/NostrAuthContext';

export default function ServicesPage() {
  const { userPubkey, privateKey } = useNostrAuth();
  const [activeFeature, setActiveFeature] = useState('vending');

  const handleServiceRequest = (service) => {
    // Handle service request logic
    console.log('Service requested:', service);
    // This would open a modal or navigate to service details
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfessionalFeaturesNav
        userPubkey={userPubkey}
        activeFeature={activeFeature}
        onFeatureChange={setActiveFeature}
      />

      <VendingMarketplace
        userPubkey={userPubkey}
        onServiceRequest={handleServiceRequest}
      />
    </div>
  );
}
