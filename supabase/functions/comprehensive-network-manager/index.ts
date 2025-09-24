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

// DHCP Management

// Get DHCP configuration
router.get('/dhcp/config', async (context) => {
  try {
    const { data, error } = await supabase
      .from('system_configs')
      .select('*')
      .in('config_key', [
        'dhcp_enabled', 'dhcp_start_ip', 'dhcp_end_ip', 'dhcp_subnet',
        'dhcp_gateway', 'dhcp_dns_servers', 'dhcp_lease_time', 'dhcp_reservations'
      ]);

    if (error) throw error;

    const settings = data?.reduce((acc, config) => {
      acc[config.config_key] = JSON.parse(config.config_value);
      return acc;
    }, {}) || {};

    const dhcpConfig = {
      enabled: settings.dhcp_enabled ?? true,
      start_ip: settings.dhcp_start_ip || '192.168.1.100',
      end_ip: settings.dhcp_end_ip || '192.168.1.200',
      subnet: settings.dhcp_subnet || '255.255.255.0',
      gateway: settings.dhcp_gateway || '192.168.1.1',
      dns_servers: settings.dhcp_dns_servers || ['192.168.1.1', '8.8.8.8'],
      lease_time: settings.dhcp_lease_time || 86400,
      reservations: settings.dhcp_reservations || []
    };

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: dhcpConfig });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Update DHCP configuration
router.post('/dhcp/config', async (context) => {
  try {
    const body = await context.request.body({ type: 'json' }).value;
    const config = body;

    const upsertPromises = Object.entries(config).map(([key, value]) => 
      supabase.from('system_configs').upsert({
        config_key: `dhcp_${key}`,
        config_value: JSON.stringify(value),
        updated_at: new Date().toISOString()
      })
    );

    const results = await Promise.all(upsertPromises);
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Failed to save DHCP config: ${errors.map(e => e.error?.message).join(', ')}`);
    }

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ 
      data: { success: true, message: 'DHCP configuration saved successfully' } 
    });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Get DHCP leases
router.get('/dhcp/leases', async (context) => {
  try {
    // Simulate active DHCP leases
    const leases = [
      {
        id: '1',
        hostname: 'laptop-john',
        mac_address: '00:11:22:33:44:55',
        ip_address: '192.168.1.101',
        lease_start: new Date(Date.now() - 3600000).toISOString(),
        lease_end: new Date(Date.now() + 82800000).toISOString(),
        status: 'active',
        vendor: 'Apple Inc.'
      },
      {
        id: '2',
        hostname: 'smartphone-jane',
        mac_address: '66:77:88:99:AA:BB',
        ip_address: '192.168.1.102',
        lease_start: new Date(Date.now() - 7200000).toISOString(),
        lease_end: new Date(Date.now() + 79200000).toISOString(),
        status: 'active',
        vendor: 'Samsung Electronics'
      },
      {
        id: '3',
        hostname: 'tablet-guest',
        mac_address: 'CC:DD:EE:FF:00:11',
        ip_address: '192.168.1.103',
        lease_start: new Date(Date.now() - 1800000).toISOString(),
        lease_end: new Date(Date.now() + 84600000).toISOString(),
        status: 'active',
        vendor: 'Google Inc.'
      }
    ];

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: leases });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// WiFi Management

// Get WiFi networks
router.get('/wifi/networks', async (context) => {
  try {
    const { data, error } = await supabase
      .from('wifi_networks')
      .select('*')
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

// Create WiFi network
router.post('/wifi/networks', async (context) => {
  try {
    const body = await context.request.body({ type: 'json' }).value;
    const { ssid, security_type, password, channel, bandwidth, is_hidden, is_guest, max_clients } = body;

    const { data, error } = await supabase
      .from('wifi_networks')
      .insert({
        ssid,
        security_type: security_type || 'wpa2',
        password,
        channel: channel || 'auto',
        bandwidth: bandwidth || '80MHz',
        is_hidden: is_hidden ?? false,
        is_guest: is_guest ?? false,
        is_enabled: true,
        max_clients: max_clients || 50,
        created_at: new Date().toISOString()
      })
      .select('*')
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

// Update WiFi network
router.put('/wifi/networks/:id', async (context) => {
  try {
    const networkId = context.params.id;
    const body = await context.request.body({ type: 'json' }).value;
    
    const { data, error } = await supabase
      .from('wifi_networks')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', networkId)
      .select('*')
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

// Delete WiFi network
router.delete('/wifi/networks/:id', async (context) => {
  try {
    const networkId = context.params.id;

    const { error } = await supabase
      .from('wifi_networks')
      .delete()
      .eq('id', networkId);

    if (error) throw error;

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ 
      data: { success: true, message: 'WiFi network deleted successfully' } 
    });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Get connected WiFi clients
router.get('/wifi/clients', async (context) => {
  try {
    // Simulate connected WiFi clients
    const clients = [
      {
        id: '1',
        hostname: 'iPhone-13',
        mac_address: '12:34:56:78:9A:BC',
        ip_address: '192.168.1.105',
        ssid: 'Pi5-Supernode-Main',
        signal_strength: -45,
        connected_time: '2h 15m',
        data_usage: { rx: 125000000, tx: 45000000 },
        device_type: 'smartphone'
      },
      {
        id: '2',
        hostname: 'MacBook-Pro',
        mac_address: 'DE:F0:12:34:56:78',
        ip_address: '192.168.1.106',
        ssid: 'Pi5-Supernode-Main',
        signal_strength: -38,
        connected_time: '4h 32m',
        data_usage: { rx: 850000000, tx: 250000000 },
        device_type: 'laptop'
      },
      {
        id: '3',
        hostname: 'Guest-Device',
        mac_address: '9A:BC:DE:F0:12:34',
        ip_address: '192.168.2.101',
        ssid: 'Pi5-Supernode-Guest',
        signal_strength: -52,
        connected_time: '1h 8m',
        data_usage: { rx: 35000000, tx: 12000000 },
        device_type: 'tablet'
      }
    ];

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: clients });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// VLAN Management

// Get VLANs
router.get('/vlans', async (context) => {
  try {
    const { data, error } = await supabase
      .from('vlans')
      .select('*')
      .order('vlan_id', { ascending: true });

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

// Create VLAN
router.post('/vlans', async (context) => {
  try {
    const body = await context.request.body({ type: 'json' }).value;
    const { name, vlan_id, description, subnet, gateway, dhcp_enabled, is_isolated } = body;

    const { data, error } = await supabase
      .from('vlans')
      .insert({
        name,
        vlan_id,
        description: description || '',
        subnet,
        gateway,
        dhcp_enabled: dhcp_enabled ?? true,
        is_isolated: is_isolated ?? false,
        is_enabled: true,
        created_at: new Date().toISOString()
      })
      .select('*')
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

// Update VLAN
router.put('/vlans/:id', async (context) => {
  try {
    const vlanId = context.params.id;
    const body = await context.request.body({ type: 'json' }).value;
    
    const { data, error } = await supabase
      .from('vlans')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', vlanId)
      .select('*')
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

// Delete VLAN
router.delete('/vlans/:id', async (context) => {
  try {
    const vlanId = context.params.id;

    const { error } = await supabase
      .from('vlans')
      .delete()
      .eq('id', vlanId);

    if (error) throw error;

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ 
      data: { success: true, message: 'VLAN deleted successfully' } 
    });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Network Scanning
router.get('/network/scan', async (context) => {
  try {
    // Simulate network scanning
    const devices = [
      {
        id: '1',
        hostname: 'pi5-supernode.local',
        ip_address: '192.168.1.1',
        mac_address: 'B8:27:EB:12:34:56',
        vendor: 'Raspberry Pi Foundation',
        device_type: 'router',
        open_ports: [22, 80, 443, 53],
        last_seen: new Date().toISOString(),
        online: true
      },
      {
        id: '2',
        hostname: 'desktop-workstation',
        ip_address: '192.168.1.50',
        mac_address: '01:23:45:67:89:AB',
        vendor: 'Intel Corporation',
        device_type: 'computer',
        open_ports: [22, 445, 5357],
        last_seen: new Date(Date.now() - 300000).toISOString(),
        online: true
      },
      {
        id: '3',
        hostname: 'smart-tv-living',
        ip_address: '192.168.1.75',
        mac_address: 'CD:EF:01:23:45:67',
        vendor: 'Samsung Electronics',
        device_type: 'media',
        open_ports: [7001, 8080, 8443],
        last_seen: new Date(Date.now() - 900000).toISOString(),
        online: false
      }
    ];

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: devices });
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
