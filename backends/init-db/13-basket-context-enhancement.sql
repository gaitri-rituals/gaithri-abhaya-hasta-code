-- Enhance temple_basket table to support both temple and puja booking contexts
-- This migration adds context-aware fields to handle different booking flows

-- Add new columns for context-aware basket functionality
ALTER TABLE temple_basket 
ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) DEFAULT 'temple',
ADD COLUMN IF NOT EXISTS booking_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS service_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

-- Update existing records to have proper booking_type
UPDATE temple_basket SET booking_type = 'temple' WHERE booking_type IS NULL;

-- Make booking_type NOT NULL after setting defaults
ALTER TABLE temple_basket ALTER COLUMN booking_type SET NOT NULL;

-- Add check constraint for booking_type
ALTER TABLE temple_basket 
ADD CONSTRAINT chk_booking_type 
CHECK (booking_type IN ('temple', 'puja'));

-- Create index for booking_type for better query performance
CREATE INDEX IF NOT EXISTS idx_temple_basket_booking_type ON temple_basket(booking_type);

-- Remove the unique constraint that prevents multiple services per user
-- This is needed because users should be able to add multiple different services
ALTER TABLE temple_basket DROP CONSTRAINT IF EXISTS unique_user_service;

-- Add a new constraint that allows multiple entries but prevents exact duplicates
-- For temple bookings: user_id + service_id + booking_date + booking_time should be unique
-- For puja bookings: we'll handle uniqueness in application logic due to complex data
CREATE UNIQUE INDEX IF NOT EXISTS idx_temple_basket_unique_temple_booking 
ON temple_basket(user_id, service_id, booking_date, booking_time) 
WHERE booking_type = 'temple';

-- Add comments for documentation
COMMENT ON COLUMN temple_basket.booking_type IS 'Type of booking: temple (simple temple services) or puja (complex home puja services)';
COMMENT ON COLUMN temple_basket.booking_data IS 'JSON data containing booking-specific information based on booking_type';
COMMENT ON COLUMN temple_basket.service_name IS 'Human-readable service name for display purposes';
COMMENT ON COLUMN temple_basket.total_amount IS 'Total calculated amount for this basket item';