-- Create temple_users table for temple authentication
CREATE TABLE IF NOT EXISTS temple_users (
  id SERIAL PRIMARY KEY,
  temple_id INTEGER REFERENCES temples(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'temple_admin', -- temple_admin, temple_manager, temple_staff
  is_active BOOLEAN DEFAULT true,
  is_primary_contact BOOLEAN DEFAULT false, -- One primary contact per temple
  permissions JSONB DEFAULT '{}', -- Store specific permissions
  last_login TIMESTAMP WITH TIME ZONE,
  reset_password_token VARCHAR(255),
  reset_password_expire TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for temple users
CREATE INDEX IF NOT EXISTS idx_temple_users_email ON temple_users(email);
CREATE INDEX IF NOT EXISTS idx_temple_users_temple_id ON temple_users(temple_id);
CREATE INDEX IF NOT EXISTS idx_temple_users_phone ON temple_users(phone);
CREATE INDEX IF NOT EXISTS idx_temple_users_role ON temple_users(role);

-- Add constraint to ensure only one primary contact per temple
CREATE UNIQUE INDEX IF NOT EXISTS idx_temple_users_primary_contact 
ON temple_users(temple_id) 
WHERE is_primary_contact = true;

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_temple_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_temple_users_updated_at
  BEFORE UPDATE ON temple_users
  FOR EACH ROW
  EXECUTE FUNCTION update_temple_users_updated_at();

-- Update existing OTP table to support temple authentication
ALTER TABLE otp_verifications 
ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'user'; -- user, admin, temple, vendor

-- Add index for user_type
CREATE INDEX IF NOT EXISTS idx_otp_user_type ON otp_verifications(user_type);

-- Update vendor_users table to add updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_vendor_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vendor_users_updated_at
  BEFORE UPDATE ON vendor_users
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_users_updated_at();