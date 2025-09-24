import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const router = new Router();
const app = new Application();

// Get System Settings
router.get('/system-settings', async (context) => {
  try {
    const { data, error } = await supabase
      .from('system_configs')
      .select('*')
      .in('config_key', [
        'hostname', 'timezone', 'ntp_servers', 'dns_servers', 'ssh_enabled', 
        'ssh_port', 'auto_updates', 'backup_enabled', 'backup_schedule'
      ]);

    if (error) throw error;

    // Transform array to object
    const settings = data?.reduce((acc, config) => {
      acc[config.config_key] = JSON.parse(config.config_value);
      return acc;
    }, {}) || {};

    // Set defaults if not found
    const systemSettings = {
      hostname: settings.hostname || 'pi5-supernode',
      timezone: settings.timezone || 'UTC',
      ntp_servers: settings.ntp_servers || ['pool.ntp.org', 'time.cloudflare.com'],
      dns_servers: settings.dns_servers || ['1.1.1.1', '8.8.8.8'],
      ssh_enabled: settings.ssh_enabled ?? true,
      ssh_port: settings.ssh_port || 22,
      auto_updates: settings.auto_updates ?? true,
      backup_enabled: settings.backup_enabled ?? true,
      backup_schedule: settings.backup_schedule || '0 2 * * *'
    };

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: systemSettings });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Save System Settings
router.post('/system-settings', async (context) => {
  try {
    const body = await context.request.body({ type: 'json' }).value;
    const settings = body;

    // Save each setting individually
    const upsertPromises = Object.entries(settings).map(([key, value]) => 
      supabase.from('system_configs').upsert({
        config_key: key,
        config_value: JSON.stringify(value),
        updated_at: new Date().toISOString()
      })
    );

    const results = await Promise.all(upsertPromises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Failed to save settings: ${errors.map(e => e.error?.message).join(', ')}`);
    }

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ 
      data: { success: true, message: 'System settings saved successfully' } 
    });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Get Security Settings
router.get('/security-settings', async (context) => {
  try {
    const { data, error } = await supabase
      .from('system_configs')
      .select('*')
      .in('config_key', [
        'firewall_enabled', 'fail2ban_enabled', 'password_policy', 
        'session_timeout', 'two_factor_enabled'
      ]);

    if (error) throw error;

    const settings = data?.reduce((acc, config) => {
      acc[config.config_key] = JSON.parse(config.config_value);
      return acc;
    }, {}) || {};

    const securitySettings = {
      firewall_enabled: settings.firewall_enabled ?? true,
      fail2ban_enabled: settings.fail2ban_enabled ?? true,
      password_policy: settings.password_policy || {
        min_length: 8,
        require_uppercase: true,
        require_numbers: true,
        require_symbols: false
      },
      session_timeout: settings.session_timeout || 3600,
      two_factor_enabled: settings.two_factor_enabled ?? false
    };

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: securitySettings });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Save Security Settings
router.post('/security-settings', async (context) => {
  try {
    const body = await context.request.body({ type: 'json' }).value;
    const settings = body;

    const upsertPromises = Object.entries(settings).map(([key, value]) => 
      supabase.from('system_configs').upsert({
        config_key: key,
        config_value: JSON.stringify(value),
        updated_at: new Date().toISOString()
      })
    );

    const results = await Promise.all(upsertPromises);
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Failed to save security settings: ${errors.map(e => e.error?.message).join(', ')}`);
    }

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ 
      data: { success: true, message: 'Security settings saved successfully' } 
    });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Get User Management
router.get('/users', async (context) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, is_active, last_login, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: data || [] });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Create User
router.post('/users', async (context) => {
  try {
    const body = await context.request.body({ type: 'json' }).value;
    const { username, email, password, role } = body;

    // Hash password (in real implementation, use proper password hashing)
    const hashedPassword = btoa(password); // Simple base64 encoding for demo

    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password_hash: hashedPassword,
        role: role || 'viewer',
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select('id, username, email, role, is_active, created_at')
      .single();

    if (error) throw error;

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Update User
router.put('/users/:id', async (context) => {
  try {
    const userId = context.params.id;
    const body = await context.request.body({ type: 'json' }).value;
    const { username, email, role, is_active } = body;

    const { data, error } = await supabase
      .from('users')
      .update({ username, email, role, is_active })
      .eq('id', userId)
      .select('id, username, email, role, is_active, last_login, created_at')
      .single();

    if (error) throw error;

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Delete User
router.delete('/users/:id', async (context) => {
  try {
    const userId = context.params.id;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ 
      data: { success: true, message: 'User deleted successfully' } 
    });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Create Backup
router.post('/backup/create', async (context) => {
  try {
    // Simulate backup creation
    const backupId = `backup_${Date.now()}`;
    const backupData = {
      id: backupId,
      name: `System Backup - ${new Date().toISOString().split('T')[0]}`,
      size: '2.4 GB',
      created_at: new Date().toISOString(),
      includes: ['System Configuration', 'Network Settings', 'User Data', 'VPN Configs'],
      downloadUrl: `/api/backups/${backupId}/download`
    };

    // Store backup record
    const { error } = await supabase
      .from('system_configs')
      .insert({
        config_key: `backup_${backupId}`,
        config_value: JSON.stringify(backupData),
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: backupData });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Get API Keys
router.get('/api-keys', async (context) => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, key_name, key_prefix, permissions, is_active, last_used, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: data || [] });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Generate API Key
router.post('/api-keys/generate', async (context) => {
  try {
    const body = await context.request.body({ type: 'json' }).value;
    const { name, permissions } = body;

    // Generate a new API key
    const keyId = crypto.randomUUID();
    const keySecret = `sk_${Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('')}`;
    const keyPrefix = keySecret.substring(0, 12) + '...';

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        id: keyId,
        key_name: name,
        key_hash: btoa(keySecret), // In real implementation, use proper hashing
        key_prefix: keyPrefix,
        permissions: permissions || ['read'],
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select('id, key_name, key_prefix, permissions, is_active, created_at')
      .single();

    if (error) throw error;

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ 
      data: { 
        ...data, 
        full_key: keySecret // Only return full key once during creation
      } 
    });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Revoke API Key
router.delete('/api-keys/:id', async (context) => {
  try {
    const keyId = context.params.id;

    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId);

    if (error) throw error;

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ 
      data: { success: true, message: 'API key revoked successfully' } 
    });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// CORS preflight handler
router.options('/(.*)', (context) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    context.response.headers.set(key, value);
  });
  context.response.status = 200;
});

app.use(router.routes());
app.use(router.allowedMethods());

serve(app.fetch, { port: 8000 });
