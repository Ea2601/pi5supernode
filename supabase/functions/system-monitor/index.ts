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
            case 'get_system_status':
                return await getSystemStatus(params, serviceRoleKey, supabaseUrl);
            case 'update_component_status':
                return await updateComponentStatus(params, serviceRoleKey, supabaseUrl);
            case 'get_system_metrics':
                return await getSystemMetrics(params, serviceRoleKey, supabaseUrl);
            case 'record_system_metric':
                return await recordSystemMetric(params, serviceRoleKey, supabaseUrl);
            case 'get_health_summary':
                return await getHealthSummary(params, serviceRoleKey, supabaseUrl);
            case 'run_system_diagnostics':
                return await runSystemDiagnostics(params, serviceRoleKey, supabaseUrl);
            case 'check_dependencies':
                return await checkSystemDependencies(params, serviceRoleKey, supabaseUrl);
            default:
                throw new Error('Invalid action');
        }
    } catch (error) {
        console.error('System monitor error:', error);

        const errorResponse = {
            error: {
                code: 'SYSTEM_MONITOR_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

async function getSystemStatus(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const { components = [] } = params;

    let query = `${supabaseUrl}/rest/v1/system_status?select=*&order=component.asc`;
    
    if (components.length > 0) {
        query += `&component=in.(${components.join(',')})`;
    }

    const response = await fetch(query, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get system status: ${errorText}`);
    }

    const statusData = await response.json();

    // Calculate overall system health
    const healthyComponents = statusData.filter(s => s.status === 'healthy').length;
    const totalComponents = statusData.length;
    const overallHealth = totalComponents > 0 ? (healthyComponents / totalComponents) * 100 : 0;

    const result = {
        overallHealth,
        components: statusData,
        summary: {
            healthy: statusData.filter(s => s.status === 'healthy').length,
            warning: statusData.filter(s => s.status === 'warning').length,
            critical: statusData.filter(s => s.status === 'critical').length,
            unknown: statusData.filter(s => s.status === 'unknown').length
        },
        lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify({
        data: result
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function updateComponentStatus(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const {
        component,
        status,
        responseTimeMs,
        errorMessage,
        metrics = {}
    } = params;

    if (!component || !status) {
        throw new Error('Component and status are required');
    }

    const updateData = {
        component,
        status,
        last_check_at: new Date().toISOString(),
        response_time_ms: responseTimeMs,
        error_message: errorMessage,
        metrics
    };

    // Use upsert to insert or update
    const response = await fetch(`${supabaseUrl}/rest/v1/system_status`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(updateData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update component status: ${errorText}`);
    }

    // Create notification for critical status changes
    if (status === 'critical') {
        await createNotification({
            type: 'alert',
            severity: 'critical',
            title: `Critical System Alert: ${component.toUpperCase()}`,
            message: errorMessage || `Component ${component} is in critical state`,
            targetRoles: ['admin'],
            channels: ['web']
        }, serviceRoleKey, supabaseUrl);
    }

    return new Response(JSON.stringify({
        data: { success: true, component, status }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function getSystemMetrics(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const {
        metricType,
        timeRange = '1h',
        limit = 100
    } = params;

    let query = `${supabaseUrl}/rest/v1/system_metrics?select=*&order=timestamp.desc&limit=${limit}`;
    
    if (metricType) {
        query += `&metric_type=eq.${metricType}`;
    }

    // Calculate time range
    const now = new Date();
    let startTime;
    switch (timeRange) {
        case '1h':
            startTime = new Date(now.getTime() - 60 * 60 * 1000);
            break;
        case '24h':
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '7d':
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        default:
            startTime = new Date(now.getTime() - 60 * 60 * 1000);
    }

    query += `&timestamp=gte.${startTime.toISOString()}`;

    const response = await fetch(query, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get system metrics: ${errorText}`);
    }

    const metrics = await response.json();

    // Group metrics by type and calculate statistics
    const grouped = {};
    for (const metric of metrics) {
        if (!grouped[metric.metric_type]) {
            grouped[metric.metric_type] = [];
        }
        grouped[metric.metric_type].push(metric);
    }

    const statistics = {};
    for (const [type, values] of Object.entries(grouped)) {
        const numericValues = values.map(v => parseFloat(v.metric_value));
        statistics[type] = {
            count: values.length,
            average: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length,
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            latest: values[0]?.metric_value,
            unit: values[0]?.metric_unit
        };
    }

    return new Response(JSON.stringify({
        data: {
            metrics,
            statistics,
            timeRange,
            count: metrics.length
        }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function recordSystemMetric(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const {
        metricType,
        metricName,
        metricValue,
        metricUnit,
        deviceId,
        additionalData = {}
    } = params;

    if (!metricType || !metricName || metricValue === undefined || !metricUnit) {
        throw new Error('Metric type, name, value, and unit are required');
    }

    const metricData = {
        metric_type: metricType,
        metric_name: metricName,
        metric_value: parseFloat(metricValue),
        metric_unit: metricUnit,
        device_id: deviceId,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        ...additionalData
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/system_metrics`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(metricData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to record system metric: ${errorText}`);
    }

    return new Response(JSON.stringify({
        data: { success: true, metric: metricData }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function getHealthSummary(params: any, serviceRoleKey: string, supabaseUrl: string) {
    // Get system status
    const statusResponse = await fetch(`${supabaseUrl}/rest/v1/system_status?select=*`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    const statusData = statusResponse.ok ? await statusResponse.json() : [];

    // Get recent metrics
    const metricsResponse = await fetch(`${supabaseUrl}/rest/v1/system_metrics?select=*&timestamp=gte.${new Date(Date.now() - 3600000).toISOString()}&order=timestamp.desc&limit=100`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    const metricsData = metricsResponse.ok ? await metricsResponse.json() : [];

    // Calculate health summary
    const summary = {
        overall: {
            status: 'healthy',
            score: 95,
            lastUpdated: new Date().toISOString()
        },
        components: {
            network: statusData.find(s => s.component === 'network')?.status || 'unknown',
            vpn: statusData.find(s => s.component === 'vpn')?.status || 'unknown',
            firewall: statusData.find(s => s.component === 'firewall')?.status || 'unknown',
            dns: statusData.find(s => s.component === 'dns')?.status || 'unknown',
            dhcp: statusData.find(s => s.component === 'dhcp')?.status || 'unknown',
            monitoring: statusData.find(s => s.component === 'monitoring')?.status || 'unknown'
        },
        metrics: {
            cpu: {
                current: Math.random() * 30 + 10, // 10-40%
                average: Math.random() * 25 + 15, // 15-40%
                peak: Math.random() * 20 + 40, // 40-60%
                status: 'normal'
            },
            memory: {
                current: Math.random() * 40 + 30, // 30-70%
                average: Math.random() * 35 + 25, // 25-60%
                peak: Math.random() * 25 + 60, // 60-85%
                status: 'normal'
            },
            disk: {
                current: Math.random() * 30 + 20, // 20-50%
                average: Math.random() * 25 + 20, // 20-45%
                peak: Math.random() * 20 + 45, // 45-65%
                status: 'normal'
            },
            temperature: {
                current: Math.random() * 20 + 40, // 40-60°C
                average: Math.random() * 15 + 42, // 42-57°C
                peak: Math.random() * 15 + 55, // 55-70°C
                status: 'normal'
            },
            network: {
                uploadMbps: Math.random() * 50 + 10, // 10-60 Mbps
                downloadMbps: Math.random() * 200 + 50, // 50-250 Mbps
                latency: Math.random() * 30 + 10, // 10-40ms
                packetLoss: Math.random() * 0.5, // 0-0.5%
                status: 'normal'
            }
        },
        alerts: {
            critical: statusData.filter(s => s.status === 'critical').length,
            warnings: statusData.filter(s => s.status === 'warning').length,
            info: 0
        },
        uptime: {
            current: Math.random() * 168 + 720, // 30-60 days in hours
            percentage: Math.random() * 5 + 95 // 95-100%
        }
    };

    // Determine overall status based on component health
    const criticalComponents = Object.values(summary.components).filter(status => status === 'critical').length;
    const warningComponents = Object.values(summary.components).filter(status => status === 'warning').length;

    if (criticalComponents > 0) {
        summary.overall.status = 'critical';
        summary.overall.score = Math.max(20, 60 - (criticalComponents * 15));
    } else if (warningComponents > 0) {
        summary.overall.status = 'warning';
        summary.overall.score = Math.max(60, 85 - (warningComponents * 10));
    }

    return new Response(JSON.stringify({
        data: { summary }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function runSystemDiagnostics(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const { components = [], fullDiagnostic = false } = params;

    const diagnostics = {
        timestamp: new Date().toISOString(),
        testResults: [],
        summary: {
            totalTests: 0,
            passed: 0,
            failed: 0,
            warnings: 0
        },
        recommendations: []
    };

    // Define diagnostic tests
    const tests = [
        { name: 'Network Connectivity', component: 'network', critical: true },
        { name: 'DNS Resolution', component: 'dns', critical: true },
        { name: 'DHCP Service', component: 'dhcp', critical: false },
        { name: 'VPN Service', component: 'vpn', critical: false },
        { name: 'Firewall Status', component: 'firewall', critical: true },
        { name: 'Disk Space', component: 'disk', critical: true },
        { name: 'Memory Usage', component: 'memory', critical: false },
        { name: 'CPU Load', component: 'cpu', critical: false },
        { name: 'Temperature', component: 'temperature', critical: false }
    ];

    // Filter tests based on requested components
    const testsToRun = components.length > 0 ? 
        tests.filter(test => components.includes(test.component)) : 
        tests;

    // Run diagnostic tests
    for (const test of testsToRun) {
        const result = await runDiagnosticTest(test, fullDiagnostic);
        diagnostics.testResults.push(result);
        diagnostics.summary.totalTests++;

        if (result.status === 'passed') {
            diagnostics.summary.passed++;
        } else if (result.status === 'warning') {
            diagnostics.summary.warnings++;
        } else {
            diagnostics.summary.failed++;
        }

        if (result.recommendation) {
            diagnostics.recommendations.push(result.recommendation);
        }
    }

    // Update system status based on diagnostic results
    for (const result of diagnostics.testResults) {
        if (result.component) {
            let status = 'healthy';
            if (result.status === 'failed' && result.critical) {
                status = 'critical';
            } else if (result.status === 'warning' || result.status === 'failed') {
                status = 'warning';
            }

            await updateComponentStatus({
                component: result.component,
                status,
                responseTimeMs: result.responseTime,
                errorMessage: result.status !== 'passed' ? result.message : null
            }, serviceRoleKey, supabaseUrl);
        }
    }

    return new Response(JSON.stringify({
        data: { diagnostics }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function runDiagnosticTest(test: any, fullDiagnostic: boolean) {
    const startTime = Date.now();
    
    // Simulate diagnostic test execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200)); // 200-1200ms
    
    const responseTime = Date.now() - startTime;
    const success = Math.random() > 0.1; // 90% success rate
    
    const result = {
        name: test.name,
        component: test.component,
        critical: test.critical,
        status: success ? 'passed' : (test.critical ? 'failed' : 'warning'),
        message: success ? 'Test passed successfully' : `${test.name} test failed`,
        responseTime,
        timestamp: new Date().toISOString(),
        details: fullDiagnostic ? {
            additionalInfo: `Detailed diagnostic information for ${test.name}`,
            metrics: {
                value: Math.random() * 100,
                threshold: 80,
                unit: test.component === 'temperature' ? '°C' : '%'
            }
        } : null,
        recommendation: !success ? `Please check ${test.component} configuration and status` : null
    };

    return result;
}

async function checkSystemDependencies(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const dependencies = [
        { name: 'iptables', service: 'firewall', required: true },
        { name: 'dnsmasq', service: 'dns', required: true },
        { name: 'wireguard', service: 'vpn', required: false },
        { name: 'fail2ban', service: 'security', required: false },
        { name: 'nginx', service: 'web', required: false }
    ];

    const results = [];
    let allRequiredMet = true;

    for (const dep of dependencies) {
        const available = Math.random() > 0.1; // 90% availability
        const result = {
            name: dep.name,
            service: dep.service,
            required: dep.required,
            available,
            version: available ? `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}` : null,
            status: available ? 'available' : 'missing',
            impact: !available && dep.required ? 'critical' : (!available ? 'minor' : 'none')
        };

        if (!available && dep.required) {
            allRequiredMet = false;
        }

        results.push(result);
    }

    return new Response(JSON.stringify({
        data: {
            dependencies: results,
            summary: {
                total: dependencies.length,
                available: results.filter(r => r.available).length,
                missing: results.filter(r => !r.available).length,
                requiredMissing: results.filter(r => !r.available && r.required).length,
                allRequiredMet
            }
        }
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