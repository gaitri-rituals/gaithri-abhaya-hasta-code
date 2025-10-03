// Temple Classes Data
export const classCategories = [
  { id: 'music', name: 'Music', icon: '🎵', color: 'bg-orange-100 text-orange-700' },
  { id: 'dance', name: 'Dance', icon: '💃', color: 'bg-pink-100 text-pink-700' },
  { id: 'vedas', name: 'Vedas', icon: '📖', color: 'bg-amber-100 text-amber-700' },
  { id: 'yoga', name: 'Yoga', icon: '🧘‍♀️', color: 'bg-green-100 text-green-700' },
  { id: 'astrology', name: 'Astrology', icon: '⭐', color: 'bg-purple-100 text-purple-700' },
  { id: 'craft', name: 'Craft', icon: '🎨', color: 'bg-blue-100 text-blue-700' }
];

export const gurus = [
  {
    id: 'guru1',
    name: 'Pandit Ravi Shankar',
    photo: '👨‍🏫',
    specialization: 'Classical Music',
    experience: 25,
    temple: 'Sri Ram Mandir',
    lineage: 'Maihar Gharana',
    bio: 'A renowned sitar maestro with 25 years of teaching experience. Trained under the guidance of legendary musicians and has performed at prestigious venues worldwide.',
    testimonials: [
      { student: 'Anita Sharma', text: 'Guruji\'s teaching method is exceptional. I learned to play ragas beautifully.' },
      { student: 'Rajesh Kumar', text: 'The spiritual aspect of music was beautifully explained by Pandit ji.' }
    ],
    rating: 4.9
  },
  {
    id: 'guru2',
    name: 'Guru Priya Devi',
    photo: '👩‍🏫',
    specialization: 'Classical Dance',
    experience: 18,
    temple: 'Jagannath Temple',
    lineage: 'Kalakshetra Style',
    bio: 'Expert in Bharatanatyam with deep knowledge of temple dance traditions. Has choreographed numerous temple performances.',
    testimonials: [
      { student: 'Meera Patel', text: 'Beautiful expressions and perfect technique. Highly recommended!' },
      { student: 'Kavya Singh', text: 'Guru ma teaches with so much love and patience.' }
    ],
    rating: 4.8
  },
  {
    id: 'guru3',
    name: 'Swami Vedananda',
    photo: '🧙‍♂️',
    specialization: 'Vedic Studies',
    experience: 30,
    temple: 'Kashi Vishwanath',
    lineage: 'Advaita Tradition',
    bio: 'Scholar of ancient Vedic texts with expertise in Sanskrit and philosophy. Teaches with traditional gurukul methods.',
    testimonials: [
      { student: 'Dr. Sunita Rao', text: 'Profound knowledge of scriptures. Life-changing experience.' },
      { student: 'Amit Joshi', text: 'Complex concepts explained with simple examples.' }
    ],
    rating: 4.9
  }
];

export const templeClasses = [
  {
    id: 'class1',
    title: 'Sitar Mastery',
    guruId: 'guru1',
    category: 'music',
    temple: 'Sri Ram Mandir',
    description: 'Learn classical sitar under divine blessings',
    schedule: 'Every Sunday 5:00 PM',
    duration: '2 hours',
    batchSize: 8,
    level: ['Beginner', 'Intermediate'],
    curriculum: [
      { week: '1-2', topic: 'Basic posture and string tuning' },
      { week: '3-4', topic: 'First raga - Yaman' },
      { week: '5-6', topic: 'Meend and gamak techniques' },
      { week: '7-8', topic: 'Composition and improvisation' }
    ],
    subscriptionPlans: [
      { duration: 'monthly', price: 2500, originalPrice: 3000 },
      { duration: 'quarterly', price: 6500, originalPrice: 9000 },
      { duration: 'yearly', price: 20000, originalPrice: 30000 }
    ],
    kit: {
      name: 'Sitar Starter Kit',
      items: ['Practice Sitar', 'Instruction Manual', 'Tuning Guide', 'Plectrum Set'],
      value: 8000
    },
    digitalAccess: ['Video lessons', 'Practice tracks', 'Theory PDFs', 'Online community'],
    deity: 'Lord Saraswati',
    image: '🎵',
    rating: 4.8,
    studentsCount: 45
  },
  {
    id: 'class2',
    title: 'Bharatanatyam Basics',
    guruId: 'guru2',
    category: 'dance',
    temple: 'Jagannath Temple',
    description: 'Sacred dance form in temple tradition',
    schedule: 'Saturdays 6:00 PM',
    duration: '1.5 hours',
    batchSize: 12,
    level: ['Beginner'],
    curriculum: [
      { week: '1-2', topic: 'Basic positions and adavus' },
      { week: '3-4', topic: 'Hand gestures (mudras)' },
      { week: '5-6', topic: 'First dance piece - Pushpanjali' },
      { week: '7-8', topic: 'Expression and storytelling' }
    ],
    subscriptionPlans: [
      { duration: 'monthly', price: 2000, originalPrice: 2500 },
      { duration: 'quarterly', price: 5500, originalPrice: 7500 },
      { duration: 'yearly', price: 18000, originalPrice: 25000 }
    ],
    kit: {
      name: 'Dance Essentials Kit',
      items: ['Practice Costume', 'Ghungroo Bells', 'Makeup Kit', 'Theory Book'],
      value: 5000
    },
    digitalAccess: ['Step-by-step videos', 'Music tracks', 'Costume guide', 'Online practice sessions'],
    deity: 'Lord Nataraja',
    image: '💃',
    rating: 4.7,
    studentsCount: 32
  },
  {
    id: 'class3',
    title: 'Vedic Chanting',
    guruId: 'guru3',
    category: 'vedas',
    temple: 'Kashi Vishwanath',
    description: 'Ancient Vedic mantras and their meanings',
    schedule: 'Daily 6:00 AM',
    duration: '1 hour',
    batchSize: 15,
    level: ['Beginner', 'Intermediate', 'Advanced'],
    curriculum: [
      { week: '1-2', topic: 'Sanskrit pronunciation basics' },
      { week: '3-4', topic: 'Gayatri Mantra and meanings' },
      { week: '5-6', topic: 'Vedic grammar and accents' },
      { week: '7-8', topic: 'Complete sukta recitation' }
    ],
    subscriptionPlans: [
      { duration: 'monthly', price: 1500, originalPrice: 2000 },
      { duration: 'quarterly', price: 4000, originalPrice: 6000 },
      { duration: 'yearly', price: 15000, originalPrice: 20000 }
    ],
    kit: {
      name: 'Vedic Study Kit',
      items: ['Sanskrit Text Books', 'Audio Recordings', 'Pronunciation Guide', 'Meditation Beads'],
      value: 3000
    },
    digitalAccess: ['Audio pronunciations', 'Meaning translations', 'Daily practice reminders', 'Scholar discussions'],
    deity: 'Lord Saraswati',
    image: '📖',
    rating: 4.9,
    studentsCount: 67
  }
];

export const dailyLearningModules = {
  class1: [
    {
      id: 'mod1_day1',
      day: 1,
      knowledgeStory: {
        title: 'The Divine Origin of Sitar',
        content: 'Legend says the sitar was created by the celestial musician Narada to please Lord Vishnu...',
        image: '🎵'
      },
      practiceSession: {
        title: 'Basic String Tuning',
        videoUrl: '/practice/sitar-tuning.mp4',
        duration: 15,
        instructions: 'Follow along as we tune each string to perfect pitch'
      },
      quiz: {
        question: 'How many main strings does a classical sitar have?',
        options: ['4', '6', '7', '13'],
        correct: 2,
        explanation: 'A classical sitar has 7 main playing strings.'
      }
    }
    // More modules...
  ],
  class2: [
    {
      id: 'mod2_day1',
      day: 1,
      knowledgeStory: {
        title: 'Nataraja - The Cosmic Dancer',
        content: 'Lord Shiva as Nataraja represents the eternal dance of creation and destruction...',
        image: '💃'
      },
      practiceSession: {
        title: 'Basic Aramandi Position',
        videoUrl: '/practice/aramandi-basics.mp4',
        duration: 20,
        instructions: 'Practice the fundamental sitting position of Bharatanatyam'
      },
      quiz: {
        question: 'What does "Aramandi" mean in Bharatanatyam?',
        options: ['Half-sitting', 'Standing', 'Jumping', 'Turning'],
        correct: 0,
        explanation: 'Aramandi means half-sitting, a fundamental position in Bharatanatyam.'
      }
    }
    // More modules...
  ]
};