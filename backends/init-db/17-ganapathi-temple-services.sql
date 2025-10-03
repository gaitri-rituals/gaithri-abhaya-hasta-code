-- Add Abhisheka and Archana services for Ganapathi Temple (temple_id: 25)
-- This script adds proper services for the Ganapathi Temple to test the frontend functionality

INSERT INTO temple_services (temple_id, name, description, price, duration, category, service_type, pricing_type, min_price, max_price, suggested_prices, requires_nakshatra, requires_gothra, is_available) VALUES

-- Archana Services for Ganapathi Temple
(25, 'Ganapathi Archana', 'Special archana for Lord Ganapathi with your name and nakshatra', 150.00, 30, 'Archana', 'archana', 'fixed', 150.00, 150.00, null, true, true, true),
(25, 'Vinayaka Sahasranama Archana', 'Chanting of 1000 names of Lord Ganapathi', 300.00, 45, 'Archana', 'archana', 'fixed', 300.00, 300.00, null, true, true, true),
(25, 'Sankatahara Chaturthi Archana', 'Special archana for removing obstacles', 200.00, 35, 'Archana', 'archana', 'fixed', 200.00, 200.00, null, true, true, true),

-- Abhisheka Services for Ganapathi Temple
(25, 'Ganapathi Abhisheka', 'Sacred bathing ceremony for Lord Ganapathi with milk and honey', 1000.00, 60, 'Abhisheka', 'abhisheka', 'package', 1000.00, 1000.00, null, true, true, true),
(25, 'Panchamrita Abhisheka', 'Abhisheka with five sacred substances for Ganapathi', 1500.00, 75, 'Abhisheka', 'abhisheka', 'package', 1500.00, 1500.00, null, true, true, true),
(25, 'Coconut Water Abhisheka', 'Traditional coconut water abhisheka for Ganapathi', 800.00, 45, 'Abhisheka', 'abhisheka', 'package', 800.00, 800.00, null, true, true, true),
(25, 'Modaka Abhisheka', 'Special abhisheka with offering of modakas', 1200.00, 90, 'Abhisheka', 'abhisheka', 'package', 1200.00, 1200.00, null, true, true, true);