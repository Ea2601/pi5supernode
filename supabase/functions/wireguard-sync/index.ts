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
        const { serverIds, syncType = 'full' } = await req.json();

        if (!serverIds || !Array.isArray(serverIds)) {
            throw new Error('Server IDs array is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log(`Starting WireGuard sync for ${serverIds.length} servers, type: ${syncType}`);

        const results = [];

        for (const serverId of serverIds) {
            try {
                // Get server configuration
                const serverResponse = await fetch(`${supabaseUrl}/rest/v1/wireguard_servers?id=eq.${serverId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!serverResponse.ok) {
                    throw new Error(`Failed to fetch server ${serverId}`);
                }

                const servers = await serverResponse.json();
                if (servers.length === 0) {
                    throw new Error(`Server ${serverId} not found`);
                }

                const server = servers[0];

                // Get active clients for this server
                const clientsResponse = await fetch(`${supabaseUrl}/rest/v1/wireguard_clients?server_id=eq.${serverId}&is_active=eq.true`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!clientsResponse.ok) {
                    throw new Error(`Failed to fetch clients for server ${serverId}`);
                }

                const clients = await clientsResponse.json();

                // Generate WireGuard configuration
                let wgConfig = `[Interface]\n`;
                wgConfig += `PrivateKey = ${server.private_key}\n`;
                wgConfig += `Address = ${server.network}\n`;
                wgConfig += `ListenPort = ${server.listen_port}\n\n`;

                // Add client configurations
                for (const client of clients) {
                    wgConfig += `[Peer]\n`;
                    wgConfig += `PublicKey = ${client.public_key}\n`;
                    wgConfig += `AllowedIPs = ${client.assigned_ip}/32\n`;
                    if (client.preshared_key) {
                        wgConfig += `PresharedKey = ${client.preshared_key}\n`;
                    }
                    wgConfig += `\n`;
                }

                // Update server status
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/wireguard_servers?id=eq.${serverId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        client_count: clients.length,
                        updated_at: new Date().toISOString()
                    })
                });

                if (!updateResponse.ok) {
                    console.warn(`Failed to update server ${serverId} status`);
                }

                results.push({
                    serverId,
                    success: true,
                    clientCount: clients.length,
                    configGenerated: true
                });

                console.log(`Successfully synced server ${serverId} with ${clients.length} clients`);

            } catch (error) {
                console.error(`Failed to sync server ${serverId}:`, error.message);
                results.push({
                    serverId,
                    success: false,
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        return new Response(JSON.stringify({
            data: {
                syncType,
                totalServers: serverIds.length,
                successful: successCount,
                failed: failureCount,
                results
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('WireGuard sync error:', error);

        const errorResponse = {
            error: {
                code: 'WIREGUARD_SYNC_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});