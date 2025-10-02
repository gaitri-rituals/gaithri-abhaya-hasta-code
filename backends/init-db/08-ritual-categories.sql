-- Drop existing tables if they exist
DROP TABLE IF EXISTS temple_category_adoptions CASCADE;
DROP TABLE IF EXISTS ritual_packages CASCADE;
DROP TABLE IF EXISTS ritual_categories CASCADE;

-- Create ritual_categories table
CREATE TABLE ritual_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'Basic', -- Basic, Advanced, Premium
  status VARCHAR(50) DEFAULT 'active', -- active, draft, review
  icon VARCHAR(100),
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ritual_packages table
CREATE TABLE ritual_packages (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES ritual_categories(id) ON DELETE CASCADE,
  temple_id INTEGER REFERENCES temples(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  duration INTEGER, -- in minutes
  items JSONB DEFAULT '[]', -- Array of items included in package
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create temple_category_adoptions table
CREATE TABLE temple_category_adoptions (
  id SERIAL PRIMARY KEY,
  temple_id INTEGER REFERENCES temples(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES ritual_categories(id) ON DELETE CASCADE,
  adopted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(temple_id, category_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ritual_categories_status ON ritual_categories(status);
CREATE INDEX IF NOT EXISTS idx_ritual_categories_subscription ON ritual_categories(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_ritual_packages_category ON ritual_packages(category_id);
CREATE INDEX IF NOT EXISTS idx_ritual_packages_temple ON ritual_packages(temple_id);
CREATE INDEX IF NOT EXISTS idx_temple_category_adoptions_temple ON temple_category_adoptions(temple_id);
CREATE INDEX IF NOT EXISTS idx_temple_category_adoptions_category ON temple_category_adoptions(category_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_ritual_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ritual_categories_updated_at
  BEFORE UPDATE ON ritual_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_ritual_categories_updated_at();

CREATE OR REPLACE FUNCTION update_ritual_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ritual_packages_updated_at
  BEFORE UPDATE ON ritual_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_ritual_packages_updated_at();

-- Seed initial ritual categories
INSERT INTO ritual_categories (name, description, subscription_tier, status) VALUES
('Housewarming (Griha Pravesh)', 'Sacred ceremonies for new home blessings', 'Basic', 'active'),
('Naming Ceremony (Namkaran)', 'Traditional baby naming rituals', 'Basic', 'active'),
('Homas & Havans', 'Fire sacrifices and sacred rituals', 'Advanced', 'active'),
('Wedding Ceremonies', 'Complete marriage rituals and blessings', 'Premium', 'active'),
('Pitra Paksha', 'Ancestral worship and remembrance rituals', 'Advanced', 'active'),
('Festival Celebrations', 'Major Hindu festival observances', 'Premium', 'active'),
('Therapeutic Pujas', 'Healing and wellness rituals', 'Advanced', 'draft'),
('Corporate Events', 'Business inauguration and success rituals', 'Basic', 'review')
ON CONFLICT DO NOTHING;

-- Create some sample packages for temples
INSERT INTO ritual_packages (category_id, temple_id, name, description, price, duration, items) VALUES
(1, 1, 'Basic Griha Pravesh', 'Essential housewarming ceremony', 5000.00, 120, '["Ganapathi Puja", "Vastu Puja", "Prasad Distribution"]'),
(1, 1, 'Premium Griha Pravesh', 'Complete housewarming with all rituals', 15000.00, 240, '["Ganapathi Puja", "Vastu Puja", "Navagraha Puja", "Homa", "Prasad Distribution"]'),
(2, 1, 'Namkaran Package', 'Traditional naming ceremony', 3000.00, 90, '["Ganapathi Puja", "Naming Ritual", "Prasad"]'),
(3, 2, 'Basic Homa', 'Simple fire ritual', 2000.00, 60, '["Fire Ritual", "Mantras", "Prasad"]'),
(3, 2, 'Extended Homa', 'Detailed fire ceremony with multiple offerings', 8000.00, 180, '["Fire Ritual", "108 Offerings", "Mantras", "Prasad"]')
ON CONFLICT DO NOTHING;

-- Create sample temple adoptions
INSERT INTO temple_category_adoptions (temple_id, category_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6),
(2, 1), (2, 2), (2, 3), (2, 4), (2, 6),
(3, 1), (3, 3), (3, 6),
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6)
ON CONFLICT (temple_id, category_id) DO NOTHING;
