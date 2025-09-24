-- Migration: create_vps_management_tables
-- Created at: 1757150982

-- VPS Servers table for managing remote VPS instances
CREATE TABLE vps_servers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vps_name VARCHAR(255) NOT NULL,
    vps_ip INET NOT NULL,
    ssh_username VARCHAR(100) NOT NULL DEFAULT 'root',
    ssh_port INTEGER NOT NULL DEFAULT 22,
    ssh_key_type VARCHAR(20) DEFAULT 'password', -- 'password' or 'key'
    wireguard_server_id UUID REFERENCES wireguard_servers(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, connecting, installing, completed, failed
    installation_log TEXT,
    error_message TEXT,
    server_specs JSONB, -- CPU, RAM, Storage info
    installation_started_at TIMESTAMP WITH TIME ZONE,
    installation_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VPS Installation Steps tracking
CREATE TABLE vps_installation_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vps_server_id UUID NOT NULL REFERENCES vps_servers(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    step_description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    output TEXT,
    error_message TEXT,
    step_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VPS SSH Credentials (encrypted storage)
CREATE TABLE vps_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vps_server_id UUID NOT NULL REFERENCES vps_servers(id) ON DELETE CASCADE,
    ssh_password_encrypted TEXT, -- Encrypted password
    ssh_private_key_encrypted TEXT, -- Encrypted private key
    encryption_key_id VARCHAR(100), -- Reference to encryption key
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_vps_servers_status ON vps_servers(status);
CREATE INDEX idx_vps_servers_ip ON vps_servers(vps_ip);
CREATE INDEX idx_vps_installation_steps_server_id ON vps_installation_steps(vps_server_id);
CREATE INDEX idx_vps_installation_steps_status ON vps_installation_steps(status);
CREATE INDEX idx_vps_credentials_server_id ON vps_credentials(vps_server_id);

-- RLS Policies (Row Level Security)
ALTER TABLE vps_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vps_installation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE vps_credentials ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage VPS servers
CREATE POLICY "Allow authenticated users to manage VPS servers" ON vps_servers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view installation steps" ON vps_installation_steps
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage credentials" ON vps_credentials
    FOR ALL USING (auth.role() = 'authenticated');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_vps_servers_updated_at BEFORE UPDATE ON vps_servers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vps_credentials_updated_at BEFORE UPDATE ON vps_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;