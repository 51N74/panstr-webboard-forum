/**
 * NIP-90 Data Vending Machines Implementation
 * Handles premium content, subscription tiers, API access, and automated monetization
 */

import { getPool, publishToPool, queryEvents } from '../nostrClient.js';

// NIP-90 Event Kinds
export const NIP90_KINDS = {
  SERVICE_REQUEST: 5900,    // Request data from a vending machine
  SERVICE_RESPONSE: 5901,    // Response from vending machine
  SERVICE_CONFIG: 5902,     // Vending machine configuration
  SUBSCRIPTION: 5903,        // Subscription management
  PAYMENT_REQUIRED: 5904,   // Payment request for service
  ACCESS_TOKEN: 5905,       // Token for paid access
  API_USAGE: 5906,          // API usage tracking
  SERVICE_LIST: 5907         // List of available services
};

// Service Types
export const SERVICE_TYPES = {
  PREMIUM_CONTENT: 'premium_content',
  API_ACCESS: 'api_access',
  SUBSCRIPTION: 'subscription',
  DATA_EXPORT: 'data_export',
  ANALYTICS: 'analytics',
  CUSTOM: 'custom'
};

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['read_public_content', 'basic_search'],
    limits: { api_calls: 100, content_access: 'public_only' }
  },
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 500, // 500 sats/month
    features: ['read_premium_content', 'advanced_search', 'export_basic'],
    limits: { api_calls: 1000, content_access: 'all', downloads: 10 }
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 2000, // 2000 sats/month
    features: ['all_content', 'full_api', 'advanced_analytics', 'priority_support'],
    limits: { api_calls: 10000, content_access: 'all', downloads: 100 }
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 10000, // 10000 sats/month
    features: ['custom_integrations', 'dedicated_support', 'white_label'],
    limits: { api_calls: 100000, content_access: 'all', downloads: 1000 }
  }
};

/**
 * Create a vending machine service configuration
 */
export function createServiceConfig(config) {
  return {
    kind: NIP90_KINDS.SERVICE_CONFIG,
    content: JSON.stringify({
      name: config.name,
      description: config.description,
      service_type: config.serviceType,
      pricing: config.pricing,
      endpoints: config.endpoints,
      requirements: config.requirements || [],
      metadata: config.metadata || {}
    }),
    tags: [
      ['d', config.id],
      ['t', config.serviceType],
      ['price', config.pricing.toString()],
      ...config.requirements?.map(req => ['requirement', req]) || []
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create a service request
 */
export function createServiceRequest(serviceId, requestData, userPubkey) {
  return {
    kind: NIP90_KINDS.SERVICE_REQUEST,
    content: JSON.stringify({
      service_id: serviceId,
      request_data: requestData,
      timestamp: Math.floor(Date.now() / 1000)
    }),
    tags: [
      ['d', serviceId],
      ['p', userPubkey],
      ['request_id', generateRequestId()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create a service response
 */
export function createServiceResponse(requestEvent, responseData, requiresPayment = false) {
  const requestId = requestEvent.tags.find(tag => tag[0] === 'request_id')?.[1];
  const requesterPubkey = requestEvent.tags.find(tag => tag[0] === 'p')?.[1];

  const response = {
    kind: NIP90_KINDS.SERVICE_RESPONSE,
    content: JSON.stringify({
      request_id: requestId,
      service_id: requestEvent.tags.find(tag => tag[0] === 'd')?.[1],
      response_data: responseData,
      status: requiresPayment ? 'payment_required' : 'success',
      timestamp: Math.floor(Date.now() / 1000)
    }),
    tags: [
      ['e', requestEvent.id, requestEvent.pubkey, 'response'],
      ['p', requesterPubkey],
      ['request_id', requestId],
      ['status', requiresPayment ? 'payment_required' : 'success']
    ],
    created_at: Math.floor(Date.now() / 1000)
  };

  if (requiresPayment) {
    response.tags.push(['payment_required', 'true']);
  }

  return response;
}

/**
 * Create subscription management event
 */
export function createSubscriptionEvent(subscriptionData) {
  return {
    kind: NIP90_KINDS.SUBSCRIPTION,
    content: JSON.stringify({
      user_pubkey: subscriptionData.userPubkey,
      tier: subscriptionData.tier,
      status: subscriptionData.status, // 'active', 'cancelled', 'expired'
      start_date: subscriptionData.startDate,
      end_date: subscriptionData.endDate,
      auto_renew: subscriptionData.autoRenew || false
    }),
    tags: [
      ['d', subscriptionData.subscriptionId],
      ['p', subscriptionData.userPubkey],
      ['tier', subscriptionData.tier],
      ['status', subscriptionData.status]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create payment request for service
 */
export function createPaymentRequest(serviceId, amount, description, requestId = null) {
  return {
    kind: NIP90_KINDS.PAYMENT_REQUIRED,
    content: JSON.stringify({
      service_id: serviceId,
      amount: amount,
      currency: 'sats',
      description: description,
      payment_methods: ['lightning'],
      expiry: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
      timestamp: Math.floor(Date.now() / 1000)
    }),
    tags: [
      ['d', serviceId],
      ['amount', amount.toString()],
      ['currency', 'sats'],
      ['payment_method', 'lightning'],
      ...(requestId ? [['request_id', requestId]] : [])
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create access token for authenticated API access
 */
export function createAccessToken(userPubkey, permissions, expiry) {
  const tokenId = generateAccessTokenId();

  return {
    kind: NIP90_KINDS.ACCESS_TOKEN,
    content: JSON.stringify({
      token_id: tokenId,
      user_pubkey: userPubkey,
      permissions: permissions,
      issued_at: Math.floor(Date.now() / 1000),
      expires_at: expiry
    }),
    tags: [
      ['d', tokenId],
      ['p', userPubkey],
      ['expires', expiry.toString()],
      ...permissions.map(perm => ['permission', perm])
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Track API usage
 */
export function createAPIUsageEvent(userPubkey, endpoint, usageData) {
  return {
    kind: NIP90_KINDS.API_USAGE,
    content: JSON.stringify({
      user_pubkey: userPubkey,
      endpoint: endpoint,
      usage_data: usageData,
      timestamp: Math.floor(Date.now() / 1000)
    }),
    tags: [
      ['p', userPubkey],
      ['endpoint', endpoint],
      ['date', new Date().toISOString().split('T')[0]]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create service list event
 */
export function createServiceList(services) {
  return {
    kind: NIP90_KINDS.SERVICE_LIST,
    content: JSON.stringify({
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        type: service.type,
        description: service.description,
        pricing: service.pricing,
        available: service.available
      })),
      last_updated: Math.floor(Date.now() / 1000)
    }),
    tags: [['d', 'services_list']],
    created_at: Math.floor(Date.now() / 1000)
  };
}

/**
 * Publish service configuration
 */
export async function publishServiceConfig(config, privateKey) {
  const event = createServiceConfig(config);
  return await publishToPool([event], privateKey);
}

/**
 * Request service from vending machine
 */
export async function requestService(serviceId, requestData, privateKey) {
  const userPubkey = await getUserPubkey(privateKey);
  const requestEvent = createServiceRequest(serviceId, requestData, userPubkey);
  return await publishToPool([requestEvent], privateKey);
}

/**
 * Get available services
 */
export async function getAvailableServices(relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP90_KINDS.SERVICE_CONFIG],
    limit: 100
  };

  const events = await queryEvents(filter, relays);
  return events.map(event => ({
    id: event.tags.find(tag => tag[0] === 'd')?.[1],
    pubkey: event.pubkey,
    config: JSON.parse(event.content),
    created_at: event.created_at
  }));
}

/**
 * Get user subscriptions
 */
export async function getUserSubscriptions(userPubkey, relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP90_KINDS.SUBSCRIPTION],
    authors: [userPubkey],
    limit: 50
  };

  const events = await queryEvents(filter, relays);
  return events.map(event => ({
    id: event.tags.find(tag => tag[0] === 'd')?.[1],
    subscription: JSON.parse(event.content),
    created_at: event.created_at
  }));
}

/**
 * Check user access level
 */
export function checkUserAccessLevel(subscriptions, requiredFeatures = []) {
  const activeSubscriptions = subscriptions.filter(sub =>
    sub.subscription.status === 'active' &&
    sub.subscription.end_date > Math.floor(Date.now() / 1000)
  );

  if (activeSubscriptions.length === 0) {
    return { hasAccess: false, tier: null, missingFeatures: requiredFeatures };
  }

  // Get highest tier subscription
  const highestTier = activeSubscriptions.reduce((highest, sub) => {
    const tierOrder = ['free', 'basic', 'premium', 'enterprise'];
    const currentTierIndex = tierOrder.indexOf(sub.subscription.tier);
    const highestTierIndex = tierOrder.indexOf(highest?.subscription?.tier || 'free');
    return currentTierIndex > highestTierIndex ? sub : highest;
  }, null);

  const tier = highestTier?.subscription.tier || 'free';
  const tierFeatures = SUBSCRIPTION_TIERS[tier?.toUpperCase()]?.features || [];

  const missingFeatures = requiredFeatures.filter(feature => !tierFeatures.includes(feature));

  return {
    hasAccess: missingFeatures.length === 0,
    tier,
    missingFeatures,
    subscription: highestTier
  };
}

/**
 * Calculate API usage for billing
 */
export async function calculateAPIUsage(userPubkey, startDate, endDate, relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP90_KINDS.API_USAGE],
    authors: [userPubkey],
    since: startDate,
    until: endDate,
    limit: 1000
  };

  const events = await queryEvents(filter, relays);

  let totalUsage = 0;
  const usageByEndpoint = {};
  const dailyUsage = {};

  events.forEach(event => {
    const usageData = JSON.parse(event.content);
    const date = new Date(usageData.timestamp * 1000).toISOString().split('T')[0];

    totalUsage++;

    if (!usageByEndpoint[usageData.endpoint]) {
      usageByEndpoint[usageData.endpoint] = 0;
    }
    usageByEndpoint[usageData.endpoint]++;

    if (!dailyUsage[date]) {
      dailyUsage[date] = 0;
    }
    dailyUsage[date]++;
  });

  return {
    totalUsage,
    usageByEndpoint,
    dailyUsage,
    period: { startDate, endDate }
  };
}

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return 'req_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

/**
 * Generate unique access token ID
 */
function generateAccessTokenId() {
  return 'token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

/**
 * Get user pubkey from private key
 */
async function getUserPubkey(privateKey) {
  // This should import the appropriate function from nostr-tools
  // For now, returning a placeholder
  return typeof privateKey === 'string' ? privateKey : 'unknown';
}

/**
 * Validate subscription payment
 */
export function validateSubscriptionPayment(paymentEvent, subscriptionData) {
  const expectedAmount = SUBSCRIPTION_TIERS[subscriptionData.tier.toUpperCase()]?.price || 0;

  if (!paymentEvent || !paymentEvent.content) {
    return { valid: false, error: 'Invalid payment event' };
  }

  try {
    const paymentData = JSON.parse(paymentEvent.content);

    if (paymentData.amount < expectedAmount) {
      return { valid: false, error: 'Insufficient payment amount' };
    }

    if (paymentData.expires_at < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Payment expired' };
    }

    return { valid: true, paymentData };
  } catch (error) {
    return { valid: false, error: 'Invalid payment data format' };
  }
}

/**
 * Get subscription analytics
 */
export async function getSubscriptionAnalytics(relays = null) {
  const pool = getPool();
  const filter = {
    kinds: [NIP90_KINDS.SUBSCRIPTION],
    limit: 1000
  };

  const events = await queryEvents(filter, relays);

  const analytics = {
    totalSubscriptions: events.length,
    activeSubscriptions: 0,
    subscriptionsByTier: {},
    monthlyRevenue: 0,
    churnRate: 0
  };

  const now = Math.floor(Date.now() / 1000);
  const oneMonthAgo = now - (30 * 24 * 60 * 60);

  events.forEach(event => {
    const subscription = JSON.parse(event.content);

    if (!analytics.subscriptionsByTier[subscription.tier]) {
      analytics.subscriptionsByTier[subscription.tier] = 0;
    }
    analytics.subscriptionsByTier[subscription.tier]++;

    if (subscription.status === 'active' && subscription.end_date > now) {
      analytics.activeSubscriptions++;
      if (event.created_at > oneMonthAgo) {
        analytics.monthlyRevenue += SUBSCRIPTION_TIERS[subscription.tier.toUpperCase()]?.price || 0;
      }
    }
  });

  return analytics;
}
