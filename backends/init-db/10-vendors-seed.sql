-- Seed vendor data for testing
INSERT INTO vendors (temple_id, name, contact_person, phone, email, address, category, rating) VALUES
(1, 'Vedic Teachers Academy', 'Dr. Ramesh Kumar', '+91 98765 43210', 'ramesh@vedicteachers.com', '123 Temple Street, Tirupati', 'teacher', 4.8),
(1, 'Sanskrit Learning Center', 'Prof. Lakshmi Devi', '+91 98765 43211', 'lakshmi@sanskritcenter.com', '456 Education Lane, Tirupati', 'teacher', 4.9),
(2, 'Sacred Catering Services', 'Suresh Babu', '+91 98765 43212', 'suresh@sacredcatering.com', '789 Food Street, Madurai', 'caterer', 4.5),
(2, 'Divine Feast Caterers', 'Meera Sharma', '+91 98765 43213', 'meera@divinefeast.com', '321 Kitchen Road, Madurai', 'caterer', 4.7),
(3, 'Bloom & Blossom Decorators', 'Raj Kumar', '+91 98765 43214', 'raj@bloomandblossom.com', '567 Flower Market, Amritsar', 'decorator', 4.6),
(3, 'Divine Flowers & Decor', 'Priya Singh', '+91 98765 43215', 'priya@divineflowers.com', '890 Garden Street, Amritsar', 'decorator', 4.8),
(4, 'Sacred Ritual Kits', 'Arun Patel', '+91 98765 43216', 'arun@sacredkits.com', '234 Market Plaza, Puri', 'kit-provider', 4.4),
(4, 'Puja Essentials Store', 'Kavya Reddy', '+91 98765 43217', 'kavya@pujaessentials.com', '678 Temple Market, Puri', 'kit-provider', 4.5),
(1, 'Custom Temple Services', 'Vikram Gupta', '+91 98765 43218', 'vikram@customservices.com', '901 Service Lane, Tirupati', 'custom', 4.3),
(2, 'Holy Event Organizers', 'Deepa Shah', '+91 98765 43219', 'deepa@holyevents.com', '345 Event Street, Madurai', 'custom', 4.6)
ON CONFLICT DO NOTHING;
