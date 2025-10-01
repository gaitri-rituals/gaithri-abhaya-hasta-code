-- Seed data for authentication system
-- Note: All passwords are hashed using bcrypt with salt rounds 12
-- Default password for all users: "password123" (change in production)

-- Insert Super Admin users (admin_users table)
INSERT INTO admin_users (name, email, password_hash, role, temple_id, is_active) VALUES
('Super Admin', 'admin@temples.org', '$2b$12$LQv3c1yqBwEHXk.JHd3HHOxz9roIFzIx9pMjbykuaAy/y6CCXU4nW', 'super-admin', NULL, true),
('System Administrator', 'sysadmin@temples.org', '$2b$12$LQv3c1yqBwEHXk.JHd3HHOxz9roIFzIx9pMjbykuaAy/y6CCXU4nW', 'admin', NULL, true),
('Temple Coordinator', 'coordinator@temples.org', '$2b$12$LQv3c1yqBwEHXk.JHd3HHOxz9roIFzIx9pMjbykuaAy/y6CCXU4nW', 'temple-coordinator', 1, true)
ON CONFLICT (email) DO NOTHING;

-- Insert Temple Users (temple_users table)
INSERT INTO temple_users (temple_id, name, email, password_hash, role, is_active, is_primary_contact, permissions) VALUES
(1, 'Tirumala Admin', 'admin@tirumala.org', '$2b$12$LQv3c1yqBwEHXk.JHd3HHOxz9roIFzIx9pMjbykuaAy/y6CCXU4nW', 'temple_admin', true, true, '{"manage_bookings": true, "manage_services": true, "view_reports": true}'),
(1, 'Tirumala Manager', 'manager@tirumala.org', '$2b$12$LQv3c1yqBwEHXk.JHd3HHOxz9roIFzIx9pMjbykuaAy/y6CCXU4nW', 'temple_manager', true, false, '{"manage_bookings": true, "view_reports": true}'),
(2, 'Meenakshi Admin', 'admin@meenakshi.org', '$2b$12$LQv3c1yqBwEHXk.JHd3HHOxz9roIFzIx9pMjbykuaAy/y6CCXU4nW', 'temple_admin', true, true, '{"manage_bookings": true, "manage_services": true, "view_reports": true}'),
(3, 'Golden Temple Admin', 'admin@goldentemple.org', '$2b$12$LQv3c1yqBwEHXk.JHd3HHOxz9roIFzIx9pMjbykuaAy/y6CCXU4nW', 'temple_admin', true, true, '{"manage_bookings": true, "manage_services": true, "view_reports": true}'),
(4, 'Jagannath Admin', 'admin@jagannath.org', '$2b$12$LQv3c1yqBwEHXk.JHd3HHOxz9roIFzIx9pMjbykuaAy/y6CCXU4nW', 'temple_admin', true, true, '{"manage_bookings": true, "manage_services": true, "view_reports": true}')
ON CONFLICT (email) DO NOTHING;

-- Insert Vendor Users (vendor_users table)
INSERT INTO vendor_users (vendor_id, name, email, password_hash, role, is_active, permissions, notification_preferences) VALUES
(1, 'Catering Manager', 'manager@sacredcatering.com', '$2b$12$LQv3c1yqBwEHXk.JHd3HHOxz9roIFzIx9pMjbykuaAy/y6CCXU4nW', 'vendor_admin', true, '{"manage_services": true, "respond_to_events": true, "view_analytics": true}', '{"email": true, "sms": true, "push": true}'),
(2, 'Flower Decorator', 'admin@divineflowers.com', '$2b$12$LQv3c1yqBwEHXk.JHd3HHOxz9roIFzIx9pMjbykuaAy/y6CCXU4nW', 'vendor_admin', true, '{"manage_services": true, "respond_to_events": true, "view_analytics": true}', '{"email": true, "sms": false, "push": true}'),
(3, 'Music Director', 'director@templemusic.com', '$2b$12$LQv3c1yqBwEHXk.JHd3HHOxz9roIFzIx9pMjbykuaAy/y6CCXU4nW', 'vendor_admin', true, '{"manage_services": true, "respond_to_events": true, "view_analytics": true}', '{"email": true, "sms": true, "push": false}'),
(4, 'Photography Manager', 'admin@holymoments.com', '$2b$12$LQv3c1yqBwEHXk.JHd3HHOxz9roIFzIx9pMjbykuaAy/y6CCXU4nW', 'vendor_admin', true, '{"manage_services": true, "respond_to_events": true, "view_analytics": true}', '{"email": true, "sms": false, "push": true}')
ON CONFLICT (email) DO NOTHING;

-- Insert Vendor Services
INSERT INTO vendor_services (vendor_id, service_category, service_name, description, price_range, is_active) VALUES
-- Sacred Catering Services
(1, 'catering', 'Prasadam Catering', 'Traditional temple food preparation and serving', 'premium', true),
(1, 'catering', 'Festival Feast', 'Large scale festival food arrangements', 'luxury', true),
(1, 'catering', 'Daily Meals', 'Regular temple meal services', 'budget', true),

-- Divine Flowers
(2, 'flowers', 'Deity Decoration', 'Fresh flower arrangements for deities', 'premium', true),
(2, 'flowers', 'Festival Garlands', 'Special garlands for festivals', 'luxury', true),
(2, 'flowers', 'Daily Offerings', 'Regular flower offerings', 'budget', true),

-- Temple Music Group
(3, 'music', 'Classical Concerts', 'Traditional classical music performances', 'luxury', true),
(3, 'music', 'Devotional Songs', 'Bhajan and kirtan sessions', 'premium', true),
(3, 'music', 'Festival Music', 'Special music for festivals', 'premium', true),

-- Holy Moments Photography
(4, 'photography', 'Event Photography', 'Professional temple event photography', 'premium', true),
(4, 'photography', 'Festival Documentation', 'Complete festival coverage', 'luxury', true),
(4, 'photography', 'Portrait Sessions', 'Individual and family portraits', 'budget', true);

-- Insert sample vendor notifications for testing
INSERT INTO vendor_notifications (vendor_id, temple_id, notification_type, title, message, priority, status, metadata) VALUES
(1, 1, 'event_delegation', 'Catering Request for Brahmotsavam', 'Sri Venkateswara Temple requires catering services for the upcoming Brahmotsavam festival. Expected 5000+ devotees.', 'high', 'unread', '{"event_date": "2024-03-15", "expected_attendees": 5000, "duration": "7 days"}'),
(2, 1, 'event_delegation', 'Flower Decoration for Daily Puja', 'Daily flower decoration services needed for morning and evening pujas.', 'medium', 'unread', '{"service_type": "daily", "start_date": "2024-02-01", "duration": "ongoing"}'),
(3, 2, 'event_delegation', 'Music Performance for Meenakshi Kalyanam', 'Traditional music performance required for the divine wedding ceremony.', 'high', 'read', '{"event_date": "2024-04-10", "performance_duration": "3 hours", "style": "classical"}'),
(4, 3, 'event_delegation', 'Photography for Guru Nanak Jayanti', 'Professional photography services needed for Guru Nanak Jayanti celebrations.', 'medium', 'acknowledged', '{"event_date": "2024-11-15", "coverage_type": "full_event", "deliverables": "photos_and_videos"}')