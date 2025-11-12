/**
 * Professional Features Navigation Component
 * Navigation menu for Phase 3 professional features (NIP-90, NIP-72, NIP-54)
 */

'use client';

import { useState } from 'react';

export default function ProfessionalFeaturesNav({ userPubkey, activeFeature, onFeatureChange }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const features = [
    {
      id: 'vending',
      name: 'Service Marketplace',
      description: 'Premium content, API access, and data vending machines',
      icon: '🏪',
      badge: 'NEW',
      badgeColor: 'bg-green-100 text-green-800',
      requiresAuth: false
    },
    {
      id: 'communities',
      name: 'Communities',
      description: 'Reddit-style moderated communities and groups',
      icon: '🏛️',
      badge: null,
      badgeColor: '',
      requiresAuth: true
    },
    {
      id: 'wiki',
      name: 'Wiki System',
      description: 'Collaborative knowledge base with version control',
      icon: '📚',
      badge: null,
      badgeColor: '',
      requiresAuth: true
    }
  ];

  const getFeatureUrl = (featureId) => {
    const baseUrl = window.location.origin;
    switch (featureId) {
      case 'vending':
        return `${baseUrl}/services`;
      case 'communities':
        return `${baseUrl}/communities`;
      case 'wiki':
        return `${baseUrl}/wiki`;
      default:
        return `${baseUrl}/`;
    }
  };

  const handleFeatureClick = (featureId) => {
    if (onFeatureChange) {
      onFeatureChange(featureId);
    } else {
      window.location.href = getFeatureUrl(featureId);
    }
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900">Panstr Pro</span>
              <span className="px-2 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium rounded-full">
                BETA
              </span>
            </div>

            <div className="flex space-x-1">
              {features.map((feature) => {
                const isActive = activeFeature === feature.id;
                const isDisabled = feature.requiresAuth && !userPubkey;

                return (
                  <button
                    key={feature.id}
                    onClick={() => !isDisabled && handleFeatureClick(feature.id)}
                    disabled={isDisabled}
                    className={`
                      relative px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
                      ${isActive
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                        : isDisabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-2 border-transparent'
                      }
                    `}
                    title={isDisabled ? 'Authentication required' : feature.description}
                  >
                    <span className="text-lg">{feature.icon}</span>
                    <span>{feature.name}</span>
                    {feature.badge && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${feature.badgeColor}`}>
                        {feature.badge}
                      </span>
                    )}
                    {isDisabled && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* User Status */}
          <div className="hidden md:flex items-center space-x-4">
            {userPubkey ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {userPubkey.substring(0, 8)}...
                </span>
              </div>
            ) : (
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-2">
              {features.map((feature) => {
                const isActive = activeFeature === feature.id;
                const isDisabled = feature.requiresAuth && !userPubkey;

                return (
                  <button
                    key={feature.id}
                    onClick={() => !isDisabled && handleFeatureClick(feature.id)}
                    disabled={isDisabled}
                    className={`
                      w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-between
                      ${isActive
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                        : isDisabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-2 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{feature.icon}</span>
                      <div>
                        <div className="font-medium">{feature.name}</div>
                        <div className="text-sm opacity-75">{feature.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {feature.badge && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${feature.badgeColor}`}>
                          {feature.badge}
                        </span>
                      )}
                      {isDisabled && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Mobile User Status */}
              <div className="pt-4 border-t mt-4">
                {userPubkey ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">
                        {userPubkey.substring(0, 8)}...
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">Authenticated</span>
                  </div>
                ) : (
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Sign In to Access Features
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Feature Breadcrumb */}
      {activeFeature && (
        <div className="bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-2 text-sm">
              <a href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </a>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-medium">
                {features.find(f => f.id === activeFeature)?.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Feature Info Bar */}
      {activeFeature && (
        <div className="bg-blue-50 border-t border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">
                  {features.find(f => f.id === activeFeature)?.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {features.find(f => f.id === activeFeature)?.description}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Professional features powered by Nostr NIPs
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <a
                  href="https://github.com/nostr-protocol/nips"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-700 hover:text-blue-900 font-medium flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Learn about NIPs</span>
                </a>
                <button className="text-sm text-blue-700 hover:text-blue-900 font-medium">
                  Documentation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
