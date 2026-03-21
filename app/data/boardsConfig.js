export const BOARD_CATEGORIES = [
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'General lifestyle and community discussions',
    order: 1,
    icon: '🌟',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
    rooms: [
      {
        id: 'foodie-thailand',
        name: 'Foodie Thailand',
        description: 'Food, restaurants, and culinary experiences in Thailand',
        icon: '🍜',
        category: 'lifestyle',
        order: 1,
        color: 'yellow',
        gradient: 'from-yellow-500 to-amber-600',
        tags: ['restaurant', 'recipe', 'street-food', 'fine-dining', 'delivery', 'review', 'bangkok-food', 'chiangmai-food', 'south-thailand-food', 'isaan-food']
      },
      {
        id: 'travel-diaries',
        name: 'Travel Diaries',
        description: 'Travel stories, tips, and destination recommendations',
        icon: '✈️',
        category: 'lifestyle',
        order: 2,
        color: 'sky',
        gradient: 'from-sky-500 to-blue-600',
        tags: ['thailand-travel', 'international-travel', 'backpacking', 'luxury-travel', 'travel-tips', 'hotel-review', 'flight-deals', 'solo-travel', 'family-travel', 'photo-diary']
      },
      {
        id: 'chill-chat',
        name: 'Chill & Chat',
        description: 'General chat and casual conversations',
        icon: '💬',
        category: 'lifestyle',
        order: 3,
        color: 'purple',
        gradient: 'from-purple-500 to-indigo-600',
        tags: ['daily-life', 'random-thoughts', 'questions', 'advice', 'stories', 'memes', 'funny', 'serious-talk', 'introductions', 'off-topic']
      },
      {
        id: 'pet-lovers',
        name: 'Pet Lovers',
        description: 'Pets, animal care, and pet owner community',
        icon: '🐾',
        category: 'lifestyle',
        order: 4,
        color: 'emerald',
        gradient: 'from-emerald-500 to-teal-600',
        tags: ['dogs', 'cats', 'pet-care', 'pet-health', 'pet-food', 'adoption', 'training', 'pet-photos', 'vet-advice', 'pet-products']
      }
    ]
  },
  {
    id: 'tech-nostr',
    name: 'Tech & Nostr',
    description: 'Technology and Nostr protocol discussions',
    order: 2,
    icon: '💻',
    color: 'blue',
    gradient: 'from-blue-500 to-purple-600',
    rooms: [
      {
        id: 'nostr-cafe',
        name: 'Nostr Café',
        description: 'Casual discussions about Nostr protocol and ecosystem',
        icon: '☕',
        category: 'tech-nostr',
        order: 1,
        color: 'amber',
        gradient: 'from-amber-500 to-orange-600',
        tags: ['nostr-basics', 'clients', 'relays', 'nips', 'nostr-dev', 'community', 'announcements', 'help', 'general-nostr', 'nostr-news']
      },
      {
        id: 'bitcoin-talk',
        name: 'Bitcoin Talk',
        description: 'Bitcoin and cryptocurrency discussions',
        icon: '₿',
        category: 'tech-nostr',
        order: 2,
        color: 'orange',
        gradient: 'from-orange-500 to-yellow-600',
        tags: ['bitcoin', 'btc', 'hodl', 'mining', 'self-custody', 'bitcoin-thailand', 'price-discussion', 'adoption', 'lightning-network', 'sats']
      },
      {
        id: 'crypto-corner',
        name: 'Crypto Corner',
        description: 'General cryptocurrency topics and news',
        icon: '💰',
        category: 'tech-nostr',
        order: 3,
        color: 'green',
        gradient: 'from-green-500 to-emerald-600',
        tags: ['altcoins', 'defi', 'nft', 'web3', 'crypto-news', 'trading', 'blockchain', 'ethereum', 'stablecoins', 'crypto-thailand']
      },
      {
        id: 'tech-hub-thailand',
        name: 'Tech Hub Thailand',
        description: 'Technology discussions focused on Thailand',
        icon: '🇹🇭',
        category: 'tech-nostr',
        order: 4,
        color: 'red',
        gradient: 'from-red-500 to-pink-600',
        tags: ['thailand-tech', 'thai-startups', 'digital-thailand', 'tech-jobs', 'tech-events', 'government-tech', '5g', 'iot', 'ai-thailand', 'tech-education']
      },
      {
        id: 'developers-den',
        name: 'Developer\'s Den',
        description: 'Programming, coding, and development discussions',
        icon: '💻',
        category: 'tech-nostr',
        order: 5,
        color: 'indigo',
        gradient: 'from-indigo-500 to-purple-600',
        tags: ['programming', 'javascript', 'python', 'rust', 'web-dev', 'api', 'database', 'git', 'code-review', 'career-advice']
      }
    ]
  },

  {
    id: 'nostr-special',
    name: 'Nostr Special',
    description: 'Specialized Nostr and decentralization topics',
    order: 3,
    icon: '⚡',
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    rooms: [
      {
        id: 'relay-station',
        name: 'Relay Station',
        description: 'Discussions about Nostr relays, setup, and management',
        icon: '📡',
        category: 'nostr-special',
        order: 1,
        color: 'cyan',
        gradient: 'from-cyan-500 to-blue-600',
        tags: ['relay-setup', 'relay-admin', 'nip05', 'relay-software', 'database', 'performance', 'monitoring', 'relay-policy', 'paid-relays', 'private-relays']
      },
      {
        id: 'zap-zone',
        name: 'Zap Zone',
        description: 'Lightning Network tips, zaps, and Bitcoin payments',
        icon: '⚡',
        category: 'nostr-special',
        order: 2,
        color: 'yellow',
        gradient: 'from-yellow-400 to-orange-500',
        tags: ['zaps', 'lightning', 'ln-address', 'wallets', 'ln-tips', 'zap-split', 'lnurl', 'payments', 'sats4sats', 'bitcoin-payments']
      },
      {
        id: 'freedom-of-speech',
        name: 'Freedom of Speech',
        description: 'Discussions about censorship resistance and free expression',
        icon: '🗣️',
        category: 'nostr-special',
        order: 3,
        color: 'red',
        gradient: 'from-red-500 to-rose-600',
        tags: ['censorship-resistance', 'privacy', 'free-speech', 'decentralization', 'digital-rights', 'surveillance', 'encryption', 'anonymity', 'activism', 'philosophy']
      },
      {
        id: 'decentralized-life',
        name: 'Decentralized Life',
        description: 'Living in a decentralized world, privacy, and sovereignty',
        icon: '🌐',
        category: 'nostr-special',
        order: 4,
        color: 'green',
        gradient: 'from-green-500 to-emerald-600',
        tags: ['self-sovereignty', 'privacy-tools', 'decentralized-identity', 'p2p', 'homesteading', 'off-grid', 'digital-nomad', 'location-independent', 'crypto-living', 'sovereign-individual']
      }
    ]
  }
];

// Helper functions to get rooms and categories
export const getAllRooms = () => {
  return BOARD_CATEGORIES.flatMap(category => category.rooms);
};

export const getRoomById = (roomId) => {
  return getAllRooms().find(room => room.id === roomId);
};

export const getCategoryById = (categoryId) => {
  return BOARD_CATEGORIES.find(category => category.id === categoryId);
};

export const getRoomsByCategory = (categoryId) => {
  const category = getCategoryById(categoryId);
  return category ? category.rooms : [];
};

export const getCategoryByRoomId = (roomId) => {
  return BOARD_CATEGORIES.find(category =>
    category.rooms.some(room => room.id === roomId)
  );
};

// Get room-specific tags
export const getRoomTags = (roomId) => {
  const room = getRoomById(roomId);
  return room?.tags || [];
};

// Check if a tag belongs to a specific room
export const isTagValidForRoom = (roomId, tag) => {
  const roomTags = getRoomTags(roomId);
  return roomTags.includes(tag.toLowerCase());
};

// Get all available tags across all rooms (for admin/global use)
export const getAllTags = () => {
  const allTags = new Set();
  getAllRooms().forEach(room => {
    room.tags?.forEach(tag => allTags.add(tag));
  });
  return Array.from(allTags).sort();
};

// Export a flat array for backward compatibility with existing code
export const OFFICIAL_ROOMS = getAllRooms().map(room => ({
  tag: room.id,
  name: room.name,
  description: room.description,
  icon: room.icon,
  color: room.color,
  gradient: room.gradient,
  tags: room.tags || []
}));

// Category-based room groups for navigation
export const ROOMS_BY_CATEGORY = BOARD_CATEGORIES.reduce((acc, category) => {
  acc[category.id] = category.rooms.map(room => ({
    tag: room.id,
    name: room.name,
    description: room.description,
    icon: room.icon,
    color: room.color,
    gradient: room.gradient,
    category: category.id,
    tags: room.tags || []
  }));
  return acc;
}, {});
