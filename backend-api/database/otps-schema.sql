-- Create OTPs table for email verification
CREATE TABLE IF NOT EXISTS otps (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);

-- Create index on expires_at for cleanup
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at);

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otps 
  WHERE expires_at < CURRENT_TIMESTAMP 
  OR (expires_at < CURRENT_TIMESTAMP - INTERVAL '5 minutes' AND verified = FALSE);
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup function to run periodically (optional)
-- This would need to be set up as a cron job or scheduled task
