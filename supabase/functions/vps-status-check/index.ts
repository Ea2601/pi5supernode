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

        const url = new URL(req.url);
        const vpsServerId = url.searchParams.get('vpsServerId');

        if (!vpsServerId) {
            throw new Error('VPS Server ID is required');
        }

        // Get VPS server details
        const vpsResponse = await fetch(`${supabaseUrl}/rest/v1/vps_servers?id=eq.${vpsServerId}&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!vpsResponse.ok) {
            throw new Error('Failed to fetch VPS server details');
        }

        const vpsServers = await vpsResponse.json();
        if (vpsServers.length === 0) {
            throw new Error('VPS server not found');
        }

        const vpsServer = vpsServers[0];

        // Get installation steps
        const stepsResponse = await fetch(`${supabaseUrl}/rest/v1/vps_installation_steps?vps_server_id=eq.${vpsServerId}&select=*&order=step_order.asc`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!stepsResponse.ok) {
            throw new Error('Failed to fetch installation steps');
        }

        const installationSteps = await stepsResponse.json();

        // Calculate progress
        const totalSteps = installationSteps.length;
        const completedSteps = installationSteps.filter(step => step.status === 'completed').length;
        const failedSteps = installationSteps.filter(step => step.status === 'failed').length;
        const runningSteps = installationSteps.filter(step => step.status === 'running').length;
        
        const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

        // Determine current step
        const currentStep = installationSteps.find(step => step.status === 'running') ||
                          installationSteps.find(step => step.status === 'pending') ||
                          installationSteps[installationSteps.length - 1];

        // Get WireGuard server details if completed
        let wireguardServer = null;
        if (vpsServer.wireguard_server_id) {
            const wgResponse = await fetch(`${supabaseUrl}/rest/v1/wireguard_servers?id=eq.${vpsServer.wireguard_server_id}&select=*`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            if (wgResponse.ok) {
                const wgServers = await wgResponse.json();
                if (wgServers.length > 0) {
                    wireguardServer = wgServers[0];
                }
            }
        }

        // Simulate health check for completed installations
        let healthStatus = 'unknown';
        if (vpsServer.status === 'completed' && wireguardServer) {
            // In a real implementation, this would ping the VPS and check WireGuard status
            healthStatus = Math.random() > 0.1 ? 'healthy' : 'unhealthy'; // 90% success rate simulation
        }

        return new Response(JSON.stringify({
            data: {
                vpsServer: {
                    id: vpsServer.id,
                    vpsName: vpsServer.vps_name,
                    vpsIp: vpsServer.vps_ip,
                    sshUsername: vpsServer.ssh_username,
                    status: vpsServer.status,
                    installationStartedAt: vpsServer.installation_started_at,
                    installationCompletedAt: vpsServer.installation_completed_at,
                    errorMessage: vpsServer.error_message,
                    installationLog: vpsServer.installation_log
                },
                installationProgress: {
                    totalSteps,
                    completedSteps,
                    failedSteps,
                    runningSteps,
                    progressPercentage,
                    currentStep: currentStep ? {
                        name: currentStep.step_name,
                        description: currentStep.step_description,
                        status: currentStep.status,
                        output: currentStep.output,
                        errorMessage: currentStep.error_message
                    } : null
                },
                installationSteps: installationSteps.map(step => ({
                    id: step.id,
                    name: step.step_name,
                    description: step.step_description,
                    status: step.status,
                    order: step.step_order,
                    startedAt: step.started_at,
                    completedAt: step.completed_at,
                    output: step.output,
                    errorMessage: step.error_message
                })),
                wireguardServer: wireguardServer ? {
                    id: wireguardServer.id,
                    serverName: wireguardServer.server_name,
                    publicKey: wireguardServer.public_key,
                    endpoint: wireguardServer.endpoint,
                    network: wireguardServer.network,
                    status: wireguardServer.status,
                    clientCount: wireguardServer.client_count,
                    maxClients: wireguardServer.max_clients
                } : null,
                healthStatus,
                lastChecked: new Date().toISOString()
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('VPS status check error:', error);

        const errorResponse = {
            error: {
                code: 'VPS_STATUS_CHECK_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});