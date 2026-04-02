export const BOARD_CATEGORIES = [
  {
    id: 'social-lifestyle',
    name: 'Social & Lifestyle',
    description: 'Casual conversations and everyday topics',
    order: 1,
    icon: '🎉',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
    rooms: [
      {
        id: 'general',
        name: 'General',
        description: 'General conversations, questions, and everyday discussions',
        icon: '💬',
        category: 'social-lifestyle',
        order: 1,
        color: 'purple',
        gradient: 'from-purple-500 to-indigo-600',
        tags: ['general', 'questions', 'discussion', 'community', 'introductions', 'daily-life', 'random-thoughts', 'advice', 'stories', 'off-topic'],
        rules: [
          'Use respectful and kind language at all times',
          'No spam, self-promotion, or excessive advertising',
          'Keep discussions civil and avoid personal attacks',
          'No illegal content or harmful misinformation',
          'Respect diverse opinions and perspectives'
        ]
      },
      {
        id: 'food-dining',
        name: 'Food & Dining',
        description: 'Restaurant reviews, food experiences, and culinary topics',
        icon: '🍜',
        category: 'social-lifestyle',
        order: 2,
        color: 'yellow',
        gradient: 'from-yellow-500 to-amber-600',
        tags: ['food', 'restaurant', 'recipe', 'cooking', 'dining', 'street-food', 'fine-dining', 'food-review', 'culinary', 'foodie'],
        rules: [
          'Share genuine experiences and honest reviews',
          'No paid promotions without disclosure',
          'Be respectful of different food preferences and dietary choices',
          'No spam from food delivery or restaurant accounts',
          'Keep content safe and avoid harmful food advice'
        ]
      },
      {
        id: 'travel-places',
        name: 'Travel & Places',
        description: 'Travel experiences, destination guides, and practical tips',
        icon: '✈️',
        category: 'social-lifestyle',
        order: 3,
        color: 'sky',
        gradient: 'from-sky-500 to-blue-600',
        tags: ['travel', 'destination', 'travel-tips', 'adventure', 'backpacking', 'luxury-travel', 'solo-travel', 'family-travel', 'photo-diary', 'travel-guide'],
        rules: [
          'Share authentic travel experiences and verified information',
          'Respect local cultures and destinations',
          'No fake reviews or misleading travel content',
          'Be cautious when sharing personal location data',
          'No unauthorized tourism business promotions'
        ]
      },
      {
        id: 'pets-animal-care',
        name: 'Pets & Animal Care',
        description: 'Pet care, health, and animal-related discussions',
        icon: '🐾',
        category: 'social-lifestyle',
        order: 4,
        color: 'emerald',
        gradient: 'from-emerald-500 to-teal-600',
        tags: ['pets', 'dogs', 'cats', 'pet-care', 'pet-health', 'adoption', 'training', 'pet-nutrition', 'vet-advice', 'animal-welfare'],
        rules: [
          'Promote responsible pet ownership and animal welfare',
          'Share accurate and safe pet care information',
          'No illegal pet trading or breeding advertisements',
          'Respect different approaches to pet care',
          'No cruel or harmful content involving animals'
        ]
      }
    ]
  },
  {
    id: 'bitcoin-layer',
    name: 'Bitcoin & Payments',
    description: 'Bitcoin usage, Lightning, and value exchange',
    order: 2,
    icon: '⚡',
    color: 'orange',
    gradient: 'from-orange-500 to-yellow-600',
    rooms: [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        description: 'Bitcoin usage, fundamentals, and ecosystem topics',
        icon: '₿',
        category: 'bitcoin-layer',
        order: 1,
        color: 'orange',
        gradient: 'from-orange-500 to-yellow-600',
        tags: ['bitcoin', 'btc', 'hodl', 'mining', 'self-custody', 'bitcoin-adoption', 'price-discussion', 'sats', 'bitcoin-basics', 'halving'],
        rules: [
          'This is not financial advice - do your own research',
          'Protect your private keys and personal information',
          'No investment schemes or pump-and-dump promotions',
          'Respect different Bitcoin perspectives and strategies',
          'Share accurate technical information only'
        ]
      },
      {
        id: 'lightning-network',
        name: 'Lightning Network',
        description: 'Lightning payments, zaps, and integration topics',
        icon: '⚡',
        category: 'bitcoin-layer',
        order: 2,
        color: 'yellow',
        gradient: 'from-yellow-400 to-orange-500',
        tags: ['lightning', 'ln', 'zaps', 'lnurl', 'payments', 'wallets', 'node-running', 'liquidity', 'routing', 'integration'],
        rules: [
          'Not a channel for begging or soliciting zaps',
          'Be cautious sharing invoices or wallet information',
          'No Lightning scams or fraudulent services',
          'Share accurate Lightning technical knowledge',
          'No unauthorized payment service promotions'
        ]
      },
      {
        id: 'digital-assets',
        name: 'Digital Assets',
        description: 'Cryptocurrencies, blockchain technologies, and market trends',
        icon: '💰',
        category: 'bitcoin-layer',
        order: 3,
        color: 'green',
        gradient: 'from-green-500 to-emerald-600',
        tags: ['crypto', 'altcoins', 'defi', 'blockchain', 'web3', 'crypto-news', 'trading', 'ethereum', 'stablecoins', 'market-analysis'],
        rules: [
          'Not investment advice - verify all information',
          'No scam projects or pump-and-dump schemes',
          'Share verified news and technical analysis',
          'Beware of phishing links and fake websites',
          'Respect different cryptocurrency perspectives'
        ]
      }
    ]
  },
  {
    id: 'nostr-builders',
    name: 'Nostr & Builders',
    description: 'Nostr ecosystem, development, and infrastructure',
    order: 3,
    icon: '🛠️',
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    rooms: [
      {
        id: 'nostr',
        name: 'Nostr',
        description: 'Nostr usage, discussions, and ecosystem topics',
        icon: '☕',
        category: 'nostr-builders',
        order: 1,
        color: 'amber',
        gradient: 'from-amber-500 to-orange-600',
        tags: ['nostr', 'nostr-basics', 'clients', 'relays', 'nips', 'nostr-dev', 'community', 'announcements', 'help', 'nostr-news'],
        rules: [
          'Welcome newcomers - ask questions freely',
          'Share Nostr knowledge openly and kindly',
          'No unauthorized project promotions',
          'Provide accurate and verified technical information',
          'Respect different views on protocol development'
        ]
      },
      {
        id: 'software-development',
        name: 'Software Development',
        description: 'Programming, system design, and engineering practices',
        icon: '💻',
        category: 'nostr-builders',
        order: 2,
        color: 'indigo',
        gradient: 'from-indigo-500 to-purple-600',
        tags: ['programming', 'javascript', 'python', 'rust', 'web-dev', 'api', 'database', 'git', 'code-review', 'career-advice'],
        rules: [
          'Share knowledge and code openly',
          'Show effort when asking coding questions',
          'Be welcoming to beginners and learners',
          'Format code properly for readability',
          'No unauthorized course or service promotions'
        ]
      },
      {
        id: 'relay-infrastructure',
        name: 'Relay Infrastructure',
        description: 'Relay setup, performance, and infrastructure management',
        icon: '📡',
        category: 'nostr-builders',
        order: 3,
        color: 'cyan',
        gradient: 'from-cyan-500 to-blue-600',
        tags: ['relay', 'relay-setup', 'relay-admin', 'nip05', 'relay-software', 'database', 'performance', 'monitoring', 'relay-policy', 'infrastructure'],
        rules: [
          'Share accurate relay setup and management knowledge',
          'No unauthorized relay advertisements',
          'Provide up-to-date technical information',
          'Respect different relay policies and configurations',
          'No content promoting relay attacks or abuse'
        ]
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

// Get room rules
export const getRoomRules = (roomId) => {
  const room = getRoomById(roomId);
  return room?.rules || [];
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
