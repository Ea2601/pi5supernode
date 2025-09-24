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

// Network Detection Endpoint
router.get('/detect-network', async (context) => {
  try {
    // Simulate network interface detection
    const networkInterfaces = [
      {
        name: 'eth0',
        type: 'ethernet',
        status: 'connected',
        ip: '192.168.1.100',
        subnet: '255.255.255.0',
        gateway: '192.168.1.1',
        dns: ['8.8.8.8', '8.8.4.4'],
        speed: '1000 Mbps'
      },
      {
        name: 'wlan0', 
        type: 'wifi',
        status: 'available',
        ip: null,
        subnet: null,
        gateway: null,
        dns: null,
        speed: null
      },
      {
        name: 'eth1',
        type: 'ethernet',
        status: 'disconnected',
        ip: null,
        subnet: null,
        gateway: null,
        dns: null,
        speed: null
      }
    ];

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: networkInterfaces });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Hardware Detection Endpoint
router.get('/detect-hardware', async (context) => {
  try {
    // Simulate hardware detection
    const hardwareInfo = {
      cpu: {
        model: 'ARM Cortex-A76',
        cores: 4,
        frequency: '2.4 GHz',
        temperature: 45.2
      },
      memory: {
        total: '8 GB',
        available: '5.2 GB',
        usage: '35%'
      },
      storage: {
        total: '64 GB',
        available: '42 GB',
        usage: '66%'
      },
      network_capabilities: {
        ethernet_ports: 2,
        wifi_support: true,
        max_throughput: '1 Gbps',
        vpn_support: true
      }
    };

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: hardwareInfo });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Apply Basic Configuration
router.post('/apply-basic-config', async (context) => {
  try {
    const body = await context.request.body({ type: 'json' }).value;
    const { networkConfig, securityConfig, systemConfig } = body;

    // Store configuration in database
    const { data: configData, error: configError } = await supabase
      .from('system_configs')
      .upsert({
        config_key: 'quick_setup_applied',
        config_value: JSON.stringify({
          network: networkConfig,
          security: securityConfig,
          system: systemConfig,
          applied_at: new Date().toISOString()
        }),
        updated_at: new Date().toISOString()
      });

    if (configError) throw configError;

    // Simulate configuration application
    const result = {
      success: true,
      message: 'Basic configuration applied successfully',
      applied_configs: {
        network: {
          primary_interface: networkConfig.primaryInterface,
          ip_mode: networkConfig.ipMode,
          static_ip: networkConfig.staticIP,
          dns_servers: networkConfig.dnsServers
        },
        security: {
          admin_password_set: !!securityConfig.adminPassword,
          firewall_enabled: securityConfig.firewallEnabled,
          ssh_enabled: securityConfig.sshEnabled
        },
        system: {
          hostname: systemConfig.hostname,
          timezone: systemConfig.timezone,
          auto_updates: systemConfig.autoUpdates
        }
      }
    };

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: result });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Get Setup Status
router.get('/setup-status', async (context) => {
  try {
    const { data: configData, error: configError } = await supabase
      .from('system_configs')
      .select('*')
      .eq('config_key', 'quick_setup_applied')
      .single();

    const setupStatus = {
      setup_completed: !configError && configData !== null,
      setup_date: configData?.config_value ? JSON.parse(configData.config_value)?.applied_at : null,
      current_config: configData?.config_value ? JSON.parse(configData.config_value) : null
    };

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: setupStatus });
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
