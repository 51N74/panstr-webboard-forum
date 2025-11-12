/**
 * Data Vending Machine Marketplace Component
 * Displays available services, subscription tiers, and premium content
 */

'use client';

import { useState, useEffect } from 'react';
import { getAvailableServices, getUserSubscriptions, checkUserAccessLevel, SUBSCRIPTION_TIERS } from '../../lib/data-vending/nip90.js';

export default function VendingMarketplace({ userPubkey, onServiceRequest }) {
  const [services, setServices] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userAccess, setUserAccess] = useState({ hasAccess: false, tier: 'free' });
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  const categories = [
    { id: 'all', name: 'All Services', icon: '🌟' },
    { id: 'premium_content', name: 'Premium Content', icon: '💎' },
    { id: 'api_access', name: 'API Access', icon: '🔌' },
    { id: 'subscription', name: 'Subscriptions', icon: '📋' },
    { id: 'data_export', name: 'Data Export', icon: '📊' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'custom', name: 'Custom Services', icon: '⚙️' }
  ];

  useEffect(() => {
    loadMarketplaceData();
  }, [userPubkey]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      const [availableServices, userSubscriptions] = await Promise.all([
        getAvailableServices(),
        userPubkey ? getUserSubscriptions(userPubkey) : []
      ]);

      setServices(availableServices);
      setSubscriptions(userSubscriptions);

      if (userPubkey) {
        const access = checkUserAccessLevel(userSubscriptions);
        setUserAccess(access);
      }
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    if (selectedCategory === 'all') return true;
    return service.config.service_type === selectedCategory;
  });

  const handleServiceRequest = (service) => {
    setSelectedService(service);
    if (onServiceRequest) {
      onServiceRequest(service);
    }
  };

  const handleSubscriptionUpgrade = (tier) => {
    // Navigate to subscription upgrade flow
    console.log('Upgrade to tier:', tier);
    // This would integrate with payment processing
  };

  const getTierBadgeColor = (tier) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-yellow-100 text-yellow-800'
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  const getServicePrice = (service) => {
    return service.config.pricing ? `${service.config.pricing} sats` : 'Free';
  };

  const canAccessService = (service) => {
    const requiredFeatures = service.config.requirements || [];
    const access = checkUserAccessLevel(subscriptions, requiredFeatures);
    return access.hasAccess;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Service Marketplace</h1>
              <p className="text-gray-600 mt-1">Discover premium content and professional services</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-full ${getTierBadgeColor(userAccess.tier)}`}>
                <span className="font-medium">{userAccess.tier?.toUpperCase()} PLAN</span>
              </div>
              {userPubkey && (
                <button
                  onClick={() => handleSubscriptionUpgrade('premium')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subscription Tiers */}
        {!userPubkey && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6 text-white">
            <h2 className="text-2xl font-bold mb-4">Choose Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
                <div key={key} className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <h3 className="font-bold text-lg">{tier.name}</h3>
                  <p className="text-2xl font-bold mt-2">{tier.price === 0 ? 'Free' : `${tier.price} sats/mo`}</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {tier.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="mr-2">✓</span>
                        {feature.replace(/_/g, ' ')}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscriptionUpgrade(key.toLowerCase())}
                    className="w-full bg-white text-blue-600 py-2 rounded-lg mt-3 font-medium hover:bg-gray-100 transition-colors"
                  >
                    {tier.price === 0 ? 'Get Started' : 'Subscribe'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const hasAccess = canAccessService(service);

            return (
              <div key={service.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{service.config.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{service.config.service_type.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {getServicePrice(service)}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-3">{service.config.description}</p>

                  {service.config.endpoints && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">Available Endpoints:</p>
                      <div className="flex flex-wrap gap-1">
                        {service.config.endpoints.slice(0, 3).map((endpoint, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {endpoint}
                          </span>
                        ))}
                        {service.config.endpoints.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{service.config.endpoints.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {service.config.requirements && service.config.requirements.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-900 mb-1">Requirements:</p>
                      <div className="flex flex-wrap gap-1">
                        {service.config.requirements.map((req, idx) => (
                          <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {hasAccess ? (
                      <button
                        onClick={() => handleServiceRequest(service)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Use Service
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscriptionUpgrade('basic')}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                      >
                        Upgrade to Access
                      </button>
                    )}
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Services Found</h3>
            <p className="text-gray-600">Try selecting a different category or check back later for new services.</p>
          </div>
        )}

        {/* Service Details Modal */}
        {selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedService.config.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedService.config.service_type.replace(/_/g, ' ')}</p>
                  </div>
                  <button
                    onClick={() => setSelectedService(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 leading-relaxed">{selectedService.config.description}</p>
                </div>

                {selectedService.config.endpoints && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-3">Available Endpoints</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {selectedService.config.endpoints.map((endpoint, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                          <code className="bg-gray-800 text-white px-2 py-1 rounded text-sm">
                            {endpoint}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedService.config.metadata && Object.keys(selectedService.config.metadata).length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-3">Additional Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {Object.entries(selectedService.config.metadata).map(([key, value]) => (
                        <div key={key} className="mb-2 last:mb-0">
                          <span className="font-medium text-gray-700">{key}:</span>
                          <span className="ml-2 text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  {canAccessService(selectedService) ? (
                    <button
                      onClick={() => {
                        handleServiceRequest(selectedService);
                        setSelectedService(null);
                      }}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Use This Service
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleSubscriptionUpgrade('basic');
                        setSelectedService(null);
                      }}
                      className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      Upgrade to Access
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedService(null)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
