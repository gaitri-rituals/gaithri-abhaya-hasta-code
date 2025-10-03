// Mock temple data for development
export const mockTemples = [
  {
    id: 1,
    name: "Sri Venkateswara Temple",
    deity: "Lord Venkateswara",
    category: "Vaishnava", 
    location: "Tirupati, Andhra Pradesh",
    distance: 5.2,
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop",
    heroImages: [
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&h=800&fit=crop"
    ],
    description: "One of the most revered temples dedicated to Lord Venkateswara, also known as Balaji. This ancient temple attracts millions of devotees every year.",
    history: "Built in the 12th century, this temple has been a center of devotion for over 800 years. The temple architecture showcases beautiful Dravidian style with intricate carvings and sculptures.",
    openingHours: "4:00 AM - 10:00 PM",
    priestContact: "+91 98765 43210",
    services: [
      {
        id: 1,
        name: "Donate Dakshiney",
        type: "donation",
        presets: [51, 101, 501, 1001]
      },
      {
        id: 2,
        name: "Archana Ticket",
        type: "archana",
        price: 25,
        fields: ["name", "dob", "nakshatra", "gothra"]
      },
      {
        id: 3,
        name: "Abhisheka Ticket", 
        type: "abhisheka",
        price: 151,
        fields: ["name", "dob", "preferredTime"]
      }
    ],
    events: [
      {
        id: 1,
        name: "Brahmotsavam Festival",
        date: "2024-10-15",
        description: "Annual 9-day festival celebration",
        canBook: true
      },
      {
        id: 2,
        name: "Vaikunta Ekadashi",
        date: "2024-12-21", 
        description: "Special prayers and procession",
        canBook: true
      }
    ]
  },
  {
    id: 2,
    name: "Meenakshi Amman Temple",
    deity: "Goddess Meenakshi",
    category: "Shakti",
    location: "Madurai, Tamil Nadu", 
    distance: 12.8,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
    heroImages: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop"
    ],
    description: "Historic temple dedicated to Goddess Meenakshi and Lord Sundareshwar. Famous for its stunning architecture and colorful towers.",
    history: "Dating back to the 6th century BCE, this temple complex is a masterpiece of Dravidian architecture with 14 magnificent gopurams.",
    openingHours: "5:00 AM - 12:30 PM, 4:00 PM - 9:30 PM",
    priestContact: "+91 98765 43211",
    services: [
      {
        id: 1,
        name: "Donate Dakshiney",
        type: "donation", 
        presets: [51, 101, 501, 1001]
      },
      {
        id: 2,
        name: "Archana Ticket",
        type: "archana",
        price: 30,
        fields: ["name", "dob", "nakshatra", "gothra"]
      }
    ],
    events: [
      {
        id: 1,
        name: "Meenakshi Thirukalyanam",
        date: "2024-11-08",
        description: "Divine wedding celebration",
        canBook: true
      }
    ]
  },
  {
    id: 3,
    name: "Brihadeeswarar Temple",
    deity: "Lord Shiva",
    category: "Shaiva",
    location: "Thanjavur, Tamil Nadu",
    distance: 18.5,
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop",
    heroImages: [
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&h=800&fit=crop"
    ],
    description: "UNESCO World Heritage Site, this magnificent temple is a testament to Chola architecture and devotion to Lord Shiva.",
    history: "Built by Raja Raja Chola I in 1010 CE, this temple showcases the pinnacle of Chola architecture and engineering.",
    openingHours: "6:00 AM - 12:30 PM, 4:00 PM - 8:30 PM",
    priestContact: "+91 98765 43212",
    services: [
      {
        id: 1,
        name: "Donate Dakshiney",
        type: "donation",
        presets: [51, 101, 501, 1001]
      },
      {
        id: 2,
        name: "Archana Ticket", 
        type: "archana",
        price: 20,
        fields: ["name", "dob", "nakshatra", "gothra"]
      },
      {
        id: 3,
        name: "Abhisheka Ticket",
        type: "abhisheka", 
        price: 201,
        fields: ["name", "dob", "preferredTime"]
      }
    ],
    events: [
      {
        id: 1,
        name: "Maha Shivaratri",
        date: "2024-12-02",
        description: "Grand Shiva celebration",
        canBook: true
      }
    ]
  }
];