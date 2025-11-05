export const BOARD_CATEGORIES = [
  {
    id: 'tech-nostr',
    name: 'Tech & Nostr',
    description: 'Technology and Nostr protocol discussions',
    order: 1,
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
        gradient: 'from-amber-500 to-orange-600'
      },
      {
        id: 'bitcoin-talk',
        name: 'Bitcoin Talk',
        description: 'Bitcoin and cryptocurrency discussions',
        icon: '₿',
        category: 'tech-nostr',
        order: 2,
        color: 'orange',
        gradient: 'from-orange-500 to-yellow-600'
      },
      {
        id: 'crypto-corner',
        name: 'Crypto Corner',
        description: 'General cryptocurrency topics and news',
        icon: '💰',
        category: 'tech-nostr',
        order: 3,
        color: 'green',
        gradient: 'from-green-500 to-emerald-600'
      },
      {
        id: 'tech-hub-thailand',
        name: 'Tech Hub Thailand',
        description: 'Technology discussions focused on Thailand',
        icon: '🇹🇭',
        category: 'tech-nostr',
        order: 4,
        color: 'red',
        gradient: 'from-red-500 to-pink-600'
      },
      {
        id: 'developers-den',
        name: 'Developer\'s Den',
        description: 'Programming, coding, and development discussions',
        icon: '💻',
        category: 'tech-nostr',
        order: 5,
        color: 'indigo',
        gradient: 'from-indigo-500 to-purple-600'
      }
    ]
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'General lifestyle and community discussions',
    order: 2,
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
        gradient: 'from-yellow-500 to-amber-600'
      },
      {
        id: 'travel-diaries',
        name: 'Travel Diaries',
        description: 'Travel stories, tips, and destination recommendations',
        icon: '✈️',
        category: 'lifestyle',
        order: 2,
        color: 'sky',
        gradient: 'from-sky-500 to-blue-600'
      },
      {
        id: 'chill-chat',
        name: 'Chill & Chat',
        description: 'General chat and casual conversations',
        icon: '💬',
        category: 'lifestyle',
        order: 3,
        color: 'purple',
        gradient: 'from-purple-500 to-indigo-600'
      },
      {
        id: 'pet-lovers',
        name: 'Pet Lovers',
        description: 'Pets, animal care, and pet owner community',
        icon: '🐾',
        category: 'lifestyle',
        order: 4,
        color: 'emerald',
        gradient: 'from-emerald-500 to-teal-600'
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
        gradient: 'from-cyan-500 to-blue-600'
      },
      {
        id: 'zap-zone',
        name: 'Zap Zone',
        description: 'Lightning Network tips, zaps, and Bitcoin payments',
        icon: '⚡',
        category: 'nostr-special',
        order: 2,
        color: 'yellow',
        gradient: 'from-yellow-400 to-orange-500'
      },
      {
        id: 'freedom-of-speech',
        name: 'Freedom of Speech',
        description: 'Discussions about censorship resistance and free expression',
        icon: '🗣️',
        category: 'nostr-special',
        order: 3,
        color: 'red',
        gradient: 'from-red-500 to-rose-600'
      },
      {
        id: 'decentralized-life',
        name: 'Decentralized Life',
        description: 'Living in a decentralized world, privacy, and sovereignty',
        icon: '🌐',
        category: 'nostr-special',
        order: 4,
        color: 'green',
        gradient: 'from-green-500 to-emerald-600'
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

// Export a flat array for backward compatibility with existing code
export const OFFICIAL_ROOMS = getAllRooms().map(room => ({
  tag: room.id,
  name: room.name,
  description: room.description,
  icon: room.icon,
  color: room.color,
  gradient: room.gradient
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
    category: category.id
  }));
  return acc;
}, {});
