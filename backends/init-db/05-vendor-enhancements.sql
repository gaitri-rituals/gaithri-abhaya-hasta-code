-- Enhance vendor_users table for better dashboard functionality
ALTER TABLE vendor_users 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}';

-- Create vendor_services table to track ritual categories and services
CREATE TABLE IF NOT EXISTS vendor_services (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  service_category VARCHAR(100) NOT NULL, -- catering, flowers, decorations, music, photography, etc.
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  price_range VARCHAR(100), -- budget, premium, luxury
  is_active BOOLEAN DEFAULT true,
  availability_status VARCHAR(50) DEFAULT 'available', -- available, busy, unavailable
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vendor_notifications table for event delegation system
CREATE TABLE IF NOT EXISTS vendor_notifications (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  event_id INTEGER, -- Reference to events/bookings table
  temple_id INTEGER REFERENCES temples(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- event_delegation, booking_request, payment_update, etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  status VARCHAR(20) DEFAULT 'unread', -- unread, read, acknowledged, responded
  metadata JSONB DEFAULT '{}', -- Additional data like event details, deadlines, etc.
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vendor_event_responses table to track vendor responses to delegated events
CREATE TABLE IF NOT EXISTS vendor_event_responses (
  id SERIAL PRIMARY KEY,
  notification_id INTEGER REFERENCES vendor_notifications(id) ON DELETE CASCADE,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL,
  response_type VARCHAR(50) NOT NULL, -- accepted, declined, interested, quote_requested
  response_message TEXT,
  quoted_price DECIMAL(10, 2),
  estimated_delivery_time VARCHAR(100),
  terms_and_conditions TEXT,
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vendor_dashboard_metrics table for tracking vendor performance
CREATE TABLE IF NOT EXISTS vendor_dashboard_metrics (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  events_received INTEGER DEFAULT 0,
  events_responded INTEGER DEFAULT 0,
  events_completed INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  response_time_avg INTEGER DEFAULT 0, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, metric_date)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_services_vendor_id ON vendor_services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_services_category ON vendor_services(service_category);
CREATE INDEX IF NOT EXISTS idx_vendor_services_active ON vendor_services(is_active);

CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor_id ON vendor_notifications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_temple_id ON vendor_notifications(temple_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_status ON vendor_notifications(status);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_type ON vendor_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_created_at ON vendor_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_vendor_event_responses_vendor_id ON vendor_event_responses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_event_responses_event_id ON vendor_event_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_vendor_event_responses_notification_id ON vendor_event_responses(notification_id);

CREATE INDEX IF NOT EXISTS idx_vendor_dashboard_metrics_vendor_id ON vendor_dashboard_metrics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_dashboard_metrics_date ON vendor_dashboard_metrics(metric_date);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_vendor_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vendor_services_updated_at
  BEFORE UPDATE ON vendor_services
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_services_updated_at();

CREATE OR REPLACE FUNCTION update_vendor_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vendor_notifications_updated_at
  BEFORE UPDATE ON vendor_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_notifications_updated_at();

CREATE OR REPLACE FUNCTION update_vendor_event_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vendor_event_responses_updated_at
  BEFORE UPDATE ON vendor_event_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_event_responses_updated_at();

CREATE OR REPLACE FUNCTION update_vendor_dashboard_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vendor_dashboard_metrics_updated_at
  BEFORE UPDATE ON vendor_dashboard_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_dashboard_metrics_updated_at();