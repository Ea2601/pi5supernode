-- Migration: update_vps_credentials_encryption
-- Created at: 1757151832

-- Update VPS credentials table to support proper AES-GCM encryption
ALTER TABLE vps_credentials 
ADD COLUMN IF NOT EXISTS encryption_iv TEXT,
ADD COLUMN IF NOT EXISTS encryption_key TEXT;

-- Update existing comment for ssh_password_encrypted
COMMENT ON COLUMN vps_credentials.ssh_password_encrypted IS 'AES-GCM encrypted SSH password stored as comma-separated bytes';
COMMENT ON COLUMN vps_credentials.encryption_iv IS 'AES-GCM initialization vector stored as comma-separated bytes';
COMMENT ON COLUMN vps_credentials.encryption_key IS 'Exported AES-GCM key in JWK format for decryption';;