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

// Get all WAN interfaces
router.get('/wan-interfaces', async (context) => {
  try {
    const { data, error } = await supabase
      .from('wan_interfaces')
      .select(`
        *,
        network_paths(*)
      `)
      .order('priority', { ascending: true });

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

// Create WAN interface
router.post('/wan-interfaces', async (context) => {
  try {
    const body = await context.request.body({ type: 'json' }).value;
    const { 
      name, interface_name, connection_type, priority, weight, 
      is_enabled, is_primary, failover_enabled, health_check_enabled,
      health_check_host, health_check_interval, config 
    } = body;

    const { data, error } = await supabase
      .from('wan_interfaces')
      .insert({
        name,
        interface_name,
        connection_type,
        priority: priority || 1,
        weight: weight || 1,
        is_enabled: is_enabled ?? true,
        is_primary: is_primary ?? false,
        failover_enabled: failover_enabled ?? true,
        health_check_enabled: health_check_enabled ?? true,
        health_check_host: health_check_host || '8.8.8.8',
        health_check_interval: health_check_interval || 30,
        config: config || {},
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

// Update WAN interface
router.put('/wan-interfaces/:id', async (context) => {
  try {
    const wanId = context.params.id;
    const body = await context.request.body({ type: 'json' }).value;
    
    const { data, error } = await supabase
      .from('wan_interfaces')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', wanId)
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

// Delete WAN interface
router.delete('/wan-interfaces/:id', async (context) => {
  try {
    const wanId = context.params.id;

    const { error } = await supabase
      .from('wan_interfaces')
      .delete()
      .eq('id', wanId);

    if (error) throw error;

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ 
      data: { success: true, message: 'WAN interface deleted successfully' } 
    });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Get WAN status and metrics
router.get('/wan-status', async (context) => {
  try {
    // Simulate real-time WAN status monitoring
    const wanStatus = {
      total_interfaces: 3,
      active_interfaces: 2,
      primary_interface: {
        name: 'WAN1',
        interface: 'eth0',
        status: 'up',
        ip: '203.0.113.10',
        gateway: '203.0.113.1',
        uptime: '15d 8h',
        bytes_sent: 1024 * 1024 * 1024 * 45, // 45GB
        bytes_received: 1024 * 1024 * 1024 * 120, // 120GB
        latency: 12,
        packet_loss: 0.1
      },
      backup_interfaces: [
        {
          name: 'WAN2',
          interface: 'wlan0',
          status: 'up',
          ip: '198.51.100.15',
          gateway: '198.51.100.1',
          uptime: '3d 12h',
          bytes_sent: 1024 * 1024 * 1024 * 8, // 8GB
          bytes_received: 1024 * 1024 * 1024 * 25, // 25GB
          latency: 28,
          packet_loss: 0.3
        }
      ],
      failed_interfaces: [
        {
          name: 'WAN3',
          interface: 'usb0',
          status: 'down',
          last_seen: '2h ago',
          failure_reason: 'No carrier detected'
        }
      ],
      load_balancing: {
        enabled: true,
        algorithm: 'weighted',
        traffic_distribution: {
          'WAN1': 70,
          'WAN2': 30
        }
      },
      failover: {
        enabled: true,
        active_failovers: 0,
        last_failover: null
      }
    };

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: wanStatus });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Test WAN connection
router.post('/wan-interfaces/:id/test', async (context) => {
  try {
    const wanId = context.params.id;
    
    // Simulate connection test
    const testResult = {
      interface_id: wanId,
      test_time: new Date().toISOString(),
      connectivity: {
        gateway: { status: 'success', latency: 2.5 },
        dns: { status: 'success', latency: 12.3 },
        internet: { status: 'success', latency: 28.7 }
      },
      speed_test: {
        download_mbps: 85.2,
        upload_mbps: 23.7,
        ping_ms: 15.2,
        jitter_ms: 2.1
      },
      health_score: 95,
      recommendations: []
    };

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: testResult });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Get load balancing configuration
router.get('/load-balancing', async (context) => {
  try {
    const { data, error } = await supabase
      .from('system_configs')
      .select('*')
      .in('config_key', [
        'load_balancing_enabled', 'load_balancing_algorithm', 
        'load_balancing_weights', 'failover_enabled',
        'health_check_global_enabled', 'health_check_global_interval'
      ]);

    if (error) throw error;

    const settings = data?.reduce((acc, config) => {
      acc[config.config_key] = JSON.parse(config.config_value);
      return acc;
    }, {}) || {};

    const loadBalancingConfig = {
      enabled: settings.load_balancing_enabled ?? true,
      algorithm: settings.load_balancing_algorithm || 'weighted',
      weights: settings.load_balancing_weights || {},
      failover_enabled: settings.failover_enabled ?? true,
      health_check_enabled: settings.health_check_global_enabled ?? true,
      health_check_interval: settings.health_check_global_interval || 30
    };

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ data: loadBalancingConfig });
  } catch (error) {
    context.response.status = 500;
    context.response.body = JSON.stringify({ error: error.message });
  }
});

// Update load balancing configuration
router.post('/load-balancing', async (context) => {
  try {
    const body = await context.request.body({ type: 'json' }).value;
    const { enabled, algorithm, weights, failover_enabled, health_check_enabled, health_check_interval } = body;

    const upsertPromises = [
      { key: 'load_balancing_enabled', value: enabled },
      { key: 'load_balancing_algorithm', value: algorithm },
      { key: 'load_balancing_weights', value: weights },
      { key: 'failover_enabled', value: failover_enabled },
      { key: 'health_check_global_enabled', value: health_check_enabled },
      { key: 'health_check_global_interval', value: health_check_interval }
    ].map(({ key, value }) => 
      supabase.from('system_configs').upsert({
        config_key: key,
        config_value: JSON.stringify(value),
        updated_at: new Date().toISOString()
      })
    );

    const results = await Promise.all(upsertPromises);
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Failed to save configuration: ${errors.map(e => e.error?.message).join(', ')}`);
    }

    context.response.headers.set('Content-Type', 'application/json');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      context.response.headers.set(key, value);
    });
    context.response.body = JSON.stringify({ 
      data: { success: true, message: 'Load balancing configuration saved successfully' } 
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
