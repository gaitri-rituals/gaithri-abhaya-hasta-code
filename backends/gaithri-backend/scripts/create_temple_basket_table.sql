-- Create temple_basket table for storing user's temple service basket items
CREATE TABLE IF NOT EXISTS temple_basket (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    temple_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    booking_date DATE,
    booking_time TIME,
    special_requests TEXT,
    devotee_details JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints (assuming these tables exist)
    CONSTRAINT fk_temple_basket_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_temple_basket_temple FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE CASCADE,
    CONSTRAINT fk_temple_basket_service FOREIGN KEY (service_id) REFERENCES temple_services(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate service entries for same user
    CONSTRAINT unique_user_service UNIQUE (user_id, service_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_temple_basket_user_id ON temple_basket(user_id);
CREATE INDEX IF NOT EXISTS idx_temple_basket_temple_id ON temple_basket(temple_id);
CREATE INDEX IF NOT EXISTS idx_temple_basket_service_id ON temple_basket(service_id);
CREATE INDEX IF NOT EXISTS idx_temple_basket_created_at ON temple_basket(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_temple_basket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_temple_basket_updated_at
    BEFORE UPDATE ON temple_basket
    FOR EACH ROW
    EXECUTE FUNCTION update_temple_basket_updated_at();