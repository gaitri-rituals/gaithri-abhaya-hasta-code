-- Temple Basket Seed Data for Calendar/Booking Functionality
-- This file provides sample data to demonstrate the booking system with dates and times

-- Insert temple_basket entries with diverse booking scenarios
INSERT INTO temple_basket (
    user_id, 
    temple_id, 
    service_id, 
    quantity, 
    booking_date, 
    booking_time, 
    special_requests, 
    devotee_details,
    booking_type,
    service_name,
    total_amount,
    booking_data
) VALUES
-- User 1 (Rajesh Kumar) bookings
(1, 1, 1, 1, '2024-12-15', '08:00:00', 'Please arrange for wheelchair accessibility', 
 '[{"name": "Rajesh Kumar", "age": 45, "relation": "self"}]', 
 'temple', 'Special Darshan', 300.00,
 '{"preferences": {"language": "english", "special_needs": "wheelchair"}, "contact": "9876543210"}'),

(1, 1, 2, 2, '2024-12-20', '06:30:00', 'Early morning preferred for family', 
 '[{"name": "Rajesh Kumar", "age": 45, "relation": "self"}, {"name": "Sunita Kumar", "age": 42, "relation": "wife"}]', 
 'temple', 'Suprabhatam', 1000.00,
 '{"preferences": {"language": "english"}, "family_size": 2}'),

-- User 2 (Priya Sharma) bookings
(2, 2, 4, 1, '2024-12-18', '10:00:00', 'First time visitor, please guide', 
 '[{"name": "Priya Sharma", "age": 28, "relation": "self"}]', 
 'temple', 'Abhishekam', 1000.00,
 '{"preferences": {"language": "tamil", "first_visit": true}, "contact": "9876543211"}'),

(2, 3, 6, 3, '2024-12-22', '12:00:00', 'Participating with friends for community service', 
 '[{"name": "Priya Sharma", "age": 28, "relation": "self"}, {"name": "Meera Devi", "age": 30, "relation": "friend"}, {"name": "Kavya Reddy", "age": 26, "relation": "friend"}]', 
 'temple', 'Langar Seva', 0.00,
 '{"preferences": {"language": "hindi"}, "group_size": 3, "service_type": "community"}'),

-- User 3 (Amit Patel) bookings
(3, 5, 8, 1, '2024-12-25', '07:00:00', 'Christmas day special prayers', 
 '[{"name": "Amit Patel", "age": 35, "relation": "self"}]', 
 'temple', 'Rudrabhishek', 1500.00,
 '{"preferences": {"language": "gujarati"}, "occasion": "christmas", "contact": "9876543212"}'),

(3, 4, 7, 1, '2024-12-16', '09:00:00', 'Regular weekly visit', 
 '[{"name": "Amit Patel", "age": 35, "relation": "self"}]', 
 'temple', 'Mangala Aarti', 150.00,
 '{"preferences": {"language": "hindi"}, "frequency": "weekly"}'),

-- User 4 (Sunita Devi) bookings
(4, 6, 9, 1, '2024-12-19', '06:00:00', 'Early morning darshan for peace', 
 '[{"name": "Sunita Devi", "age": 52, "relation": "self"}]', 
 'temple', 'Mangal Aarti', 200.00,
 '{"preferences": {"language": "hindi"}, "purpose": "peace_prayers"}'),

(4, 7, 10, 2, '2024-12-21', '11:00:00', 'Bringing elderly mother', 
 '[{"name": "Sunita Devi", "age": 52, "relation": "self"}, {"name": "Kamala Devi", "age": 75, "relation": "mother"}]', 
 'temple', 'Sai Darshan', 200.00,
 '{"preferences": {"language": "hindi"}, "special_needs": "elderly_care", "family_size": 2}'),

-- User 5 (Arjun Singh) bookings
(5, 8, 11, 1, '2024-12-30', '05:00:00', 'Year-end spiritual journey', 
 '[{"name": "Arjun Singh", "age": 29, "relation": "self"}]', 
 'temple', 'Mata Darshan', 0.00,
 '{"preferences": {"language": "punjabi"}, "occasion": "year_end", "trek_experience": "intermediate"}'),

-- Additional bookings for different dates and times to show calendar variety
(1, 2, 5, 1, '2024-12-17', '14:00:00', 'Afternoon visit after work', 
 '[{"name": "Rajesh Kumar", "age": 45, "relation": "self"}]', 
 'temple', 'Daily Puja', 100.00,
 '{"preferences": {"language": "english"}, "timing": "afternoon"}'),

(2, 1, 3, 1, '2024-12-23', '16:00:00', 'Evening prayers for family', 
 '[{"name": "Priya Sharma", "age": 28, "relation": "self"}]', 
 'temple', 'Archana', 250.00,
 '{"preferences": {"language": "tamil"}, "timing": "evening", "family_prayers": true}'),

(3, 3, 6, 1, '2024-12-24', '18:00:00', 'Christmas eve community service', 
 '[{"name": "Amit Patel", "age": 35, "relation": "self"}]', 
 'temple', 'Langar Seva', 0.00,
 '{"preferences": {"language": "hindi"}, "occasion": "christmas_eve", "service_type": "community"}'),

-- Weekend bookings
(4, 1, 1, 1, '2024-12-14', '10:30:00', 'Weekend family visit', 
 '[{"name": "Sunita Devi", "age": 52, "relation": "self"}]', 
 'temple', 'Special Darshan', 300.00,
 '{"preferences": {"language": "hindi"}, "timing": "weekend", "family_visit": true}'),

(5, 2, 4, 1, '2024-12-28', '08:30:00', 'Weekend spiritual experience', 
 '[{"name": "Arjun Singh", "age": 29, "relation": "self"}]', 
 'temple', 'Abhishekam', 1000.00,
 '{"preferences": {"language": "punjabi"}, "timing": "weekend"}'),

-- Early morning bookings
(1, 4, 7, 1, '2024-12-26', '05:30:00', 'Early morning meditation', 
 '[{"name": "Rajesh Kumar", "age": 45, "relation": "self"}]', 
 'temple', 'Mangala Aarti', 150.00,
 '{"preferences": {"language": "english"}, "purpose": "meditation", "timing": "early_morning"}'),

-- Late evening bookings
(2, 6, 9, 1, '2024-12-27', '19:00:00', 'Evening prayers after work', 
 '[{"name": "Priya Sharma", "age": 28, "relation": "self"}]', 
 'temple', 'Mangal Aarti', 200.00,
 '{"preferences": {"language": "tamil"}, "timing": "evening", "work_schedule": true}'),

-- Multiple service bookings for same user on different days
(3, 5, 8, 1, '2024-12-31', '06:00:00', 'New Year spiritual start', 
 '[{"name": "Amit Patel", "age": 35, "relation": "self"}]', 
 'temple', 'Rudrabhishek', 1500.00,
 '{"preferences": {"language": "gujarati"}, "occasion": "new_year", "spiritual_goal": "new_beginning"}');

-- Add some historical bookings (past dates) for testing
INSERT INTO temple_basket (
    user_id, 
    temple_id, 
    service_id, 
    quantity, 
    booking_date, 
    booking_time, 
    special_requests, 
    devotee_details,
    booking_type,
    service_name,
    total_amount,
    booking_data,
    created_at,
    updated_at
) VALUES
(1, 1, 1, 1, '2024-11-15', '08:00:00', 'Past booking for reference', 
 '[{"name": "Rajesh Kumar", "age": 45, "relation": "self"}]', 
 'temple', 'Special Darshan', 300.00,
 '{"preferences": {"language": "english"}, "status": "completed"}',
 '2024-11-10 10:00:00', '2024-11-10 10:00:00'),

(2, 2, 4, 1, '2024-11-20', '10:00:00', 'Completed abhishekam', 
 '[{"name": "Priya Sharma", "age": 28, "relation": "self"}]', 
 'temple', 'Abhishekam', 1000.00,
 '{"preferences": {"language": "tamil"}, "status": "completed"}',
 '2024-11-15 14:30:00', '2024-11-15 14:30:00');

-- Add comments for better understanding
COMMENT ON TABLE temple_basket IS 'Stores user temple service bookings with date/time scheduling';
COMMENT ON COLUMN temple_basket.booking_date IS 'Date when the service is scheduled';
COMMENT ON COLUMN temple_basket.booking_time IS 'Time when the service is scheduled';
COMMENT ON COLUMN temple_basket.devotee_details IS 'JSON array of devotees participating in the service';
COMMENT ON COLUMN temple_basket.booking_data IS 'Additional booking metadata including preferences and special requirements';