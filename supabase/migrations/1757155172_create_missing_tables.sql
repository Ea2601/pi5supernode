-- Migration: create_missing_tables
-- Created at: 1757155172

-- Create missing device_configurations table
CREATE TABLE IF NOT EXISTS device_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_json JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, config_key)
);

-- Create missing audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL DEFAULT 'system',
    severity VARCHAR(20) NOT NULL DEFAULT 'info', -- info, warning, error, critical
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    source_ip INET,
    user_id UUID,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID
);

-- Create missing system_metrics table for observability
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL, -- cpu, memory, disk, network, temperature
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(20) NOT NULL, -- percent, bytes, celsius, etc
    cpu_percent DECIMAL(5,2),
    memory_percent DECIMAL(5,2),
    disk_usage_percent DECIMAL(5,2),
    temperature_celsius DECIMAL(5,2),
    network_bytes_in BIGINT,
    network_bytes_out BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create missing network_traffic_data table
CREATE TABLE IF NOT EXISTS network_traffic_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    interface_name VARCHAR(50) NOT NULL,
    bytes_sent BIGINT NOT NULL DEFAULT 0,
    bytes_received BIGINT NOT NULL DEFAULT 0,
    packets_sent BIGINT NOT NULL DEFAULT 0,
    packets_received BIGINT NOT NULL DEFAULT 0,
    errors_in BIGINT NOT NULL DEFAULT 0,
    errors_out BIGINT NOT NULL DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_configurations_category ON device_configurations(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_network_traffic_timestamp ON network_traffic_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_network_traffic_interface ON network_traffic_data(interface_name);

-- RLS Policies
ALTER TABLE device_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_traffic_data ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to access these tables
CREATE POLICY "Allow authenticated users to manage device configs" ON device_configurations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view audit logs" ON audit_logs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view system metrics" ON system_metrics
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view network traffic" ON network_traffic_data
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert some initial data
INSERT INTO device_configurations (category, config_key, config_json, description) VALUES
('telegram', 'bot_settings', '{"bot_token": "", "default_chat_id": "", "enabled": false}', 'Telegram bot configuration for notifications'),
('system', 'monitoring', '{"enabled": true, "interval": 60, "retention_days": 30}', 'System monitoring configuration'),
('network', 'discovery', '{"enabled": true, "scan_interval": 300, "ip_range": "192.168.1.0/24"}', 'Network device discovery settings')
ON CONFLICT (category, config_key) DO NOTHING;

-- Insert sample audit logs
INSERT INTO audit_logs (event_type, event_category, severity, title, message, details) VALUES
('alert', 'system', 'warning', 'High CPU Usage', 'CPU usage has exceeded 80% for more than 5 minutes', '{"cpu_percent": 85.2, "duration": 300}'),
('alert', 'network', 'info', 'New Device Detected', 'A new device has connected to the network', '{"mac_address": "aa:bb:cc:dd:ee:ff", "ip": "192.168.1.100"}'),
('alert', 'system', 'critical', 'Storage Space Low', 'Available disk space is below 10%', '{"disk_usage": 92.5, "available_gb": 2.1}')
ON CONFLICT DO NOTHING;;