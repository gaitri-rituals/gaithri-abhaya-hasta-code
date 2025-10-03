export const pujaCategories = [
  {
    id: 'children-ceremonies',
    title: 'Children Ceremonies',
    description: 'Sacred rituals for children\'s milestones',
    icon: '👶',
    pujas: [
      {
        id: 'namakarana',
        name: 'Namakarana (Naming Ceremony)',
        duration: '2-3 hours',
        description: 'Traditional naming ceremony for newborns',
        basePrice: 5000
      },
      {
        id: 'annaprashana',
        name: 'Annaprashana (First Feeding)',
        duration: '1-2 hours', 
        description: 'First solid food ceremony for babies',
        basePrice: 3500
      },
      {
        id: 'mundan',
        name: 'Mundan (First Haircut)',
        duration: '1-2 hours',
        description: 'First haircut ceremony for children',
        basePrice: 4000
      }
    ]
  },
  {
    id: 'family-events',
    title: 'Family Events',
    description: 'Auspicious ceremonies for family occasions',
    icon: '🏠',
    pujas: [
      {
        id: 'grihapravesham',
        name: 'Grihapravesham (Housewarming)',
        duration: '3-4 hours',
        description: 'House blessing and purification ceremony',
        basePrice: 8000
      },
      {
        id: 'satyanarayana',
        name: 'Satyanarayana Puja',
        duration: '2-3 hours',
        description: 'Sacred puja for prosperity and well-being',
        basePrice: 6000
      },
      {
        id: 'wedding-ceremonies',
        name: 'Wedding Ceremonies',
        duration: '4-6 hours',
        description: 'Complete wedding rituals and ceremonies',
        basePrice: 15000
      }
    ]
  },
  {
    id: 'shanti-pujas',
    title: 'Shanti Pujas',
    description: 'Peace and harmony rituals',
    icon: '🕉️',
    pujas: [
      {
        id: 'vastu-shanti',
        name: 'Vastu Shanti',
        duration: '2-3 hours',
        description: 'Harmony and balance for homes and offices',
        basePrice: 7000
      },
      {
        id: 'graha-shanti',
        name: 'Graha Shanti',
        duration: '3-4 hours',
        description: 'Planetary peace and harmony puja',
        basePrice: 9000
      },
      {
        id: 'kalasha-shanti',
        name: 'Kalasha Shanti',
        duration: '2 hours',
        description: 'Sacred vessel blessing for peace',
        basePrice: 5500
      }
    ]
  },
  {
    id: 'special-homams',
    title: 'Special Homams',
    description: 'Sacred fire rituals for specific purposes',
    icon: '🔥',
    pujas: [
      {
        id: 'ayush-homam',
        name: 'Ayush Homam',
        duration: '3-4 hours',
        description: 'Fire ritual for longevity and health',
        basePrice: 12000
      },
      {
        id: 'navagraha-homam',
        name: 'Navagraha Homam',
        duration: '4-5 hours',
        description: 'Nine planetary deities fire ritual',
        basePrice: 15000
      },
      {
        id: 'ganapathi-homam',
        name: 'Ganapathi Homam',
        duration: '2-3 hours',
        description: 'Lord Ganesha fire ritual for obstacles removal',
        basePrice: 8000
      }
    ]
  }
];

export const pujaPackages = {
  basic: {
    name: 'Basic Package',
    description: 'Essential rituals with minimal offerings',
    detailedDescription: 'Perfect for simple ceremonies and first-time devotees. Includes all essential elements for a complete puja experience.',
    includes: ['Purohit services', 'Basic puja items', 'Simple offerings', 'Digital certificate'],
    duration: '2-3 hours',
    priceMultiplier: 1,
    images: ['/api/placeholder/400/300', '/api/placeholder/400/300', '/api/placeholder/400/300'],
    videos: ['/api/placeholder/video'],
    testimonials: [
      { name: 'Priya Sharma', text: 'Simple yet meaningful ceremony. Perfect for our family.' },
      { name: 'Raj Patel', text: 'Excellent service and very reasonable pricing.' }
    ]
  },
  advance: {
    name: 'Advance Package', 
    description: 'Enhanced rituals with better quality items',
    detailedDescription: 'Enhanced experience with premium materials and extended rituals. Ideal for special occasions and important milestones.',
    includes: ['Experienced Purohit', 'Premium puja kit', 'Extended rituals', 'Basic prasadam', 'Flower decorations', 'Digital photos'],
    duration: '3-4 hours',
    priceMultiplier: 1.5,
    images: ['/api/placeholder/400/300', '/api/placeholder/400/300', '/api/placeholder/400/300'],
    videos: ['/api/placeholder/video'],
    testimonials: [
      { name: 'Meera Gupta', text: 'Beautiful decorations and excellent purohit knowledge.' },
      { name: 'Suresh Kumar', text: 'Worth every penny. Highly recommended package.' }
    ]
  },
  premium: {
    name: 'Premium Package',
    description: 'Complete experience with high-quality items',
    detailedDescription: 'The ultimate puja experience with luxury amenities and comprehensive documentation. Perfect for once-in-a-lifetime ceremonies.',
    includes: ['Senior Purohit', 'Deluxe puja kit', 'Full rituals', 'Video recording', 'Prasadam', 'Digital instructions', 'Live streaming', 'Premium decorations', 'Catered refreshments'],
    duration: '4-5 hours',
    priceMultiplier: 2.2,
    images: ['/api/placeholder/400/300', '/api/placeholder/400/300', '/api/placeholder/400/300'],
    videos: ['/api/placeholder/video', '/api/placeholder/video'],
    testimonials: [
      { name: 'Anjali Reddy', text: 'Absolutely divine experience. Every detail was perfect.' },
      { name: 'Vikram Singh', text: 'Premium service exceeded all our expectations.' }
    ]
  }
};

export const cateringOptions = {
  basic: {
    name: 'Basic Catering',
    description: 'Simple vegetarian meal',
    items: ['Rice', 'Dal', 'Vegetable curry', 'Chapati', 'Pickle'],
    pricePerPerson: 150
  },
  standard: {
    name: 'Standard Catering',
    description: 'Traditional South Indian feast',
    items: ['Rice varieties', 'Sambar', 'Rasam', 'Multiple curries', 'Chapati', 'Sweets', 'Papad'],
    pricePerPerson: 250
  },
  premium: {
    name: 'Premium Catering',
    description: 'Elaborate traditional feast',
    items: ['Multiple rice varieties', 'Sambar', 'Rasam', '4+ curries', 'Chapati', 'Sweets', 'Fruits', 'Special items'],
    pricePerPerson: 400
  }
};

export const addOnServices = [
  {
    id: 'flowers',
    name: 'Fresh Flowers',
    description: 'Premium flower decorations',
    price: 1500
  },
  {
    id: 'fruits',
    name: 'Fruit Offerings',
    description: 'Seasonal fresh fruits for offerings',
    price: 800
  },
  {
    id: 'media',
    name: 'Photography & Videography',
    description: 'Professional documentation of the ceremony',
    price: 5000
  },
  {
    id: 'decor',
    name: 'Decoration Services',
    description: 'Traditional decorations and setup',
    price: 3000
  },
  {
    id: 'transport',
    name: 'Purohit Transportation',
    description: 'Travel arrangements for the priest',
    price: 1000
  }
];