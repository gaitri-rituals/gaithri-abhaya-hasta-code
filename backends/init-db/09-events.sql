-- Drop existing tables if they exist
DROP TABLE IF EXISTS event_responses CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- Create events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  category_id INTEGER REFERENCES ritual_categories(id) ON DELETE SET NULL,
  category_name VARCHAR(255), -- Denormalized for display
  customer_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  location VARCHAR(255),
  estimated_budget DECIMAL(10, 2),
  actual_budget DECIMAL(10, 2),
  requirements TEXT,
  priority VARCHAR(20) DEFAULT 'normal', -- high, medium, normal, low
  status VARCHAR(50) DEFAULT 'needs_confirmation', -- needs_confirmation, pending, confirmed, in_preparation, completed, cancelled
  temple_id INTEGER REFERENCES temples(id) ON DELETE SET NULL, -- Assigned temple
  accepted_by VARCHAR(255), -- Temple name for display
  accepted_date TIMESTAMP WITH TIME ZONE,
  execution_date DATE,
  attendees INTEGER,
  rating DECIMAL(2, 1),
  review TEXT,
  feedback TEXT,
  created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create event_responses table (for temple responses to event requests)
CREATE TABLE event_responses (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  temple_id INTEGER REFERENCES temples(id) ON DELETE CASCADE,
  response_type VARCHAR(20) NOT NULL, -- accepted, declined, interested
  message TEXT,
  proposed_budget DECIMAL(10, 2),
  responded_by INTEGER, -- temple_user_id
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, temple_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_priority ON events(priority);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_temple ON events(temple_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_event_responses_event ON event_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_event_responses_temple ON event_responses(temple_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Seed sample event data
INSERT INTO events (title, description, event_date, category_name, customer_name, contact_person, phone, priority, status, estimated_budget, location, requirements) VALUES
('Annual Diwali Celebration', 'Grand Diwali festival with traditional lighting ceremony', '2024-11-01', 'Festival Celebrations', 'Priya Sharma', 'Rajesh Sharma', '+91 98765 43210', 'high', 'needs_confirmation', 50000, 'Mumbai', 'Special decorations, community meal for 200 people'),
('Wedding Ceremony Blessing', 'Traditional Hindu wedding ceremony with full rituals', '2024-12-15', 'Wedding Ceremonies', 'Anita Patel', 'Vikram Patel', '+91 87654 32109', 'medium', 'needs_confirmation', 75000, 'Delhi', 'Mandap setup, priest services, photography arrangements'),
('Ganesh Chaturthi Celebration', 'Traditional Ganesh festival with community participation', '2024-09-15', 'Festival Celebrations', 'Ramesh Kumar', 'Suresh Kumar', '+91 76543 21098', 'high', 'confirmed', 45000, 'Tirupati', NULL),
('Navratri Dance Festival', '9-day Navratri celebration with traditional dances', '2024-10-10', 'Festival Celebrations', 'Kavya Reddy', 'Arjun Reddy', '+91 65432 10987', 'medium', 'in_preparation', 60000, 'Madurai', NULL),
('Krishna Janmashtami Celebration', 'Grand Krishna birthday celebration with midnight ceremony', '2024-08-26', 'Festival Celebrations', 'Meera Gupta', 'Arun Gupta', '+91 54321 09876', 'high', 'completed', 55000, 'Amritsar', NULL),
('Raksha Bandhan Special Puja', 'Special brother-sister blessing ceremony', '2024-08-19', 'Festival Celebrations', 'Sita Rani', 'Ram Singh', '+91 43210 98765', 'normal', 'completed', 25000, 'Puri', NULL),
('Housewarming Ceremony', 'Griha Pravesh with Vastu Shanti puja', '2024-07-22', 'Housewarming (Griha Pravesh)', 'Deepak Shah', 'Nita Shah', '+91 32109 87654', 'medium', 'completed', 35000, 'Gujarat', NULL)
ON CONFLICT DO NOTHING;

-- Update executed events with temple assignments and ratings
UPDATE events SET temple_id = 3, accepted_by = 'Golden Temple', accepted_date = '2024-08-10', execution_date = '2024-08-26', attendees = 350, rating = 4.8, review = 'Absolutely beautiful ceremony! The temple staff was very professional and the arrangements were perfect.', feedback = 'Excellent organization, timely execution, great hospitality', actual_budget = 55000 WHERE title = 'Krishna Janmashtami Celebration';

UPDATE events SET temple_id = 4, accepted_by = 'Jagannath Temple', accepted_date = '2024-08-05', execution_date = '2024-08-19', attendees = 80, rating = 4.5, review = 'Very meaningful ceremony. The priests were knowledgeable and the atmosphere was divine.', feedback = 'Good service, could improve on time management', actual_budget = 25000 WHERE title = 'Raksha Bandhan Special Puja';

UPDATE events SET temple_id = 1, accepted_by = 'Somnath Temple', accepted_date = '2024-07-15', execution_date = '2024-07-22', attendees = 120, rating = 4.9, review = 'Perfect ceremony! Every ritual was explained beautifully and the priests were very accommodating.', feedback = 'Outstanding service, very satisfied with the arrangements', actual_budget = 35000 WHERE title = 'Housewarming Ceremony';

UPDATE events SET temple_id = 1, accepted_by = 'Sri Venkateswara Temple', accepted_date = '2024-09-01' WHERE title = 'Ganesh Chaturthi Celebration';

UPDATE events SET temple_id = 2, accepted_by = 'Meenakshi Temple', accepted_date = '2024-09-25' WHERE title = 'Navratri Dance Festival';
