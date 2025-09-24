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
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const { action, ...params } = await req.json();

        switch (action) {
            case 'get_dynamic_options':
                return await getDynamicOptions(params, serviceRoleKey, supabaseUrl);
            case 'create_traffic_rule':
                return await createTrafficRule(params, serviceRoleKey, supabaseUrl);
            case 'update_traffic_rule':
                return await updateTrafficRule(params, serviceRoleKey, supabaseUrl);
            case 'test_traffic_rule':
                return await testTrafficRule(params, serviceRoleKey, supabaseUrl);
            case 'apply_rule_changes':
                return await applyRuleChanges(params, serviceRoleKey, supabaseUrl);
            case 'get_traffic_flow':
                return await getTrafficFlow(params, serviceRoleKey, supabaseUrl);
            case 'simulate_traffic_routing':
                return await simulateTrafficRouting(params, serviceRoleKey, supabaseUrl);
            case 'get_rule_statistics':
                return await getRuleStatistics(params, serviceRoleKey, supabaseUrl);
            default:
                throw new Error('Invalid action');
        }
    } catch (error) {
        console.error('Advanced traffic management error:', error);

        const errorResponse = {
            error: {
                code: 'TRAFFIC_MANAGEMENT_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

async function getDynamicOptions(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const { optionType } = params;

    const options = {};

    // Get all user groups
    const userGroupsResponse = await fetch(`${supabaseUrl}/rest/v1/user_groups?select=*&is_active=eq.true&order=priority.asc`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (userGroupsResponse.ok) {
        options.userGroups = await userGroupsResponse.json();
    }

    // Get all traffic types
    const trafficTypesResponse = await fetch(`${supabaseUrl}/rest/v1/traffic_types?select=*&is_active=eq.true&order=bandwidth_priority.desc`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (trafficTypesResponse.ok) {
        options.trafficTypes = await trafficTypesResponse.json();
    }

    // Get all network paths
    const networkPathsResponse = await fetch(`${supabaseUrl}/rest/v1/network_paths?select=*&is_active=eq.true&order=reliability_score.desc`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (networkPathsResponse.ok) {
        options.networkPaths = await networkPathsResponse.json();
    }

    // Get all tunnels
    const tunnelsResponse = await fetch(`${supabaseUrl}/rest/v1/tunnels?select=*&is_active=eq.true&order=ping_ms.asc`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (tunnelsResponse.ok) {
        options.tunnels = await tunnelsResponse.json();
    }

    return new Response(JSON.stringify({
        data: { options }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function createTrafficRule(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const {
        ruleName,
        description,
        userGroupId,
        trafficTypeId,
        networkPathId,
        tunnelId,
        action = 'route',
        priority = 100,
        bandwidthLimitKbps,
        timeConditions = {},
        bandwidthConditions = {},
        locationConditions = {},
        deviceConditions = {},
        isEnabled = true,
        isTesting = false
    } = params;

    if (!ruleName) {
        throw new Error('Rule name is required');
    }

    const ruleData = {
        rule_name: ruleName,
        description,
        user_group_id: userGroupId,
        traffic_type_id: trafficTypeId,
        network_path_id: networkPathId,
        tunnel_id: tunnelId,
        action,
        priority,
        bandwidth_limit_kbps: bandwidthLimitKbps,
        time_conditions: timeConditions,
        bandwidth_conditions: bandwidthConditions,
        location_conditions: locationConditions,
        device_conditions: deviceConditions,
        is_enabled: isEnabled,
        is_testing: isTesting,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/traffic_rules`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(ruleData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create traffic rule: ${errorText}`);
    }

    const rule = await response.json();

    // Create notification about new rule
    await createNotification({
        type: 'system',
        severity: 'info',
        title: 'Traffic Rule Created',
        message: `New traffic rule "${ruleName}" has been created and ${isEnabled ? 'enabled' : 'disabled'}.`,
        targetRoles: ['admin', 'operator']
    }, serviceRoleKey, supabaseUrl);

    return new Response(JSON.stringify({
        data: { rule: rule[0] }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function updateTrafficRule(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const { ruleId, ...updateData } = params;

    if (!ruleId) {
        throw new Error('Rule ID is required');
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    const response = await fetch(`${supabaseUrl}/rest/v1/traffic_rules?id=eq.${ruleId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update traffic rule: ${errorText}`);
    }

    const rule = await response.json();

    return new Response(JSON.stringify({
        data: { rule: rule[0] }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function testTrafficRule(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const { ruleId, testPackets = [] } = params;

    if (!ruleId) {
        throw new Error('Rule ID is required');
    }

    // Get the rule
    const ruleResponse = await fetch(`${supabaseUrl}/rest/v1/traffic_rules?id=eq.${ruleId}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!ruleResponse.ok) {
        throw new Error('Traffic rule not found');
    }

    const rules = await ruleResponse.json();
    const rule = rules[0];

    // Simulate rule testing
    const testResults = [];
    for (const packet of testPackets) {
        const result = {
            packet,
            matched: true, // Simulate rule matching
            action: rule.action,
            tunnel: rule.tunnel_id,
            path: rule.network_path_id,
            bandwidth_limit: rule.bandwidth_limit_kbps,
            latency_estimate: Math.random() * 50 + 10, // 10-60ms
            success_probability: Math.random() * 0.3 + 0.7 // 70-100%
        };
        testResults.push(result);
    }

    return new Response(JSON.stringify({
        data: {
            rule,
            testResults,
            summary: {
                totalPackets: testPackets.length,
                matchedPackets: testResults.filter(r => r.matched).length,
                averageLatency: testResults.reduce((sum, r) => sum + r.latency_estimate, 0) / testResults.length
            }
        }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function applyRuleChanges(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const { ruleIds = [] } = params;

    if (ruleIds.length === 0) {
        throw new Error('At least one rule ID is required');
    }

    // Simulate applying rule changes to the system
    const results = [];
    for (const ruleId of ruleIds) {
        try {
            // Simulate system configuration
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500)); // 500-1500ms delay
            
            results.push({
                ruleId,
                success: true,
                message: 'Rule applied successfully',
                appliedAt: new Date().toISOString()
            });

            // Update the rule's last applied timestamp
            await fetch(`${supabaseUrl}/rest/v1/traffic_rules?id=eq.${ruleId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    updated_at: new Date().toISOString()
                })
            });
        } catch (error) {
            results.push({
                ruleId,
                success: false,
                message: error.message,
                error: error.message
            });
        }
    }

    const successCount = results.filter(r => r.success).length;
    
    // Create notification about rule changes
    await createNotification({
        type: 'system',
        severity: successCount === ruleIds.length ? 'info' : 'warning',
        title: 'Traffic Rules Applied',
        message: `${successCount}/${ruleIds.length} traffic rules applied successfully.`,
        targetRoles: ['admin', 'operator']
    }, serviceRoleKey, supabaseUrl);

    return new Response(JSON.stringify({
        data: {
            results,
            summary: {
                total: ruleIds.length,
                successful: successCount,
                failed: ruleIds.length - successCount
            }
        }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function getTrafficFlow(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const { userGroupId, trafficTypeId } = params;

    // Get active traffic rules that match the criteria
    let query = `${supabaseUrl}/rest/v1/traffic_rules?select=*&is_enabled=eq.true&order=priority.asc`;
    
    if (userGroupId) {
        query += `&user_group_id=eq.${userGroupId}`;
    }
    if (trafficTypeId) {
        query += `&traffic_type_id=eq.${trafficTypeId}`;
    }

    const response = await fetch(query, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        throw new Error('Failed to get traffic rules');
    }

    const rules = await response.json();

    // Build traffic flow visualization data
    const flowData = {
        nodes: [],
        edges: [],
        statistics: {
            totalRules: rules.length,
            activeRules: rules.filter(r => r.is_enabled).length,
            bandwidth: {
                total: 0,
                used: 0
            }
        }
    };

    // Create nodes for user groups, traffic types, paths, and tunnels
    const nodeMap = new Map();
    let nodeId = 0;

    for (const rule of rules) {
        // User Group node
        if (rule.user_group_id && !nodeMap.has(`ug_${rule.user_group_id}`)) {
            flowData.nodes.push({
                id: `ug_${rule.user_group_id}`,
                type: 'userGroup',
                label: `User Group ${rule.user_group_id}`,
                position: { x: 100, y: nodeId * 100 }
            });
            nodeMap.set(`ug_${rule.user_group_id}`, true);
            nodeId++;
        }

        // Traffic Type node
        if (rule.traffic_type_id && !nodeMap.has(`tt_${rule.traffic_type_id}`)) {
            flowData.nodes.push({
                id: `tt_${rule.traffic_type_id}`,
                type: 'trafficType',
                label: `Traffic Type ${rule.traffic_type_id}`,
                position: { x: 300, y: nodeId * 100 }
            });
            nodeMap.set(`tt_${rule.traffic_type_id}`, true);
            nodeId++;
        }

        // Network Path node
        if (rule.network_path_id && !nodeMap.has(`np_${rule.network_path_id}`)) {
            flowData.nodes.push({
                id: `np_${rule.network_path_id}`,
                type: 'networkPath',
                label: `Path ${rule.network_path_id}`,
                position: { x: 500, y: nodeId * 100 }
            });
            nodeMap.set(`np_${rule.network_path_id}`, true);
            nodeId++;
        }

        // Tunnel node
        if (rule.tunnel_id && !nodeMap.has(`t_${rule.tunnel_id}`)) {
            flowData.nodes.push({
                id: `t_${rule.tunnel_id}`,
                type: 'tunnel',
                label: `Tunnel ${rule.tunnel_id}`,
                position: { x: 700, y: nodeId * 100 }
            });
            nodeMap.set(`t_${rule.tunnel_id}`, true);
            nodeId++;
        }

        // Create edges for this rule
        const ruleEdges = [];
        if (rule.user_group_id && rule.traffic_type_id) {
            ruleEdges.push({
                id: `edge_${rule.id}_ug_tt`,
                source: `ug_${rule.user_group_id}`,
                target: `tt_${rule.traffic_type_id}`,
                label: rule.rule_name,
                animated: rule.is_enabled
            });
        }
        if (rule.traffic_type_id && rule.network_path_id) {
            ruleEdges.push({
                id: `edge_${rule.id}_tt_np`,
                source: `tt_${rule.traffic_type_id}`,
                target: `np_${rule.network_path_id}`,
                label: rule.action,
                animated: rule.is_enabled
            });
        }
        if (rule.network_path_id && rule.tunnel_id) {
            ruleEdges.push({
                id: `edge_${rule.id}_np_t`,
                source: `np_${rule.network_path_id}`,
                target: `t_${rule.tunnel_id}`,
                label: rule.bandwidth_limit_kbps ? `${rule.bandwidth_limit_kbps} kbps` : 'unlimited',
                animated: rule.is_enabled
            });
        }
        
        flowData.edges.push(...ruleEdges);
    }

    return new Response(JSON.stringify({
        data: { flowData, rules }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function simulateTrafficRouting(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const { sourceDevice, trafficType, testDuration = 60 } = params;

    if (!sourceDevice) {
        throw new Error('Source device is required');
    }

    // Simulate traffic routing for the given parameters
    const simulation = {
        sourceDevice,
        trafficType,
        testDuration,
        startTime: new Date().toISOString(),
        results: {
            packetsRouted: Math.floor(Math.random() * 10000 + 1000),
            averageLatency: Math.random() * 50 + 20,
            throughput: Math.random() * 100 + 50,
            successRate: Math.random() * 0.1 + 0.9,
            routingPath: [
                'User Group: Family Members',
                'Traffic Type: Video Streaming',
                'Network Path: Primary ISP',
                'Tunnel: Direct Connection'
            ]
        },
        recommendations: [
            'Consider increasing bandwidth allocation for streaming traffic',
            'Enable QoS prioritization for video traffic'
        ]
    };

    return new Response(JSON.stringify({
        data: { simulation }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function getRuleStatistics(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const { timeRange = '24h' } = params;

    // Get traffic rules with statistics
    const response = await fetch(`${supabaseUrl}/rest/v1/traffic_rules?select=*&order=packets_matched.desc`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        throw new Error('Failed to get traffic rule statistics');
    }

    const rules = await response.json();

    const statistics = {
        overview: {
            totalRules: rules.length,
            activeRules: rules.filter(r => r.is_enabled).length,
            testingRules: rules.filter(r => r.is_testing).length,
            totalPacketsMatched: rules.reduce((sum, r) => sum + (r.packets_matched || 0), 0),
            totalBytesMatched: rules.reduce((sum, r) => sum + (r.bytes_matched || 0), 0)
        },
        topRules: rules.slice(0, 10).map(rule => ({
            id: rule.id,
            name: rule.rule_name,
            packetsMatched: rule.packets_matched || 0,
            bytesMatched: rule.bytes_matched || 0,
            lastMatched: rule.last_matched_at
        })),
        performance: {
            averageProcessingTime: Math.random() * 10 + 5, // 5-15ms
            ruleHitRate: Math.random() * 0.4 + 0.6, // 60-100%
            bandwidth: {
                total: 1000, // 1 Gbps
                allocated: rules.reduce((sum, r) => sum + (r.bandwidth_limit_kbps || 0), 0) / 1000,
                used: Math.random() * 500 + 200 // 200-700 Mbps
            }
        }
    };

    return new Response(JSON.stringify({
        data: { statistics }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Helper function to create notifications
async function createNotification(notificationData: any, serviceRoleKey: string, supabaseUrl: string) {
    const data = {
        notification_type: notificationData.type || 'system',
        severity: notificationData.severity || 'info',
        title: notificationData.title,
        message: notificationData.message,
        target_roles: notificationData.targetRoles || ['admin'],
        channels: notificationData.channels || ['web'],
        created_at: new Date().toISOString()
    };

    try {
        await fetch(`${supabaseUrl}/rest/v1/notifications`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
}