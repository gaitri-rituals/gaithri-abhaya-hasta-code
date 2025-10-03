-- Enhanced Temple Services for Better Calendar/Booking Experience
-- This file adds more diverse services with different time slots and pricing

-- Add more services to existing temples for better booking variety
INSERT INTO temple_services (temple_id, name, description, duration, price, category, is_available) VALUES

-- Sri Venkateswara Temple (temple_id: 1) - Additional services
(1, 'Kalyanam Ceremony', 'Divine wedding ceremony for couples seeking blessings', 180, 5000.00, 'Special', true),
(1, 'Annadanam Sponsorship', 'Sponsor free meals for devotees', 30, 2500.00, 'Donation', true),
(1, 'Vahana Seva', 'Special deity procession service', 120, 1500.00, 'Special', true),
(1, 'Sahasranama Archana', 'Chanting of 1000 names with offerings', 90, 750.00, 'Personal', true),
(1, 'Pradakshina Seva', 'Guided circumambulation with prayers', 45, 200.00, 'Daily', true),

-- Meenakshi Amman Temple (temple_id: 2) - Additional services
(2, 'Meenakshi Kalyanam', 'Divine wedding ceremony of Meenakshi and Sundareswarar', 240, 7500.00, 'Special', true),
(2, 'Panchamrita Abhishekam', 'Special bathing with five sacred substances', 120, 2000.00, 'Special', true),
(2, 'Tamil Devotional Recital', 'Traditional Tamil hymns and prayers', 60, 500.00, 'Cultural', true),
(2, 'Flower Decoration Seva', 'Participate in deity flower decoration', 90, 300.00, 'Personal', true),
(2, 'Evening Aarti', 'Beautiful evening prayer ceremony', 45, 150.00, 'Daily', true),

-- Golden Temple (temple_id: 3) - Additional services
(3, 'Akhand Path Sponsorship', 'Sponsor continuous reading of Guru Granth Sahib', 2880, 5000.00, 'Special', true),
(3, 'Kirtan Seva', 'Participate in devotional singing', 120, 0.00, 'Daily', true),
(3, 'Guru Ka Langar Seva', 'Help in community kitchen preparation', 180, 0.00, 'Daily', true),
(3, 'Palki Sahib Seva', 'Participate in carrying the holy book', 60, 0.00, 'Special', true),
(3, 'Sukhasan Ceremony', 'Evening ceremony of putting Guru Granth Sahib to rest', 30, 0.00, 'Daily', true),

-- Jagannath Temple (temple_id: 4) - Additional services
(4, 'Rath Yatra Participation', 'Participate in the famous chariot festival', 360, 1000.00, 'Festival', true),
(4, 'Mahaprasad Seva', 'Sacred food offering and distribution', 90, 500.00, 'Daily', true),
(4, 'Snana Yatra', 'Holy bathing ceremony of the deities', 150, 2000.00, 'Special', true),
(4, 'Chandan Yatra', 'Sandalwood paste ceremony', 120, 800.00, 'Special', true),

-- Sample Temple (temple_id: 1) - Additional spiritual services
(1, 'Ganga Aarti Participation', 'Participate in the famous evening aarti', 60, 300.00, 'Daily', true),
(1, 'Maha Rudrabhishek', 'Grand worship with multiple priests', 180, 5000.00, 'Special', true),
(1, 'Sandhya Aarti', 'Evening prayer ceremony', 45, 200.00, 'Daily', true),
(1, 'Bhasma Aarti', 'Sacred ash ceremony (early morning)', 30, 1000.00, 'Special', true),

-- Tirumala Temple (temple_id: 2) - Additional services  
(2, 'Bhagavad Gita Discourse', 'Spiritual discourse on Bhagavad Gita', 90, 0.00, 'Educational', true),
(2, 'Devotional Kirtan', 'Devotional chanting session', 60, 0.00, 'Daily', true),
(2, 'Prasadam Distribution', 'Help in distributing sanctified food', 45, 0.00, 'Daily', true),
(2, 'Deity Dressing Seva', 'Participate in dressing the deities', 120, 500.00, 'Personal', true),
(2, 'Sandhya Aarti', 'Evening prayer with lamps', 30, 100.00, 'Daily', true),

-- Meenakshi Temple (temple_id: 3) - Additional services
(3, 'Special Abhishek', 'Sacred bathing ceremony', 60, 500.00, 'Special', true),
(3, 'Dhoop Aarti', 'Incense prayer ceremony', 30, 150.00, 'Daily', true),
(3, 'Devotional Recital', 'Chanting of sacred verses', 45, 100.00, 'Daily', true),
(3, 'Prasad Distribution', 'Help distribute blessed food to devotees', 60, 0.00, 'Daily', true),
(3, 'Special Prayers', 'Special prayers for devotees', 90, 300.00, 'Weekly', true),

-- Golden Temple (temple_id: 4) - Additional services
(4, 'Evening Chowki', 'Evening devotional singing', 240, 1000.00, 'Special', true),
(4, 'Evening Aarti', 'Prayer ceremony in the evening', 30, 200.00, 'Daily', true),
(4, 'Special Offering', 'Special offering ceremony', 45, 500.00, 'Personal', true),
(4, 'Premium Darshan', 'Quick darshan service', 60, 1500.00, 'Premium', true);

-- Add some seasonal/festival services
INSERT INTO temple_services (temple_id, name, description, duration, price, category, is_available) VALUES

-- Festival services
(1, 'Vaikunta Ekadashi Special', 'Special darshan during Vaikunta Ekadashi', 45, 500.00, 'Festival', true),
(2, 'Navaratri Celebration', 'Nine-day festival celebration participation', 120, 1000.00, 'Festival', true),
(3, 'Guru Nanak Jayanti', 'Birthday celebration of Guru Nanak', 180, 0.00, 'Festival', true),
(4, 'Jagannath Rath Yatra', 'Annual chariot festival participation', 300, 800.00, 'Festival', true),
(1, 'Maha Shivaratri', 'Great night of Shiva celebration', 360, 2000.00, 'Festival', true),
(2, 'Janmashtami Celebration', 'Krishna birthday celebration', 240, 500.00, 'Festival', true),
(3, 'Ram Navami Special', 'Lord Rama birthday celebration', 120, 300.00, 'Festival', true),
(4, 'Diwali Festival', 'Festival of lights celebration', 180, 1500.00, 'Festival', true);

-- Add time-specific services for better calendar testing
INSERT INTO temple_services (temple_id, name, description, duration, price, category, is_available) VALUES

-- Early morning services (4 AM - 7 AM)
(1, 'Brahma Muhurta Darshan', 'Pre-dawn spiritual darshan', 60, 800.00, 'Special', true),
(2, 'Early Morning Experience', 'Early morning temple experience', 90, 600.00, 'Special', true),
(3, 'Dawn Prayers', 'Dawn prayers and meditation', 75, 700.00, 'Special', true),

-- Late evening services (7 PM - 10 PM)
(1, 'Night Darshan', 'Peaceful evening darshan', 45, 400.00, 'Daily', true),
(2, 'Evening Bhajan', 'Devotional songs in the evening', 90, 0.00, 'Daily', true),
(3, 'Shej Aarti', 'Night prayer before temple closes', 30, 200.00, 'Daily', true),

-- Weekend special services
(2, 'Weekend Family Package', 'Special family darshan package', 120, 1200.00, 'Package', true),
(3, 'Weekend Langar Special', 'Extended community service on weekends', 240, 0.00, 'Weekend', true),
(4, 'Weekend Cultural Program', 'Cultural performances and prayers', 150, 300.00, 'Weekend', true);

-- Update existing services with better descriptions and realistic pricing
UPDATE temple_services SET 
    description = 'Premium darshan without waiting in regular queue, includes special seating',
    price = 500.00
WHERE name = 'Special Darshan' AND temple_id = 1;

UPDATE temple_services SET 
    description = 'Sacred ritual bathing of the deity with milk, honey, and sacred water',
    price = 1500.00
WHERE name = 'Abhishekam' AND temple_id = 2;

UPDATE temple_services SET 
    description = 'Participate in the community kitchen service, help prepare and serve meals',
    duration = 120
WHERE name = 'Langar Seva' AND temple_id = 3;

-- Add comments for better understanding
COMMENT ON COLUMN temple_services.category IS 'Service categories: Daily, Special, Festival, Personal, Educational, Cultural, Premium, Package, Weekend, Donation';
COMMENT ON COLUMN temple_services.duration IS 'Service duration in minutes';
COMMENT ON COLUMN temple_services.price IS 'Service price in INR (0.00 for free services)';