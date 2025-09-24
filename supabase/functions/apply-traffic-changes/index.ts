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
        const { changes, applyImmediately = false } = await req.json();

        if (!changes || !Array.isArray(changes)) {
            throw new Error('Changes array is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log(`Applying ${changes.length} traffic rule changes`);

        const results = [];

        for (const change of changes) {
            try {
                const { type, ruleId, ruleData } = change;

                switch (type) {
                    case 'create':
                        const createResponse = await fetch(`${supabaseUrl}/rest/v1/traffic_rules`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=representation'
                            },
                            body: JSON.stringify({
                                ...ruleData,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            })
                        });

                        if (!createResponse.ok) {
                            throw new Error(`Failed to create rule: ${await createResponse.text()}`);
                        }

                        const newRule = await createResponse.json();
                        results.push({ type: 'create', ruleId: newRule[0].id, success: true });
                        break;

                    case 'update':
                        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/traffic_rules?id=eq.${ruleId}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                ...ruleData,
                                updated_at: new Date().toISOString()
                            })
                        });

                        if (!updateResponse.ok) {
                            throw new Error(`Failed to update rule ${ruleId}: ${await updateResponse.text()}`);
                        }

                        results.push({ type: 'update', ruleId, success: true });
                        break;

                    case 'delete':
                        const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/traffic_rules?id=eq.${ruleId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (!deleteResponse.ok) {
                            throw new Error(`Failed to delete rule ${ruleId}: ${await deleteResponse.text()}`);
                        }

                        results.push({ type: 'delete', ruleId, success: true });
                        break;

                    case 'enable':
                    case 'disable':
                        const statusResponse = await fetch(`${supabaseUrl}/rest/v1/traffic_rules?id=eq.${ruleId}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                enabled: type === 'enable',
                                updated_at: new Date().toISOString()
                            })
                        });

                        if (!statusResponse.ok) {
                            throw new Error(`Failed to ${type} rule ${ruleId}: ${await statusResponse.text()}`);
                        }

                        results.push({ type, ruleId, success: true });
                        break;

                    default:
                        throw new Error(`Unknown change type: ${type}`);
                }

                console.log(`Successfully applied ${type} change for rule ${ruleId || 'new'}`);

            } catch (error) {
                console.error(`Failed to apply change:`, error.message);
                results.push({ 
                    type: change.type, 
                    ruleId: change.ruleId, 
                    success: false, 
                    error: error.message 
                });
            }
        }

        // If applying immediately, trigger system configuration update
        if (applyImmediately) {
            try {
                // Log the configuration change
                await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        event_type: 'traffic_rules_applied',
                        event_category: 'network_management',
                        action: 'apply_traffic_changes',
                        details: {
                            changes_count: changes.length,
                            successful: results.filter(r => r.success).length,
                            failed: results.filter(r => !r.success).length
                        },
                        severity: 'info',
                        created_at: new Date().toISOString()
                    })
                });
            } catch (logError) {
                console.warn('Failed to create audit log:', logError.message);
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        return new Response(JSON.stringify({
            data: {
                totalChanges: changes.length,
                successful: successCount,
                failed: failureCount,
                appliedImmediately: applyImmediately,
                results
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Apply traffic changes error:', error);

        const errorResponse = {
            error: {
                code: 'APPLY_TRAFFIC_CHANGES_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});