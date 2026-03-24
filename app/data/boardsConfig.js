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
        tags: ['restaurant', 'recipe', 'street-food', 'fine-dining', 'delivery', 'review', 'bangkok-food', 'chiangmai-food', 'south-thailand-food', 'isaan-food'],
        rules: [
          'ห้ามโพสต์โฆษณาขายของโดยไม่ได้รับอนุญาต',
          'กรุณาใช้ภาษาที่สุภาพ ให้เกียรติผู้อื่น',
          'โพสต์รีวิวต้องเป็นประสบการณ์จริง ไม่จ้างเขียน',
          'ห้ามโพสต์เนื้อหาที่ผิดกฎหมายหรืออันตรายต่อการบริโภค',
          'เคารพความเห็นที่แตกต่างเกี่ยวกับรสชาติและอาหาร'
        ]
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
        tags: ['thailand-travel', 'international-travel', 'backpacking', 'luxury-travel', 'travel-tips', 'hotel-review', 'flight-deals', 'solo-travel', 'family-travel', 'photo-diary'],
        rules: [
          'แชร์ประสบการณ์การเดินทางจริง ไม่โพสต์ปลอม',
          'ให้ข้อมูลที่เป็นประโยชน์และตรวจสอบแล้ว',
          'เคารพวัฒนธรรมท้องถิ่นและสถานที่ท่องเที่ยว',
          'ห้ามโพสต์โฆษณาบริการท่องเที่ยวโดยไม่ได้รับอนุญาต',
          'ระวังการแชร์ข้อมูลส่วนตัวและตำแหน่งที่พำนัก'
        ]
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
        tags: ['daily-life', 'random-thoughts', 'questions', 'advice', 'stories', 'memes', 'funny', 'serious-talk', 'introductions', 'off-topic'],
        rules: [
          'ใช้ภาษาสุภาพ ไม่หยาบคายหรือก้าวร้าว',
          'เคารพความเห็นที่แตกต่าง ไม่โจมตีส่วนตัว',
          'ห้ามโพสต์เนื้อหาทางการเมืองที่รุนแรง',
          'ไม่โพสต์สแปมหรือโฆษณาซ้ำๆ',
          'หลีกเลี่ยงเนื้อหาที่ละเอียดอ่อนหรือไม่เหมาะสม'
        ]
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
        tags: ['dogs', 'cats', 'pet-care', 'pet-health', 'pet-food', 'adoption', 'training', 'pet-photos', 'vet-advice', 'pet-products'],
        rules: [
          'รักสัตว์อย่างมีความรับผิดชอบ ไม่ทิ้งขว้าง',
          'ให้ข้อมูลการดูแลสัตว์ที่ถูกต้องและปลอดภัย',
          'ห้ามโพสต์ซื้อขายสัตว์ผิดกฎหมาย',
          'เคารพความเชื่อเรื่องการเลี้ยงสัตว์ที่แตกต่าง',
          'ไม่โพสต์ภาพหรือเนื้อหาที่โหดร้ายต่อสัตว์'
        ]
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
        tags: ['nostr-basics', 'clients', 'relays', 'nips', 'nostr-dev', 'community', 'announcements', 'help', 'general-nostr', 'nostr-news'],
        rules: [
          'ยินดีต้อนรับผู้ใช้ใหม่ ถามคำถามได้โดยไม่กังวล',
          'แบ่งปันความรู้เกี่ยวกับ Nostr อย่างเปิดใจ',
          'ห้ามโพสต์โฆษณาโปรเจกต์โดยไม่ได้รับอนุญาต',
          'ให้ข้อมูลเทคนิคที่ถูกต้อง ตรวจสอบแล้ว',
          'เคารพความเห็นที่แตกต่างเกี่ยวกับโปรโตคอล'
        ]
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
        tags: ['bitcoin', 'btc', 'hodl', 'mining', 'self-custody', 'bitcoin-thailand', 'price-discussion', 'adoption', 'lightning-network', 'sats'],
        rules: [
          'ไม่ใช่ช่องทางการให้คำแนะนำทางการเงิน',
          'ระวังการแชร์ข้อมูลส่วนตัวและ wallet',
          'ห้ามโพสต์ชวนเชื่อลงทุนหรือแชร์ลูกโซ่',
          'เคารพความเห็นที่แตกต่างเกี่ยวกับ Bitcoin',
          'ให้ข้อมูลเทคนิคที่ถูกต้อง ไม่บิดเบือน'
        ]
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
        tags: ['altcoins', 'defi', 'nft', 'web3', 'crypto-news', 'trading', 'blockchain', 'ethereum', 'stablecoins', 'crypto-thailand'],
        rules: [
          'ไม่ใช่ช่องทางการให้คำแนะนำการลงทุน',
          'ห้ามโพสต์ชวนเชื่อโปรเจกต์ scam หรือแชร์ลูกโซ่',
          'ให้ข้อมูลข่าวและเทคนิคที่ตรวจสอบแล้ว',
          'ระวังการแชร์ลิงก์ phishing หรือเว็บปลอม',
          'เคารพความเห็นที่แตกต่างเกี่ยวกับ cryptocurrency'
        ]
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
        tags: ['thailand-tech', 'thai-startups', 'digital-thailand', 'tech-jobs', 'tech-events', 'government-tech', '5g', 'iot', 'ai-thailand', 'tech-education'],
        rules: [
          'แชร์ข่าวสารและเทคโนโลยีที่ถูกต้อง ตรวจสอบแล้ว',
          'ห้ามโพสต์โฆษณาหรือขายของโดยไม่ได้รับอนุญาต',
          'เคารพความเห็นที่แตกต่างเกี่ยวกับนโยบายและเทคโนโลยี',
          'ให้ข้อมูลที่เป็นประโยชน์ต่อชุมชนเทคโนโลยีไทย',
          'ไม่โพสต์เนื้อหาที่ผิดกฎหมายหรือสร้างความเสียหาย'
        ]
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
        tags: ['programming', 'javascript', 'python', 'rust', 'web-dev', 'api', 'database', 'git', 'code-review', 'career-advice'],
        rules: [
          'แบ่งปันความรู้และโค้ดอย่างเปิดใจ',
          'ห้ามโพสต์ถามการบ้านโดยไม่แสดงความพยายาม',
          'ให้เกียรติผู้เริ่มต้นและผู้ที่ถามคำถาม',
          'โพสต์โค้ดต้องจัดรูปแบบให้อ่านง่าย',
          'ไม่โพสต์โฆษณาหลักสูตรหรือบริการโดยไม่ได้รับอนุญาต'
        ]
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
        tags: ['relay-setup', 'relay-admin', 'nip05', 'relay-software', 'database', 'performance', 'monitoring', 'relay-policy', 'paid-relays', 'private-relays'],
        rules: [
          'แบ่งปันความรู้เรื่องการตั้งค่า relay อย่างถูกต้อง',
          'ห้ามโพสต์โฆษณา relay โดยไม่ได้รับอนุญาต',
          'ให้ข้อมูลเทคนิคที่ตรวจสอบแล้วและทันสมัย',
          'เคารพนโยบาย relay ที่แตกต่างกัน',
          'ไม่โพสต์เนื้อหาที่ส่งเสริมการโจมตี relay'
        ]
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
        tags: ['zaps', 'lightning', 'ln-address', 'wallets', 'ln-tips', 'zap-split', 'lnurl', 'payments', 'sats4sats', 'bitcoin-payments'],
        rules: [
          'ไม่ใช่ช่องทางการขอรับบริจาคหรือขอ zaps',
          'ระวังการแชร์ invoice หรือข้อมูล wallet ส่วนตัว',
          'ห้ามโพสต์หลอกลวงหรือ scam เกี่ยวกับ Lightning',
          'แบ่งปันความรู้เรื่อง zaps และ Lightning อย่างถูกต้อง',
          'ไม่โพสต์โฆษณาบริการโดยไม่ได้รับอนุญาต'
        ]
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
        tags: ['censorship-resistance', 'privacy', 'free-speech', 'decentralization', 'digital-rights', 'surveillance', 'encryption', 'anonymity', 'activism', 'philosophy'],
        rules: [
          'แสดงความคิดเห็นอย่างอิสระแต่มีความรับผิดชอบ',
          'ห้ามโพสต์เนื้อหาที่ผิดกฎหมายอย่างชัดเจน',
          'เคารพความเห็นที่แตกต่างโดยไม่โจมตีส่วนตัว',
          'ไม่โพสต์เนื้อหาที่ส่งเสริมความรุนแรงหรืออันตราย',
          'ใช้เหตุผลและตรรกะในการอภิปราย'
        ]
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
        tags: ['self-sovereignty', 'privacy-tools', 'decentralized-identity', 'p2p', 'homesteading', 'off-grid', 'digital-nomad', 'location-independent', 'crypto-living', 'sovereign-individual'],
        rules: [
          'แบ่งปันความรู้เรื่องการอยู่อาศัยแบบกระจายอำนาจ',
          'ห้ามโพสต์ข้อมูลที่ส่งเสริมกิจกรรมผิดกฎหมาย',
          'ให้ข้อมูลความเป็นส่วนตัวและความปลอดภัยที่ถูกต้อง',
          'เคารพทางเลือกในการใช้ชีวิตที่แตกต่าง',
          'ไม่โพสต์เนื้อหาที่อันตรายหรือเสี่ยงต่อความปลอดภัย'
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
