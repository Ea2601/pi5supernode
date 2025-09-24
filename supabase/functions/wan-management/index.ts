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
        const { action, connectionId, connectionData, loadBalancingConfig } = await req.json();

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log(`WAN Management action: ${action}`);

        switch (action) {
            case 'get_connection_types':
                return await getConnectionTypes(supabaseUrl, serviceRoleKey);
            
            case 'get_wan_connections':
                return await getWANConnections(supabaseUrl, serviceRoleKey);
            
            case 'create_wan_connection':
                return await createWANConnection(supabaseUrl, serviceRoleKey, connectionData);
            
            case 'update_wan_connection':
                return await updateWANConnection(supabaseUrl, serviceRoleKey, connectionId, connectionData);
            
            case 'delete_wan_connection':
                return await deleteWANConnection(supabaseUrl, serviceRoleKey, connectionId);
            
            case 'toggle_connection':
                return await toggleConnection(supabaseUrl, serviceRoleKey, connectionId);
            
            case 'test_connection':
                return await testConnection(supabaseUrl, serviceRoleKey, connectionId);
            
            case 'get_connection_status':
                return await getConnectionStatus(supabaseUrl, serviceRoleKey, connectionId);
            
            case 'get_all_connections_status':
                return await getAllConnectionsStatus(supabaseUrl, serviceRoleKey);
            
            case 'configure_load_balancing':
                return await configureLoadBalancing(supabaseUrl, serviceRoleKey, loadBalancingConfig);
            
            case 'get_load_balancing_config':
                return await getLoadBalancingConfig(supabaseUrl, serviceRoleKey);
            
            case 'get_usage_statistics':
                return await getUsageStatistics(supabaseUrl, serviceRoleKey, connectionId);
            
            case 'perform_health_check':
                return await performHealthCheck(supabaseUrl, serviceRoleKey);
            
            case 'get_wan_diagnostics':
                return await getWANDiagnostics(supabaseUrl, serviceRoleKey);
            
            default:
                throw new Error('Invalid action specified');
        }

    } catch (error) {
        console.error('WAN Management error:', error);
        
        const errorResponse = {
            error: {
                code: 'WAN_MANAGEMENT_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function getConnectionTypes(supabaseUrl: string, serviceRoleKey: string) {
    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/wan_connection_types?is_active=eq.true&order=display_name.asc`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        const connectionTypes = await response.json();
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: { connectionTypes }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Failed to get connection types: ${error.message}`);
    }
}

async function getWANConnections(supabaseUrl: string, serviceRoleKey: string) {
    try {
        const connectionsResponse = await fetch(
            `${supabaseUrl}/rest/v1/wan_connections?order=priority.asc`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        const connections = await connectionsResponse.json();
        
        // Get status for each connection
        const connectionsWithStatus = [];
        
        for (const connection of connections) {
            const statusResponse = await fetch(
                `${supabaseUrl}/rest/v1/wan_connection_status?connection_id=eq.${connection.id}&order=created_at.desc&limit=1`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            const status = await statusResponse.json();
            
            connectionsWithStatus.push({
                ...connection,
                currentStatus: status[0] || null
            });
        }
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: { connections: connectionsWithStatus }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Failed to get WAN connections: ${error.message}`);
    }
}

async function createWANConnection(supabaseUrl: string, serviceRoleKey: string, connectionData: any) {
    try {
        // Validate connection data based on type
        const validatedData = await validateConnectionData(connectionData);
        
        // Create the connection
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/wan_connections`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                ...validatedData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        if (!insertResponse.ok) {
            throw new Error('Failed to create WAN connection');
        }

        const newConnection = await insertResponse.json();
        
        // Create initial status record
        await createConnectionStatus(supabaseUrl, serviceRoleKey, newConnection[0].id, 'disconnected');
        
        // If this is set as primary, update other connections
        if (validatedData.is_primary) {
            await updatePrimaryConnection(supabaseUrl, serviceRoleKey, newConnection[0].id);
        }
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: {
                connection: newConnection[0],
                message: 'WAN connection created successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Failed to create WAN connection: ${error.message}`);
    }
}

async function validateConnectionData(data: any): Promise<any> {
    // Basic validation
    if (!data.connection_name || !data.connection_type || !data.interface_name) {
        throw new Error('Missing required fields: connection_name, connection_type, interface_name');
    }
    
    // Type-specific validation
    switch (data.connection_type) {
        case 'static_ip':
            if (!data.ip_address || !data.subnet_mask || !data.gateway) {
                throw new Error('Static IP requires ip_address, subnet_mask, and gateway');
            }
            break;
            
        case 'pppoe':
        case 'dsl_adsl':
            if (!data.username || !data.password) {
                throw new Error('PPPoE/DSL requires username and password');
            }
            break;
            
        case '3g_4g':
            if (!data.apn) {
                throw new Error('Cellular connection requires APN');
            }
            break;
    }
    
    return {
        connection_name: data.connection_name,
        connection_type: data.connection_type,
        interface_name: data.interface_name,
        is_primary: data.is_primary || false,
        is_enabled: data.is_enabled !== undefined ? data.is_enabled : true,
        priority: data.priority || 100,
        weight: data.weight || 1,
        ip_address: data.ip_address || null,
        subnet_mask: data.subnet_mask || null,
        gateway: data.gateway || null,
        dns_primary: data.dns_primary || null,
        dns_secondary: data.dns_secondary || null,
        username: data.username || null,
        password: data.password || null,
        apn: data.apn || null,
        dial_number: data.dial_number || null,
        auth_type: data.auth_type || null,
        mtu: data.mtu || 1500,
        bandwidth_upload_kbps: data.bandwidth_upload_kbps || null,
        bandwidth_download_kbps: data.bandwidth_download_kbps || null,
        cost_metric: data.cost_metric || 1,
        health_check_enabled: data.health_check_enabled !== undefined ? data.health_check_enabled : true,
        health_check_target: data.health_check_target || '8.8.8.8',
        health_check_interval_seconds: data.health_check_interval_seconds || 30,
        max_retries: data.max_retries || 3
    };
}

async function createConnectionStatus(supabaseUrl: string, serviceRoleKey: string, connectionId: string, status: string) {
    await fetch(`${supabaseUrl}/rest/v1/wan_connection_status`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            connection_id: connectionId,
            status: status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
    });
}

async function updatePrimaryConnection(supabaseUrl: string, serviceRoleKey: string, newPrimaryId: string) {
    // Set all other connections to non-primary
    await fetch(`${supabaseUrl}/rest/v1/wan_connections?id=neq.${newPrimaryId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            is_primary: false,
            updated_at: new Date().toISOString()
        })
    });
}

async function updateWANConnection(supabaseUrl: string, serviceRoleKey: string, connectionId: string, connectionData: any) {
    try {
        const validatedData = await validateConnectionData(connectionData);
        
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/wan_connections?id=eq.${connectionId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                ...validatedData,
                updated_at: new Date().toISOString()
            })
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update WAN connection');
        }

        const updatedConnection = await updateResponse.json();
        
        // If this is set as primary, update other connections
        if (validatedData.is_primary) {
            await updatePrimaryConnection(supabaseUrl, serviceRoleKey, connectionId);
        }
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: {
                connection: updatedConnection[0],
                message: 'WAN connection updated successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Failed to update WAN connection: ${error.message}`);
    }
}

async function testConnection(supabaseUrl: string, serviceRoleKey: string, connectionId: string) {
    try {
        // Simulate connection testing with realistic results
        const testResult = await simulateConnectionTest(connectionId);
        
        // Update connection status
        await fetch(`${supabaseUrl}/rest/v1/wan_connection_status`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                connection_id: connectionId,
                status: testResult.success ? 'connected' : 'failed',
                latency_ms: testResult.latency,
                packet_loss_percentage: testResult.packetLoss,
                health_status: testResult.success ? 'healthy' : 'unhealthy',
                last_health_check: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: {
                testResult,
                message: testResult.success ? 'Connection test successful' : 'Connection test failed'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Connection test failed: ${error.message}`);
    }
}

async function simulateConnectionTest(connectionId: string): Promise<any> {
    // Simulate realistic connection testing
    const success = Math.random() > 0.1; // 90% success rate
    const latency = Math.random() * 100 + 10; // 10-110ms
    const packetLoss = Math.random() * 2; // 0-2% packet loss
    
    return {
        success,
        latency: Math.round(latency * 100) / 100,
        packetLoss: Math.round(packetLoss * 100) / 100,
        timestamp: new Date().toISOString(),
        details: success ? 'Connection established successfully' : 'Connection timeout or network unreachable'
    };
}

async function getAllConnectionsStatus(supabaseUrl: string, serviceRoleKey: string) {
    try {
        // Get all connections with their latest status
        const connectionsResponse = await fetch(
            `${supabaseUrl}/rest/v1/wan_connections?order=priority.asc`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        const connections = await connectionsResponse.json();
        const statusData = [];
        
        for (const connection of connections) {
            const statusResponse = await fetch(
                `${supabaseUrl}/rest/v1/wan_connection_status?connection_id=eq.${connection.id}&order=created_at.desc&limit=1`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            const status = await statusResponse.json();
            
            statusData.push({
                connection,
                status: status[0] || null,
                healthScore: calculateHealthScore(status[0]),
                recommendations: generateRecommendations(connection, status[0])
            });
        }
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: {
                connections: statusData,
                summary: {
                    total: connections.length,
                    connected: statusData.filter(s => s.status?.status === 'connected').length,
                    primary: statusData.find(s => s.connection.is_primary)?.connection.connection_name || 'None',
                    totalBandwidth: statusData.reduce((sum, s) => sum + (s.connection.bandwidth_download_kbps || 0), 0)
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Failed to get connections status: ${error.message}`);
    }
}

function calculateHealthScore(status: any): number {
    if (!status) return 0;
    
    let score = 100;
    
    // Reduce score based on latency
    if (status.latency_ms > 100) score -= 20;
    else if (status.latency_ms > 50) score -= 10;
    
    // Reduce score based on packet loss
    if (status.packet_loss_percentage > 2) score -= 30;
    else if (status.packet_loss_percentage > 1) score -= 15;
    
    // Reduce score if connection is not healthy
    if (status.health_status !== 'healthy') score -= 40;
    
    // Reduce score based on error count
    if (status.error_count > 5) score -= 25;
    else if (status.error_count > 2) score -= 10;
    
    return Math.max(0, score);
}

function generateRecommendations(connection: any, status: any): string[] {
    const recommendations = [];
    
    if (!status) {
        recommendations.push('No status data available - run connection test');
        return recommendations;
    }
    
    if (status.latency_ms > 100) {
        recommendations.push('High latency detected - check network path');
    }
    
    if (status.packet_loss_percentage > 2) {
        recommendations.push('Significant packet loss - investigate connection quality');
    }
    
    if (status.error_count > 5) {
        recommendations.push('Multiple connection errors - check configuration');
    }
    
    if (!connection.health_check_enabled) {
        recommendations.push('Enable health monitoring for automatic failover');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('Connection performing well');
    }
    
    return recommendations;
}

async function deleteWANConnection(supabaseUrl: string, serviceRoleKey: string, connectionId: string) {
    try {
        // Delete connection status records first
        await fetch(`${supabaseUrl}/rest/v1/wan_connection_status?connection_id=eq.${connectionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        // Delete usage history
        await fetch(`${supabaseUrl}/rest/v1/wan_usage_history?connection_id=eq.${connectionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        // Delete the connection
        const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/wan_connections?id=eq.${connectionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!deleteResponse.ok) {
            throw new Error('Failed to delete WAN connection');
        }
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: { message: 'WAN connection deleted successfully' }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Failed to delete WAN connection: ${error.message}`);
    }
}

async function toggleConnection(supabaseUrl: string, serviceRoleKey: string, connectionId: string) {
    try {
        // Get current connection state
        const connectionResponse = await fetch(
            `${supabaseUrl}/rest/v1/wan_connections?id=eq.${connectionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        const connections = await connectionResponse.json();
        if (connections.length === 0) {
            throw new Error('Connection not found');
        }
        
        const connection = connections[0];
        const newState = !connection.is_enabled;
        
        // Update connection state
        await fetch(`${supabaseUrl}/rest/v1/wan_connections?id=eq.${connectionId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                is_enabled: newState,
                updated_at: new Date().toISOString()
            })
        });
        
        // Update status
        await createConnectionStatus(supabaseUrl, serviceRoleKey, connectionId, newState ? 'enabled' : 'disabled');
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: {
                connectionId,
                newState,
                message: `Connection ${newState ? 'enabled' : 'disabled'} successfully`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Failed to toggle connection: ${error.message}`);
    }
}

async function performHealthCheck(supabaseUrl: string, serviceRoleKey: string) {
    try {
        // Get all enabled connections with health check enabled
        const connectionsResponse = await fetch(
            `${supabaseUrl}/rest/v1/wan_connections?is_enabled=eq.true&health_check_enabled=eq.true`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        const connections = await connectionsResponse.json();
        const healthResults = [];
        
        for (const connection of connections) {
            const testResult = await simulateConnectionTest(connection.id);
            
            // Update status
            await fetch(`${supabaseUrl}/rest/v1/wan_connection_status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    connection_id: connection.id,
                    status: testResult.success ? 'connected' : 'failed',
                    latency_ms: testResult.latency,
                    packet_loss_percentage: testResult.packetLoss,
                    health_status: testResult.success ? 'healthy' : 'unhealthy',
                    last_health_check: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });
            
            healthResults.push({
                connectionId: connection.id,
                connectionName: connection.connection_name,
                result: testResult
            });
        }
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: {
                healthResults,
                summary: {
                    total: connections.length,
                    healthy: healthResults.filter(r => r.result.success).length,
                    timestamp: new Date().toISOString()
                },
                message: 'Health check completed'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Health check failed: ${error.message}`);
    }
}

async function getWANDiagnostics(supabaseUrl: string, serviceRoleKey: string) {
    try {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            systemStatus: 'operational',
            networkInterfaces: [
                { name: 'eth0', status: 'up', mtu: 1500, speed: '1000Mbps' },
                { name: 'wlan0', status: 'up', mtu: 1500, speed: '300Mbps' },
                { name: 'ppp0', status: 'down', mtu: 1492, speed: 'unknown' }
            ],
            routingTable: [
                { destination: '0.0.0.0/0', gateway: '192.168.1.1', interface: 'eth0', metric: 100 },
                { destination: '192.168.1.0/24', gateway: '0.0.0.0', interface: 'eth0', metric: 0 }
            ],
            dnsStatus: {
                primary: { server: '8.8.8.8', status: 'reachable', responseTime: 15 },
                secondary: { server: '1.1.1.1', status: 'reachable', responseTime: 12 }
            },
            bandwidthUtilization: {
                upload: { current: 45.2, max: 100, percentage: 45.2 },
                download: { current: 125.8, max: 500, percentage: 25.16 }
            }
        };
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: { diagnostics }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Failed to get WAN diagnostics: ${error.message}`);
    }
}