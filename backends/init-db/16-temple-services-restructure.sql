-- Temple Services Restructure for Dakshina, Abhisheka, and Archana
-- This migration updates the temple services to reflect actual temple workflow

-- First, let's update the existing temple_services table to support the new structure
ALTER TABLE temple_services ADD COLUMN IF NOT EXISTS service_type VARCHAR(50);
ALTER TABLE temple_services ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(50) DEFAULT 'fixed'; -- 'fixed', 'variable', 'package'
ALTER TABLE temple_services ADD COLUMN IF NOT EXISTS min_price DECIMAL(10, 2);
ALTER TABLE temple_services ADD COLUMN IF NOT EXISTS max_price DECIMAL(10, 2);
ALTER TABLE temple_services ADD COLUMN IF NOT EXISTS suggested_prices TEXT; -- JSON array for suggested amounts like [11, 21, 51]
ALTER TABLE temple_services ADD COLUMN IF NOT EXISTS requires_nakshatra BOOLEAN DEFAULT false;
ALTER TABLE temple_services ADD COLUMN IF NOT EXISTS requires_gothra BOOLEAN DEFAULT false;

-- Create service_pricing_options table for predefined amounts (like 11/-, 21/-, 51/-)
CREATE TABLE IF NOT EXISTS service_pricing_options (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES temple_services(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    label VARCHAR(100), -- e.g., "Basic Dakshina", "Premium Dakshina"
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Update bookings table to support nakshatra and gothra
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS nakshatra_id INTEGER REFERENCES nakshatras(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gothra_id INTEGER REFERENCES gothras(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS devotee_name VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS custom_amount DECIMAL(10, 2);

-- Clear existing services and add proper temple services
DELETE FROM temple_services;

-- Insert proper temple services for each temple
-- Sri Venkateswara Temple (temple_id: 1)
INSERT INTO temple_services (temple_id, name, description, price, duration, category, service_type, pricing_type, min_price, max_price, suggested_prices, requires_nakshatra, requires_gothra, is_available) VALUES

-- Dakshina Services
(1, 'Dakshina', 'Traditional offering to the deity and priests', 11.00, 5, 'Dakshina', 'dakshina', 'variable', 11.00, 10000.00, '[11, 21, 51, 101, 501]', false, false, true),

-- Archana Services  
(1, 'Sahasranama Archana', 'Chanting of 1000 names with your name and nakshatra', 250.00, 45, 'Archana', 'archana', 'fixed', 250.00, 250.00, null, true, true, true),
(1, 'Vishnu Sahasranama Archana', 'Special archana with Vishnu Sahasranama', 500.00, 60, 'Archana', 'archana', 'fixed', 500.00, 500.00, null, true, true, true),
(1, 'Lalitha Sahasranama Archana', 'Divine Mother archana with your details', 300.00, 45, 'Archana', 'archana', 'fixed', 300.00, 300.00, null, true, true, true),

-- Abhisheka Services
(1, 'Rudrabhisheka', 'Sacred bathing ceremony for Lord Shiva with milk, honey, and sacred substances', 1500.00, 90, 'Abhisheka', 'abhisheka', 'package', 1500.00, 1500.00, null, true, true, true),
(1, 'Panchamrita Abhisheka', 'Abhisheka with five sacred substances', 2000.00, 120, 'Abhisheka', 'abhisheka', 'package', 2000.00, 2000.00, null, true, true, true),
(1, 'Milk Abhisheka', 'Simple milk abhisheka for the deity', 800.00, 60, 'Abhisheka', 'abhisheka', 'package', 800.00, 800.00, null, true, true, true);

-- Meenakshi Amman Temple (temple_id: 2)
INSERT INTO temple_services (temple_id, name, description, price, duration, category, service_type, pricing_type, min_price, max_price, suggested_prices, requires_nakshatra, requires_gothra, is_available) VALUES

-- Dakshina Services
(2, 'Dakshina', 'Traditional offering to Goddess Meenakshi and Lord Sundareswarar', 11.00, 5, 'Dakshina', 'dakshina', 'variable', 11.00, 10000.00, '[11, 21, 51, 101, 501]', false, false, true),

-- Archana Services
(2, 'Meenakshi Archana', 'Special archana for Goddess Meenakshi with your name and star', 200.00, 30, 'Archana', 'archana', 'fixed', 200.00, 200.00, null, true, true, true),
(2, 'Sundareswarar Archana', 'Archana for Lord Sundareswarar', 200.00, 30, 'Archana', 'archana', 'fixed', 200.00, 200.00, null, true, true, true),
(2, 'Couple Archana', 'Combined archana for both deities', 350.00, 45, 'Archana', 'archana', 'fixed', 350.00, 350.00, null, true, true, true),

-- Abhisheka Services
(2, 'Meenakshi Abhisheka', 'Sacred abhisheka for Goddess Meenakshi', 1200.00, 75, 'Abhisheka', 'abhisheka', 'package', 1200.00, 1200.00, null, true, true, true),
(2, 'Sundareswarar Abhisheka', 'Abhisheka for Lord Sundareswarar', 1500.00, 90, 'Abhisheka', 'abhisheka', 'package', 1500.00, 1500.00, null, true, true, true),
(2, 'Divine Couple Abhisheka', 'Grand abhisheka for both deities', 2500.00, 120, 'Abhisheka', 'abhisheka', 'package', 2500.00, 2500.00, null, true, true, true);

-- Golden Temple (temple_id: 3) - Sikh temple, different structure
INSERT INTO temple_services (temple_id, name, description, price, duration, category, service_type, pricing_type, min_price, max_price, suggested_prices, requires_nakshatra, requires_gothra, is_available) VALUES

-- Dakshina/Donation Services
(3, 'Gurudwara Donation', 'Voluntary donation to the Gurudwara', 11.00, 5, 'Dakshina', 'dakshina', 'variable', 11.00, 10000.00, '[11, 21, 51, 101, 501]', false, false, true),
(3, 'Langar Seva Donation', 'Donation for community kitchen service', 100.00, 5, 'Dakshina', 'dakshina', 'variable', 100.00, 10000.00, '[100, 500, 1000]', false, false, true),

-- Prayer Services (no nakshatra/gothra for Sikh temple)
(3, 'Ardas Service', 'Special prayer service with your name', 0.00, 15, 'Archana', 'prayer', 'fixed', 0.00, 0.00, null, false, false, true),
(3, 'Akhand Path Sponsorship', 'Sponsor continuous reading of Guru Granth Sahib', 5000.00, 2880, 'Abhisheka', 'sponsorship', 'package', 5000.00, 5000.00, null, false, false, true);

-- Insert pricing options for Dakshina services
-- We'll use a subquery to get the correct service IDs
INSERT INTO service_pricing_options (service_id, amount, label, is_default) 
SELECT ts.id, 11.00, 'Basic Dakshina', true FROM temple_services ts WHERE ts.name = 'Dakshina' AND ts.temple_id = 1
UNION ALL
SELECT ts.id, 21.00, 'Standard Dakshina', false FROM temple_services ts WHERE ts.name = 'Dakshina' AND ts.temple_id = 1
UNION ALL
SELECT ts.id, 51.00, 'Premium Dakshina', false FROM temple_services ts WHERE ts.name = 'Dakshina' AND ts.temple_id = 1
UNION ALL
SELECT ts.id, 101.00, 'Special Dakshina', false FROM temple_services ts WHERE ts.name = 'Dakshina' AND ts.temple_id = 1
UNION ALL
SELECT ts.id, 501.00, 'Grand Dakshina', false FROM temple_services ts WHERE ts.name = 'Dakshina' AND ts.temple_id = 1
UNION ALL
-- For Meenakshi Dakshina  
SELECT ts.id, 11.00, 'Basic Dakshina', true FROM temple_services ts WHERE ts.name = 'Dakshina' AND ts.temple_id = 2
UNION ALL
SELECT ts.id, 21.00, 'Standard Dakshina', false FROM temple_services ts WHERE ts.name = 'Dakshina' AND ts.temple_id = 2
UNION ALL
SELECT ts.id, 51.00, 'Premium Dakshina', false FROM temple_services ts WHERE ts.name = 'Dakshina' AND ts.temple_id = 2
UNION ALL
SELECT ts.id, 101.00, 'Special Dakshina', false FROM temple_services ts WHERE ts.name = 'Dakshina' AND ts.temple_id = 2
UNION ALL
SELECT ts.id, 501.00, 'Grand Dakshina', false FROM temple_services ts WHERE ts.name = 'Dakshina' AND ts.temple_id = 2
UNION ALL
-- For Golden Temple Donation
SELECT ts.id, 11.00, 'Basic Donation', true FROM temple_services ts WHERE ts.name = 'Gurudwara Donation' AND ts.temple_id = 3
UNION ALL
SELECT ts.id, 21.00, 'Standard Donation', false FROM temple_services ts WHERE ts.name = 'Gurudwara Donation' AND ts.temple_id = 3
UNION ALL
SELECT ts.id, 51.00, 'Premium Donation', false FROM temple_services ts WHERE ts.name = 'Gurudwara Donation' AND ts.temple_id = 3
UNION ALL
SELECT ts.id, 101.00, 'Special Donation', false FROM temple_services ts WHERE ts.name = 'Gurudwara Donation' AND ts.temple_id = 3
UNION ALL
SELECT ts.id, 501.00, 'Grand Donation', false FROM temple_services ts WHERE ts.name = 'Gurudwara Donation' AND ts.temple_id = 3;