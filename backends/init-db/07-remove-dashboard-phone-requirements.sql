-- Remove phone number requirements for dashboard users
-- Dashboard users (admin, temple, vendor) should only use email and password authentication
-- Phone numbers are only for frontend users with OTP login

-- Make phone column optional for admin_users
ALTER TABLE admin_users 
ALTER COLUMN phone DROP NOT NULL;

-- Drop unique constraint on phone for admin_users
ALTER TABLE admin_users 
DROP CONSTRAINT IF EXISTS admin_users_phone_key;

-- Make phone column optional for temple_users
ALTER TABLE temple_users 
ALTER COLUMN phone DROP NOT NULL;

-- Drop unique constraint on phone for temple_users
ALTER TABLE temple_users 
DROP CONSTRAINT IF EXISTS temple_users_phone_key;

-- Drop phone index for temple_users since it's no longer required
DROP INDEX IF EXISTS idx_temple_users_phone;

-- Update existing records to set phone to NULL for dashboard users
UPDATE admin_users SET phone = NULL WHERE phone IS NOT NULL;
UPDATE temple_users SET phone = NULL WHERE phone IS NOT NULL;

-- Add comment to clarify the purpose
COMMENT ON COLUMN admin_users.phone IS 'Optional phone number - dashboard users use email authentication only';
COMMENT ON COLUMN temple_users.phone IS 'Optional phone number - dashboard users use email authentication only';