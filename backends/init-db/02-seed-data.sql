-- Connect to unified temple ecosystem database
\c temple_ecosystem_db;

-- Insert sample temples (Master data used by both Abhaya Hasta and Gaithri)
INSERT INTO temples (name, description, address, city, state, phone, email, primary_deity, latitude, longitude, is_active, is_featured, created_at, updated_at) VALUES
('Sri Venkateswara Temple', 'One of the most famous temples dedicated to Lord Venkateswara (Balaji), known for its spiritual significance and architectural beauty.', 'Tirumala Hills', 'Tirupati', 'Andhra Pradesh', '8772339999', 'info@tirumala.org', 'Venkateswara', 13.6833, 79.3167, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Meenakshi Amman Temple', 'Historic temple complex dedicated to Goddess Meenakshi and Lord Sundareswarar, famous for its stunning Dravidian architecture.', 'Madurai Main', 'Madurai', 'Tamil Nadu', '4522345678', 'contact@meenakshi.org', 'Meenakshi', 9.9195, 78.1194, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Golden Temple (Harmandir Sahib)', 'The holiest Gurdwara and the most important pilgrimage site of Sikhism, known for its golden dome and serene atmosphere.', 'Golden Temple Road', 'Amritsar', 'Punjab', '1832255555', 'info@goldentemple.org', 'Guru Granth Sahib', 31.6200, 74.8765, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Jagannath Temple', 'Ancient temple dedicated to Lord Jagannath, famous for the annual Rath Yatra festival.', 'Temple Road', 'Puri', 'Odisha', '6752222222', 'admin@jagannath.org', 'Jagannath', 19.8135, 85.8312, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Somnath Temple', 'One of the twelve Jyotirlinga shrines of Shiva, rebuilt multiple times throughout history.', 'Somnath Temple Road', 'Somnath', 'Gujarat', '2876231777', 'contact@somnath.org', 'Shiva', 20.8880, 70.4017, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ISKCON Temple Delhi', 'Modern temple complex dedicated to Krishna consciousness and spiritual learning.', 'Sant Nagar Main Road', 'New Delhi', 'Delhi', '1143340000', 'delhi@iskcon.org', 'Krishna', 28.5562, 77.2410, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Shirdi Sai Baba Temple', 'Sacred shrine of Sai Baba, attracting millions of devotees worldwide.', 'Shirdi Village', 'Shirdi', 'Maharashtra', '2423258888', 'info@sai.org.in', 'Sai Baba', 19.7645, 74.4762, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Vaishno Devi Temple', 'Holy cave shrine of Mata Vaishno Devi in the Trikuta Mountains.', 'Bhawan', 'Katra', 'Jammu and Kashmir', '1992232888', 'info@maavaishnodevi.org', 'Vaishno Devi', 33.0302, 74.9476, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert temple images
INSERT INTO temple_images (temple_id, url, alt_text, is_primary) VALUES
(1, 'https://example.com/tirupati-main.jpg', 'Main view of Tirupati temple', true),
(1, 'https://example.com/tirupati-gopuram.jpg', 'Temple gopuram', false),
(2, 'https://example.com/meenakshi-main.jpg', 'Meenakshi temple complex', true),
(2, 'https://example.com/meenakshi-tower.jpg', 'Temple tower with sculptures', false),
(3, 'https://example.com/golden-temple-main.jpg', 'Golden Temple with reflection', true),
(4, 'https://example.com/jagannath-main.jpg', 'Jagannath temple main entrance', true),
(5, 'https://example.com/somnath-main.jpg', 'Somnath temple by the sea', true),
(6, 'https://example.com/iskcon-delhi-main.jpg', 'ISKCON temple Delhi complex', true),
(7, 'https://example.com/shirdi-main.jpg', 'Shirdi Sai Baba temple', true),
(8, 'https://example.com/vaishno-devi-main.jpg', 'Vaishno Devi cave entrance', true);

-- Insert temple timings
INSERT INTO temple_timings (temple_id, day_of_week, open_time, close_time, is_holiday) VALUES
-- Tirupati Temple
(1, 0, '06:00', '21:00', false),
(1, 1, '06:00', '21:00', false),
(1, 2, '06:00', '21:00', false),
(1, 3, '06:00', '21:00', false),
(1, 4, '06:00', '21:00', false),
(1, 5, '06:00', '21:00', false),
(1, 6, '06:00', '21:00', false),
-- Meenakshi Temple
(2, 0, '05:00', '22:00', false),
(2, 1, '05:00', '22:00', false),
(2, 2, '05:00', '22:00', false),
(2, 3, '05:00', '22:00', false),
(2, 4, '05:00', '22:00', false),
(2, 5, '05:00', '22:00', false),
(2, 6, '05:00', '22:00', false),
-- Golden Temple (24/7)
(3, 0, '00:00', '23:59', false),
(3, 1, '00:00', '23:59', false),
(3, 2, '00:00', '23:59', false),
(3, 3, '00:00', '23:59', false),
(3, 4, '00:00', '23:59', false),
(3, 5, '00:00', '23:59', false),
(3, 6, '00:00', '23:59', false);

-- Insert temple services (Used by both Abhaya Hasta consumers and Gaithri management)
INSERT INTO temple_services (temple_id, name, description, duration, price, category, is_available) VALUES
(1, 'Special Darshan', 'Quick darshan without waiting in regular queue', 30, 300.00, 'Special', true),
(1, 'Suprabhatam', 'Early morning special prayers', 60, 500.00, 'Daily', true),
(1, 'Archana', 'Special worship with name chanting', 45, 250.00, 'Personal', true),
(2, 'Abhishekam', 'Sacred bathing ritual for the deity', 90, 1000.00, 'Special', true),
(2, 'Daily Puja', 'Regular worship service', 45, 100.00, 'Daily', true),
(3, 'Langar Seva', 'Community kitchen service participation', 60, 0.00, 'Daily', true),
(4, 'Mangala Aarti', 'Morning prayer ceremony', 30, 150.00, 'Daily', true),
(5, 'Rudrabhishek', 'Special Shiva worship', 120, 1500.00, 'Special', true),
(6, 'Mangal Aarti', 'Morning worship of Radha Krishna', 45, 200.00, 'Daily', true),
(7, 'Sai Darshan', 'Special darshan of Sai Baba', 30, 100.00, 'Daily', true),
(8, 'Mata Darshan', 'Sacred darshan in the holy cave', 60, 0.00, 'Special', true);

-- Insert sample users
INSERT INTO users (name, email, phone, password, role) VALUES
('Rajesh Kumar', 'rajesh@email.com', '9876543210', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('Priya Sharma', 'priya@email.com', '9876543211', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('Amit Patel', 'amit@email.com', '9876543212', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('Sunita Devi', 'sunita@email.com', '9876543213', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('Arjun Singh', 'arjun@email.com', '9876543214', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('Super Admin', 'admin@temples.org', '9999999999', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Tirupati Admin', 'admin@tirupati.org', '8772339998', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Meenakshi Staff', 'staff@meenakshi.org', '4522345677', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Golden Temple Admin', 'admin@goldentemple.org', '1832255554', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert user preferences
INSERT INTO user_preferences (user_id, language, notifications_enabled) VALUES
(1, 'en', true),
(2, 'ta', true),
(3, 'hi', false),
(4, 'hi', true),
(5, 'en', true);

-- Insert addresses
INSERT INTO addresses (user_id, type, label, street, city, state, zip_code, is_default) VALUES
(1, 'home', 'Home', 'MG Road 123', 'Bangalore', 'Karnataka', '560001', true),
(2, 'home', 'Residence', 'Anna Nagar 45', 'Chennai', 'Tamil Nadu', '600040', true),
(3, 'work', 'Office', 'Bandra West 78', 'Mumbai', 'Maharashtra', '400050', true),
(4, 'home', 'Home Address', 'Civil Lines 12', 'Delhi', 'Delhi', '110054', true),
(5, 'home', 'House', 'Model Town 67', 'Ludhiana', 'Punjab', '141002', true);

-- Insert bookings
INSERT INTO bookings (user_id, temple_id, service_id, booking_date, booking_time, status, amount, payment_status) VALUES
(1, 1, 1, '2024-10-15', '08:00', 'pending', 300.00, 'pending'),
(2, 2, 4, '2024-10-18', '06:30', 'confirmed', 1000.00, 'completed'),
(3, 3, 6, '2024-10-20', '12:00', 'completed', 0.00, 'completed'),
(4, 7, 10, '2024-10-22', '07:00', 'pending', 100.00, 'pending'),
(5, 8, 11, '2024-10-25', '05:00', 'pending', 0.00, 'pending');

-- Insert temple events
INSERT INTO temple_events (temple_id, name, description, start_date, end_date, start_time, end_time) VALUES
(1, 'Vaikunta Ekadashi', 'Special festival celebrated with grand ceremonies', '2024-12-21', '2024-12-21', '06:00', '18:00'),
(2, 'Chithirai Festival', 'Annual celebration of divine wedding', '2024-04-15', '2024-04-15', '05:00', '15:00'),
(3, 'Guru Nanak Jayanti', 'Celebration of Guru Nanak birth anniversary', '2024-11-15', '2024-11-15', '04:00', '12:00'),
(4, 'Rath Yatra', 'Annual chariot festival', '2024-07-07', '2024-07-07', '06:00', '18:00');

-- Insert temple staff
INSERT INTO temple_staff (temple_id, name, role, phone, email, is_active) VALUES
(1, 'Ravi Kumar', 'Priest', '9876543210', 'ravi@temple.com', true),
(2, 'Lakshmi Devi', 'Administrator', '9876543211', 'lakshmi@temple.com', true),
(3, 'Gurpreet Singh', 'Sevadar', '9876543212', 'gurpreet@temple.com', true);

-- Insert temple classes
INSERT INTO temple_classes (temple_id, name, description, instructor, schedule, price, capacity, is_active) VALUES
(1, 'Bhagavad Gita Study', 'Weekly study of Bhagavad Gita verses', 'Swami Vishwananda', 'Every Saturday 6:00 PM', 0.00, 50, true),
(2, 'Tamil Devotional Songs', 'Learn traditional Tamil devotional songs', 'Smt. Kamala Devi', 'Every Tuesday 5:00 PM', 200.00, 30, true),
(3, 'Sikh History', 'Learn about Sikh Gurus and history', 'Giani Harbhajan Singh', 'Every Sunday 10:00 AM', 0.00, 100, true),
(6, 'Kirtan Classes', 'Learn devotional singing and instruments', 'Das Gopal', 'Every Thursday 7:00 PM', 300.00, 25, true);

-- Insert class enrollments
INSERT INTO class_enrollments (class_id, user_id, enrollment_date, status, payment_status) VALUES
(1, 1, '2024-10-01', 'active', 'completed'),
(2, 2, '2024-10-01', 'active', 'completed'),
(3, 3, '2024-10-01', 'active', 'completed');

-- Insert reviews
INSERT INTO reviews (user_id, temple_id, rating, comment, is_approved) VALUES
(1, 1, 5, 'Absolutely divine experience! The darshan was well organized and the temple is beautifully maintained.', true),
(2, 2, 5, 'The architectural beauty is breathtaking. The abhishekam was a spiritual experience.', true),
(3, 3, 5, 'The langar seva was heartwarming. Such a peaceful and welcoming place.', true),
(4, 7, 4, 'Very peaceful temple. The darshan queue was well managed.', true),
(5, 8, 5, 'Challenging trek but worth every step. The spiritual energy is incredible.', true);

-- Insert subscriptions
INSERT INTO subscriptions (user_id, plan_name, start_date, end_date, status, payment_status) VALUES
(1, 'Monthly Special Darshan', '2024-10-01', '2024-11-01', 'active', 'completed'),
(2, 'Weekly Daily Puja', '2024-10-01', '2024-11-01', 'active', 'completed');

-- Insert payment transactions
INSERT INTO payment_transactions (user_id, amount, currency, payment_method, status, transaction_id, reference_type, reference_id) VALUES
(1, 300.00, 'INR', 'razorpay', 'completed', 'pay_123456', 'booking', 1),
(2, 1000.00, 'INR', 'upi', 'completed', 'pay_234567', 'booking', 2),
(3, 0.00, 'INR', 'cash', 'completed', 'pay_345678', 'booking', 3),
(4, 100.00, 'INR', 'razorpay', 'pending', 'pay_456789', 'booking', 4),
(5, 0.00, 'INR', 'cash', 'pending', 'pay_567890', 'booking', 5);

-- Insert audit logs
INSERT INTO audit_logs (user_id, action, table_name, record_id, changes, ip_address) VALUES
(6, 'create', 'temples', 1, '{"name": "Sri Venkateswara Temple", "is_active": true}', '192.168.1.1'),
(7, 'update', 'temple_services', 1, '{"price": {"old": 250.00, "new": 300.00}}', '192.168.1.2'),
(8, 'delete', 'temple_events', 1, '{"id": 1, "name": "Old Event"}', '192.168.1.3');
