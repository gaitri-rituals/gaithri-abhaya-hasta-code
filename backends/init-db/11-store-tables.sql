-- Store Categories Table
CREATE TABLE IF NOT EXISTS store_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(100) DEFAULT 'Package',
    cover_image TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Store Products Table
CREATE TABLE IF NOT EXISTS store_products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES store_categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    images JSONB DEFAULT '[]',
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    sku VARCHAR(100) UNIQUE,
    stock INTEGER DEFAULT 0,
    min_order_quantity INTEGER DEFAULT 1,
    max_order_quantity INTEGER,
    weight DECIMAL(10, 2),
    dimensions JSONB,
    tags JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_store_products_category ON store_products(category_id);
CREATE INDEX IF NOT EXISTS idx_store_products_active ON store_products(is_active);
CREATE INDEX IF NOT EXISTS idx_store_products_featured ON store_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_store_categories_active ON store_categories(is_active);

-- Insert sample categories
INSERT INTO store_categories (name, description, icon, sort_order) VALUES
('Prasadam', 'Sacred offerings and blessed food', 'Cookie', 1),
('Pooja Items', 'Essential items for worship', 'Sparkles', 2),
('Books', 'Spiritual and religious literature', 'Book', 3),
('Clothing', 'Traditional and religious attire', 'Shirt', 4)
ON CONFLICT DO NOTHING;
