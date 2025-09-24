Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { action } = requestData;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    let result;

    // DHCP Management
    if (action === 'get_dhcp_pools') {
      const response = await fetch(`${supabaseUrl}/rest/v1/dhcp_pools?select=*&order=name.asc`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch DHCP pools');
      }

      const pools = await response.json();
      result = { success: true, data: { pools } };

    } else if (action === 'create_dhcp_pool') {
      const { pool } = requestData;
      
      const dbPool = {
        name: pool.name,
        description: pool.description,
        range_start: pool.range_start,
        range_end: pool.range_end,
        subnet_mask: pool.subnet_mask,
        gateway: pool.gateway,
        dns_servers: pool.dns_servers,
        lease_duration: pool.lease_duration || 86400,
        vlan_id: pool.vlan_id,
        is_enabled: pool.is_enabled !== false
      };
      
      const response = await fetch(`${supabaseUrl}/rest/v1/dhcp_pools`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dbPool)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create DHCP pool: ${errorText}`);
      }
      
      const data = await response.json();
      result = { success: true, data };

    } else if (action === 'get_dhcp_leases') {
      const response = await fetch(`${supabaseUrl}/rest/v1/dhcp_leases?select=*&order=lease_start.desc&limit=100`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });

      let leases = [];
      if (response.ok) {
        leases = await response.json();
      } else {
        // Generate sample lease data
        const devices = [
          { hostname: 'laptop-john', mac: '00:1B:44:11:3A:B7', vendor: 'Dell Inc.' },
          { hostname: 'iphone-sarah', mac: '00:50:56:C0:00:08', vendor: 'Apple Inc.' },
          { hostname: 'smart-tv', mac: '00:23:5A:15:99:42', vendor: 'Samsung' },
          { hostname: 'gaming-console', mac: '00:17:E9:4F:96:B6', vendor: 'Sony' },
          { hostname: 'tablet-kids', mac: '00:0F:EA:91:04:07', vendor: 'Amazon' }
        ];
        
        leases = devices.map((device, index) => ({
          id: `lease_${index + 1}`,
          ip_address: `192.168.1.${100 + index}`,
          mac_address: device.mac,
          hostname: device.hostname,
          vendor: device.vendor,
          lease_start: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          lease_end: new Date(Date.now() + 86400000).toISOString(),
          pool_id: 'default',
          is_active: true
        }));
      }
      
      result = { success: true, data: { leases } };

    } else if (action === 'get_dhcp_reservations') {
      const response = await fetch(`${supabaseUrl}/rest/v1/dhcp_reservations?select=*&order=hostname.asc`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });

      let reservations = [];
      if (response.ok) {
        reservations = await response.json();
      }
      
      result = { success: true, data: { reservations } };

    } else if (action === 'create_dhcp_reservation') {
      const { reservation } = requestData;
      
      const dbReservation = {
        hostname: reservation.hostname,
        mac_address: reservation.mac_address,
        ip_address: reservation.ip_address,
        description: reservation.description,
        pool_id: reservation.pool_id,
        is_enabled: reservation.is_enabled !== false
      };
      
      const response = await fetch(`${supabaseUrl}/rest/v1/dhcp_reservations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dbReservation)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create DHCP reservation: ${errorText}`);
      }
      
      const data = await response.json();
      result = { success: true, data };

    // WiFi Management
    } else if (action === 'get_wifi_networks') {
      const response = await fetch(`${supabaseUrl}/rest/v1/wifi_networks?select=*&order=priority.asc`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch WiFi networks');
      }

      const networks = await response.json();
      result = { success: true, data: { networks } };

    } else if (action === 'create_wifi_network') {
      const { network } = requestData;
      
      const dbNetwork = {
        ssid: network.ssid,
        description: network.description,
        security_type: network.security_type,
        passphrase: network.passphrase,
        band: network.band,
        channel: network.channel,
        bandwidth: network.bandwidth,
        max_clients: network.max_clients || 50,
        vlan_id: network.vlan_id,
        priority: network.priority || 100,
        is_hidden: network.is_hidden || false,
        is_guest_network: network.is_guest_network || false,
        is_enabled: network.is_enabled !== false
      };
      
      const response = await fetch(`${supabaseUrl}/rest/v1/wifi_networks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dbNetwork)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create WiFi network: ${errorText}`);
      }
      
      const data = await response.json();
      result = { success: true, data };

    } else if (action === 'get_wifi_clients') {
      // Simulate WiFi client data
      const clients = [
        {
          id: '1',
          mac_address: '00:1B:44:11:3A:B7',
          hostname: 'laptop-john',
          ip_address: '192.168.1.105',
          ssid: 'Pi5-SuperNode-Main',
          signal_strength: -45,
          connected_at: new Date(Date.now() - 3600000).toISOString(),
          data_usage: { rx: 1024000000, tx: 512000000 },
          is_blocked: false
        },
        {
          id: '2',
          mac_address: '00:50:56:C0:00:08',
          hostname: 'iphone-sarah',
          ip_address: '192.168.1.106',
          ssid: 'Pi5-SuperNode-Main',
          signal_strength: -38,
          connected_at: new Date(Date.now() - 7200000).toISOString(),
          data_usage: { rx: 512000000, tx: 256000000 },
          is_blocked: false
        },
        {
          id: '3',
          mac_address: '00:23:5A:15:99:42',
          hostname: 'guest-device',
          ip_address: '192.168.100.10',
          ssid: 'Pi5-SuperNode-Guest',
          signal_strength: -52,
          connected_at: new Date(Date.now() - 1800000).toISOString(),
          data_usage: { rx: 128000000, tx: 64000000 },
          is_blocked: false
        }
      ];
      
      result = { success: true, data: { clients } };

    } else if (action === 'scan_wifi_channels') {
      // Simulate WiFi channel scan
      const scan_results = {
        '2.4GHz': [
          { channel: 1, frequency: '2412 MHz', usage: 75, networks: 8 },
          { channel: 6, frequency: '2437 MHz', usage: 45, networks: 5 },
          { channel: 11, frequency: '2462 MHz', usage: 60, networks: 7 }
        ],
        '5GHz': [
          { channel: 36, frequency: '5180 MHz', usage: 25, networks: 2 },
          { channel: 44, frequency: '5220 MHz', usage: 15, networks: 1 },
          { channel: 149, frequency: '5745 MHz', usage: 30, networks: 3 }
        ]
      };
      
      result = { success: true, data: { scan_results } };

    // VLAN Management
    } else if (action === 'get_vlans') {
      const response = await fetch(`${supabaseUrl}/rest/v1/vlan_catalog?select=*&order=vlan_id.asc`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch VLANs');
      }

      const vlans = await response.json();
      result = { success: true, data: { vlans } };

    } else if (action === 'create_vlan') {
      const { vlan } = requestData;
      
      const dbVlan = {
        vlan_id: vlan.vlan_id,
        name: vlan.name,
        description: vlan.description,
        subnet: vlan.subnet,
        gateway: vlan.gateway,
        interface_assignment: vlan.interface_assignment,
        isolation_level: vlan.isolation_level || 'standard',
        priority: vlan.priority || 0,
        is_management: vlan.is_management || false,
        is_enabled: vlan.is_enabled !== false
      };
      
      const response = await fetch(`${supabaseUrl}/rest/v1/vlan_catalog`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dbVlan)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create VLAN: ${errorText}`);
      }
      
      const data = await response.json();
      result = { success: true, data };

    } else if (action === 'get_vlan_interfaces') {
      // Get network interface assignments
      const interfaces = [
        {
          name: 'eth0',
          type: 'ethernet',
          status: 'up',
          speed: '1000 Mbps',
          vlans: [1, 10, 20],
          native_vlan: 1
        },
        {
          name: 'wlan0',
          type: 'wireless',
          status: 'up',
          speed: '867 Mbps',
          vlans: [1, 100],
          native_vlan: 1
        },
        {
          name: 'wlan1',
          type: 'wireless',
          status: 'up',
          speed: '867 Mbps',
          vlans: [100],
          native_vlan: 100
        }
      ];
      
      result = { success: true, data: { interfaces } };

    } else if (action === 'update_vlan_interface') {
      const { interfaceName, vlanConfig } = requestData;
      
      // Simulate interface VLAN configuration update
      result = {
        success: true,
        data: {
          interface: interfaceName,
          updated_vlans: vlanConfig.vlans,
          native_vlan: vlanConfig.native_vlan,
          restart_required: true
        }
      };

    // Network Device Management
    } else if (action === 'get_network_devices') {
      const response = await fetch(`${supabaseUrl}/rest/v1/network_devices?select=*&order=last_seen.desc`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });

      let devices = [];
      if (response.ok) {
        devices = await response.json();
      } else {
        // Generate sample device data
        devices = [
          {
            id: '1',
            mac_address: '00:1B:44:11:3A:B7',
            hostname: 'laptop-john',
            ip_address: '192.168.1.105',
            vendor: 'Dell Inc.',
            device_type: 'laptop',
            connection_type: 'wifi',
            vlan_id: 1,
            first_seen: new Date(Date.now() - 86400000 * 7).toISOString(),
            last_seen: new Date(Date.now() - 300000).toISOString(),
            is_online: true,
            is_authorized: true
          },
          {
            id: '2',
            mac_address: '00:50:56:C0:00:08',
            hostname: 'iphone-sarah',
            ip_address: '192.168.1.106',
            vendor: 'Apple Inc.',
            device_type: 'smartphone',
            connection_type: 'wifi',
            vlan_id: 1,
            first_seen: new Date(Date.now() - 86400000 * 3).toISOString(),
            last_seen: new Date(Date.now() - 600000).toISOString(),
            is_online: true,
            is_authorized: true
          },
          {
            id: '3',
            mac_address: '00:23:5A:15:99:42',
            hostname: 'unknown-device',
            ip_address: '192.168.1.150',
            vendor: 'Unknown',
            device_type: 'unknown',
            connection_type: 'ethernet',
            vlan_id: 1,
            first_seen: new Date(Date.now() - 3600000).toISOString(),
            last_seen: new Date(Date.now() - 3600000).toISOString(),
            is_online: false,
            is_authorized: false
          }
        ];
      }
      
      result = { success: true, data: { devices } };

    } else if (action === 'update_device') {
      const { deviceId, updates } = requestData;
      
      // Simulate device update
      result = {
        success: true,
        data: {
          device_id: deviceId,
          updated_fields: Object.keys(updates),
          action_taken: updates.is_blocked ? 'blocked' : updates.is_authorized ? 'authorized' : 'updated'
        }
      };

    } else if (action === 'get_network_statistics') {
      // Get comprehensive network statistics
      const statistics = {
        dhcp: {
          total_pools: 3,
          active_leases: 12,
          available_addresses: 200,
          lease_utilization: '5.7%'
        },
        wifi: {
          total_networks: 2,
          connected_clients: 8,
          total_bandwidth_usage: 450, // Mbps
          avg_signal_strength: -42
        },
        vlans: {
          total_vlans: 4,
          active_vlans: 3,
          inter_vlan_traffic: 125, // Mbps
          isolation_violations: 0
        },
        devices: {
          total_discovered: 15,
          online_devices: 12,
          unauthorized_devices: 1,
          new_devices_24h: 2
        }
      };
      
      result = { success: true, data: { statistics } };

    } else if (action === 'network_discovery_scan') {
      // Simulate network discovery scan
      const discovered_devices = [
        {
          ip_address: '192.168.1.175',
          mac_address: '00:A0:C9:14:C8:29',
          hostname: 'smart-printer',
          vendor: 'HP Inc.',
          device_type: 'printer',
          open_ports: [80, 443, 9100],
          discovered_at: new Date().toISOString()
        },
        {
          ip_address: '192.168.1.180',
          mac_address: '00:04:20:06:55:81',
          hostname: 'security-camera-01',
          vendor: 'Hikvision',
          device_type: 'camera',
          open_ports: [80, 554],
          discovered_at: new Date().toISOString()
        }
      ];
      
      result = {
        success: true,
        data: {
          scan_completed: true,
          devices_found: discovered_devices.length,
          new_devices: discovered_devices,
          scan_duration: '45 seconds'
        }
      };

    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Network management error:', error);
    
    const errorResponse = {
      error: {
        code: 'FUNCTION_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});