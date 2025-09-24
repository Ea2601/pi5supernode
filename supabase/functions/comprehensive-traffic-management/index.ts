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

    if (action === 'get_all_rules') {
      // Fetch all traffic rules first
      const rulesResponse = await fetch(`${supabaseUrl}/rest/v1/traffic_rules?select=*&order=priority.asc`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      if (!rulesResponse.ok) {
        throw new Error(`Failed to fetch rules: ${rulesResponse.statusText}`);
      }

      const rules = await rulesResponse.json();
      
      // Get related data for each rule
      const [userGroupsRes, trafficTypesRes, networkPathsRes, tunnelsRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/user_groups?select=id,group_name,color_code`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/traffic_types?select=id,type_name,category`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/network_paths?select=id,path_name,path_type`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/tunnels?select=id,tunnel_name,tunnel_type,status`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        })
      ]);
      
      const [userGroups, trafficTypes, networkPaths, tunnels] = await Promise.all([
        userGroupsRes.json(),
        trafficTypesRes.json(),
        networkPathsRes.json(),
        tunnelsRes.json()
      ]);
      
      // Enrich rules with related data
      const enrichedRules = rules.map(rule => ({
        ...rule,
        user_group: userGroups.find(ug => ug.id === rule.user_group_id),
        traffic_type: trafficTypes.find(tt => tt.id === rule.traffic_type_id),
        network_path: networkPaths.find(np => np.id === rule.network_path_id),
        tunnel: tunnels.find(t => t.id === rule.tunnel_id)
      }));
      
      result = { success: true, data: { rules: enrichedRules } };

    } else if (action === 'get_dropdown_options') {
      // Fetch all dropdown options
      const [userGroupsRes, trafficTypesRes, networkPathsRes, tunnelsRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/user_groups?select=id,group_name,description,color_code&is_active=eq.true&order=group_name.asc`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/traffic_types?select=id,type_name,description,category&is_active=eq.true&order=type_name.asc`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/network_paths?select=id,path_name,description,path_type&is_active=eq.true&order=path_name.asc`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/tunnels?select=id,tunnel_name,tunnel_type,description,status&is_active=eq.true&order=tunnel_name.asc`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        })
      ]);

      if (!userGroupsRes.ok || !trafficTypesRes.ok || !networkPathsRes.ok || !tunnelsRes.ok) {
        throw new Error('Failed to fetch dropdown options');
      }

      const [userGroups, trafficTypes, networkPaths, tunnels] = await Promise.all([
        userGroupsRes.json(),
        trafficTypesRes.json(),
        networkPathsRes.json(),
        tunnelsRes.json()
      ]);

      result = {
        success: true,
        data: {
          userGroups,
          trafficTypes,
          networkPaths,
          tunnels
        }
      };

    } else if (action === 'create_rule') {
      // Create new traffic rule
      const { rule } = requestData;
      
      const dbRule = {
        rule_name: rule.rule_name || rule.ruleName,
        description: rule.description,
        user_group_id: rule.user_group_id || rule.userGroupId,
        traffic_type_id: rule.traffic_type_id || rule.trafficTypeId,
        network_path_id: rule.network_path_id || rule.networkPathId,
        tunnel_id: rule.tunnel_id || rule.tunnelId,
        action: rule.action || 'route',
        priority: rule.priority || 100,
        bandwidth_limit_kbps: rule.bandwidth_limit_kbps || rule.bandwidthLimitKbps,
        is_enabled: rule.is_enabled !== false,
        is_testing: rule.is_testing || false
      };
      
      const response = await fetch(`${supabaseUrl}/rest/v1/traffic_rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dbRule)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create rule: ${errorText}`);
      }
      
      const data = await response.json();
      result = { success: true, data };
      
    } else if (action === 'update_rule') {
      // Update existing traffic rule
      const { ruleId, updates } = requestData;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/traffic_rules?id=eq.${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update rule: ${errorText}`);
      }
      
      const data = await response.json();
      result = { success: true, data };
      
    } else if (action === 'delete_rule') {
      // Delete traffic rule
      const { ruleId } = requestData;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/traffic_rules?id=eq.${ruleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete rule: ${errorText}`);
      }
      
      result = { success: true, message: 'Rule deleted successfully' };
      
    } else if (action === 'get_statistics') {
      // Get traffic rules statistics
      const statsResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_traffic_rules_stats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      let statistics = {
        overview: {
          totalRules: 0,
          activeRules: 0,
          totalPacketsMatched: 0,
          totalBytesMatched: 0
        },
        performance: {
          bandwidth: {
            used: 0,
            available: 1000
          }
        }
      };

      if (statsResponse.ok) {
        statistics = await statsResponse.json();
      } else {
        // Fallback: calculate basic stats from rules table
        const rulesResponse = await fetch(`${supabaseUrl}/rest/v1/traffic_rules?select=is_enabled,packets_matched,bytes_matched`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        });
        
        if (rulesResponse.ok) {
          const rules = await rulesResponse.json();
          statistics.overview.totalRules = rules.length;
          statistics.overview.activeRules = rules.filter((r: any) => r.is_enabled).length;
          statistics.overview.totalPacketsMatched = rules.reduce((sum: number, r: any) => sum + (r.packets_matched || 0), 0);
          statistics.overview.totalBytesMatched = rules.reduce((sum: number, r: any) => sum + (r.bytes_matched || 0), 0);
        }
      }
      
      result = { success: true, data: { statistics } };
      
    } else if (action === 'test_rule') {
      // Test a traffic rule (simulate)
      const { ruleId, testPackets } = requestData;
      
      // This is a simulation - in reality this would test against actual network traffic
      const testResults = testPackets?.map((packet: any, index: number) => ({
        packetId: index + 1,
        source: packet.source,
        destination: packet.destination,
        protocol: packet.protocol,
        port: packet.port,
        matched: Math.random() > 0.5, // Simulate random matching
        action: 'route',
        processingTime: Math.floor(Math.random() * 10) + 1
      })) || [];
      
      result = {
        success: true,
        data: {
          ruleId,
          testResults,
          summary: {
            totalPackets: testResults.length,
            matchedPackets: testResults.filter((r: any) => r.matched).length,
            avgProcessingTime: testResults.reduce((sum: number, r: any) => sum + r.processingTime, 0) / testResults.length
          }
        }
      };
      
    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Traffic management error:', error);
    
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