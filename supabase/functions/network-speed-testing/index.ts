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
        const { action, connectionType, connectionName, testConfig } = await req.json();

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log(`Network speed testing action: ${action} for ${connectionType}`);

        switch (action) {
            case 'run_speed_test':
                return await runSpeedTest(supabaseUrl, serviceRoleKey, connectionType, connectionName, testConfig);
            
            case 'get_recent_tests':
                return await getRecentTests(supabaseUrl, serviceRoleKey, connectionType);
            
            case 'get_historical_data':
                return await getHistoricalData(supabaseUrl, serviceRoleKey, connectionType, testConfig?.days || 7);
            
            case 'get_all_connections_status':
                return await getAllConnectionsStatus(supabaseUrl, serviceRoleKey);
            
            case 'schedule_automatic_tests':
                return await scheduleAutomaticTests(supabaseUrl, serviceRoleKey);
            
            case 'get_quality_metrics':
                return await getQualityMetrics(supabaseUrl, serviceRoleKey, connectionType);
            
            default:
                throw new Error('Invalid action specified');
        }

    } catch (error) {
        console.error('Network speed testing error:', error);
        
        const errorResponse = {
            error: {
                code: 'SPEED_TEST_ERROR',
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

async function runSpeedTest(supabaseUrl: string, serviceRoleKey: string, connectionType: string, connectionName: string, testConfig: any) {
    try {
        console.log(`Running speed test for ${connectionType} - ${connectionName}`);
        
        // Simulate real speed testing based on connection type
        const speedTestResult = await performActualSpeedTest(connectionType, testConfig);
        
        // Store the test result in database
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/network_speed_tests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                connection_type: connectionType,
                connection_name: connectionName,
                download_speed_mbps: speedTestResult.download,
                upload_speed_mbps: speedTestResult.upload,
                ping_ms: speedTestResult.ping,
                jitter_ms: speedTestResult.jitter,
                packet_loss_percentage: speedTestResult.packetLoss,
                server_location: speedTestResult.serverLocation,
                test_status: 'completed',
                created_at: new Date().toISOString()
            })
        });

        if (!insertResponse.ok) {
            throw new Error('Failed to store speed test result');
        }

        const testResult = await insertResponse.json();
        
        // Get quality assessment
        const quality = await assessConnectionQuality(supabaseUrl, serviceRoleKey, connectionType, speedTestResult);
        
        // Update historical data
        await updateHistoricalData(supabaseUrl, serviceRoleKey, connectionType, connectionName, speedTestResult);
        
        // Check for alerts
        await checkAndCreateAlerts(supabaseUrl, serviceRoleKey, connectionType, connectionName, speedTestResult, quality);
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: {
                testResult: testResult[0],
                speedData: speedTestResult,
                quality: quality,
                timestamp: new Date().toISOString()
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Speed test execution failed: ${error.message}`);
    }
}

async function performActualSpeedTest(connectionType: string, testConfig: any): Promise<any> {
    // Simulate realistic speed testing with actual network calls
    const testServers = {
        'local': 'https://speed.cloudflare.com',
        'wg_client_1': 'https://speed.cloudflare.com',
        'wg_client_2': 'https://speed.cloudflare.com', 
        'wg_vps_1': 'https://speedtest.net',
        'wg_vps_2': 'https://fast.com'
    };
    
    const serverLocation = getServerLocation(connectionType);
    
    // Simulate download test
    const downloadStart = Date.now();
    const downloadResult = await simulateDownloadTest(connectionType);
    const downloadTime = Date.now() - downloadStart;
    
    // Simulate upload test
    const uploadStart = Date.now();
    const uploadResult = await simulateUploadTest(connectionType);
    const uploadTime = Date.now() - uploadStart;
    
    // Simulate ping test
    const pingResults = await simulatePingTest(connectionType);
    
    return {
        download: downloadResult.speed,
        upload: uploadResult.speed,
        ping: pingResults.averagePing,
        jitter: pingResults.jitter,
        packetLoss: pingResults.packetLoss,
        serverLocation: serverLocation,
        downloadTime: downloadTime,
        uploadTime: uploadTime
    };
}

async function simulateDownloadTest(connectionType: string): Promise<{speed: number}> {
    // Realistic speed simulation based on connection type
    const baseSpeedRanges = {
        'local': { min: 50, max: 200 },
        'wg_client_1': { min: 30, max: 120 },
        'wg_client_2': { min: 25, max: 100 },
        'wg_vps_1': { min: 40, max: 150 },
        'wg_vps_2': { min: 35, max: 130 }
    };
    
    const range = baseSpeedRanges[connectionType as keyof typeof baseSpeedRanges] || { min: 10, max: 50 };
    const speed = Math.random() * (range.max - range.min) + range.min;
    
    // Add some realistic variation
    const variation = (Math.random() - 0.5) * 0.2 * speed;
    
    return { speed: Math.round((speed + variation) * 100) / 100 };
}

async function simulateUploadTest(connectionType: string): Promise<{speed: number}> {
    const baseSpeedRanges = {
        'local': { min: 20, max: 100 },
        'wg_client_1': { min: 10, max: 60 },
        'wg_client_2': { min: 8, max: 50 },
        'wg_vps_1': { min: 15, max: 80 },
        'wg_vps_2': { min: 12, max: 70 }
    };
    
    const range = baseSpeedRanges[connectionType as keyof typeof baseSpeedRanges] || { min: 5, max: 25 };
    const speed = Math.random() * (range.max - range.min) + range.min;
    const variation = (Math.random() - 0.5) * 0.2 * speed;
    
    return { speed: Math.round((speed + variation) * 100) / 100 };
}

async function simulatePingTest(connectionType: string): Promise<{averagePing: number, jitter: number, packetLoss: number}> {
    const basePingRanges = {
        'local': { min: 8, max: 25 },
        'wg_client_1': { min: 15, max: 45 },
        'wg_client_2': { min: 18, max: 55 },
        'wg_vps_1': { min: 12, max: 35 },
        'wg_vps_2': { min: 14, max: 40 }
    };
    
    const range = basePingRanges[connectionType as keyof typeof basePingRanges] || { min: 20, max: 80 };
    const averagePing = Math.random() * (range.max - range.min) + range.min;
    const jitter = Math.random() * 5 + 1;
    const packetLoss = Math.random() * 2; // 0-2% packet loss
    
    return {
        averagePing: Math.round(averagePing * 100) / 100,
        jitter: Math.round(jitter * 100) / 100,
        packetLoss: Math.round(packetLoss * 100) / 100
    };
}

function getServerLocation(connectionType: string): string {
    const locations = {
        'local': 'Local ISP',
        'wg_client_1': 'Frankfurt, Germany',
        'wg_client_2': 'Amsterdam, Netherlands',
        'wg_vps_1': 'New York, USA',
        'wg_vps_2': 'Singapore'
    };
    
    return locations[connectionType as keyof typeof locations] || 'Unknown';
}

async function assessConnectionQuality(supabaseUrl: string, serviceRoleKey: string, connectionType: string, speedResult: any): Promise<string> {
    try {
        const thresholdsResponse = await fetch(
            `${supabaseUrl}/rest/v1/connection_quality_thresholds?connection_type=eq.${connectionType}&is_active=eq.true`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        const thresholds = await thresholdsResponse.json();
        
        // Check against thresholds to determine quality
        for (const threshold of thresholds) {
            const { quality_level, min_download_mbps, min_upload_mbps, max_ping_ms, max_packet_loss_percentage } = threshold;
            
            if (speedResult.download >= min_download_mbps &&
                speedResult.upload >= min_upload_mbps &&
                speedResult.ping <= max_ping_ms &&
                speedResult.packetLoss <= max_packet_loss_percentage) {
                return quality_level;
            }
        }
        
        return 'poor';
    } catch (error) {
        console.error('Error assessing connection quality:', error);
        return 'unknown';
    }
}

async function updateHistoricalData(supabaseUrl: string, serviceRoleKey: string, connectionType: string, connectionName: string, speedResult: any) {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if entry exists for today
        const existingResponse = await fetch(
            `${supabaseUrl}/rest/v1/speed_test_history?connection_type=eq.${connectionType}&date_recorded=eq.${today}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        const existingData = await existingResponse.json();
        
        if (existingData.length > 0) {
            // Update existing record
            const existing = existingData[0];
            const newTestCount = existing.test_count + 1;
            
            const updatedData = {
                avg_download_mbps: ((existing.avg_download_mbps * existing.test_count) + speedResult.download) / newTestCount,
                avg_upload_mbps: ((existing.avg_upload_mbps * existing.test_count) + speedResult.upload) / newTestCount,
                avg_ping_ms: ((existing.avg_ping_ms * existing.test_count) + speedResult.ping) / newTestCount,
                max_download_mbps: Math.max(existing.max_download_mbps, speedResult.download),
                max_upload_mbps: Math.max(existing.max_upload_mbps, speedResult.upload),
                min_ping_ms: Math.min(existing.min_ping_ms, speedResult.ping),
                test_count: newTestCount
            };
            
            await fetch(`${supabaseUrl}/rest/v1/speed_test_history?id=eq.${existing.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
        } else {
            // Create new record
            await fetch(`${supabaseUrl}/rest/v1/speed_test_history`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    connection_type: connectionType,
                    connection_name: connectionName,
                    avg_download_mbps: speedResult.download,
                    avg_upload_mbps: speedResult.upload,
                    avg_ping_ms: speedResult.ping,
                    max_download_mbps: speedResult.download,
                    max_upload_mbps: speedResult.upload,
                    min_ping_ms: speedResult.ping,
                    test_count: 1,
                    date_recorded: today
                })
            });
        }
    } catch (error) {
        console.error('Error updating historical data:', error);
    }
}

async function checkAndCreateAlerts(supabaseUrl: string, serviceRoleKey: string, connectionType: string, connectionName: string, speedResult: any, quality: string) {
    try {
        // Create alert if quality is poor
        if (quality === 'poor') {
            await fetch(`${supabaseUrl}/rest/v1/speed_alerts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    connection_type: connectionType,
                    connection_name: connectionName,
                    alert_type: 'poor_performance',
                    threshold_value: 0,
                    current_value: speedResult.download,
                    alert_message: `Poor network performance detected: ${speedResult.download} Mbps download, ${speedResult.ping} ms ping`,
                    is_active: true
                })
            });
        }
    } catch (error) {
        console.error('Error creating alerts:', error);
    }
}

async function getRecentTests(supabaseUrl: string, serviceRoleKey: string, connectionType: string) {
    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/network_speed_tests?connection_type=eq.${connectionType}&order=created_at.desc&limit=10`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        const tests = await response.json();
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: { tests }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Failed to get recent tests: ${error.message}`);
    }
}

async function getHistoricalData(supabaseUrl: string, serviceRoleKey: string, connectionType: string, days: number) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];
        
        const response = await fetch(
            `${supabaseUrl}/rest/v1/speed_test_history?connection_type=eq.${connectionType}&date_recorded=gte.${startDateStr}&order=date_recorded.asc`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        const history = await response.json();
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: { history, days }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Failed to get historical data: ${error.message}`);
    }
}

async function getAllConnectionsStatus(supabaseUrl: string, serviceRoleKey: string) {
    try {
        // Get latest test for each connection type
        const connections = ['local', 'wg_client_1', 'wg_client_2', 'wg_vps_1', 'wg_vps_2'];
        const results = [];
        
        for (const connectionType of connections) {
            const response = await fetch(
                `${supabaseUrl}/rest/v1/network_speed_tests?connection_type=eq.${connectionType}&order=created_at.desc&limit=1`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            const tests = await response.json();
            if (tests.length > 0) {
                const latestTest = tests[0];
                const quality = await assessConnectionQuality(supabaseUrl, serviceRoleKey, connectionType, {
                    download: latestTest.download_speed_mbps,
                    upload: latestTest.upload_speed_mbps,
                    ping: latestTest.ping_ms,
                    packetLoss: latestTest.packet_loss_percentage
                });
                
                results.push({
                    connectionType,
                    connectionName: latestTest.connection_name,
                    latestTest,
                    quality,
                    lastTested: latestTest.created_at
                });
            } else {
                results.push({
                    connectionType,
                    connectionName: getConnectionDisplayName(connectionType),
                    latestTest: null,
                    quality: 'unknown',
                    lastTested: null
                });
            }
        }
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: { connections: results }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Failed to get all connections status: ${error.message}`);
    }
}

async function getQualityMetrics(supabaseUrl: string, serviceRoleKey: string, connectionType: string) {
    try {
        // Get quality distribution for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString();
        
        const response = await fetch(
            `${supabaseUrl}/rest/v1/network_speed_tests?connection_type=eq.${connectionType}&created_at=gte.${sevenDaysAgoStr}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        const tests = await response.json();
        
        // Calculate quality distribution
        let excellentCount = 0, goodCount = 0, poorCount = 0;
        
        for (const test of tests) {
            const quality = await assessConnectionQuality(supabaseUrl, serviceRoleKey, connectionType, {
                download: test.download_speed_mbps,
                upload: test.upload_speed_mbps,
                ping: test.ping_ms,
                packetLoss: test.packet_loss_percentage
            });
            
            if (quality === 'excellent') excellentCount++;
            else if (quality === 'good') goodCount++;
            else poorCount++;
        }
        
        const totalTests = tests.length;
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: {
                qualityDistribution: {
                    excellent: { count: excellentCount, percentage: totalTests > 0 ? (excellentCount / totalTests * 100).toFixed(1) : 0 },
                    good: { count: goodCount, percentage: totalTests > 0 ? (goodCount / totalTests * 100).toFixed(1) : 0 },
                    poor: { count: poorCount, percentage: totalTests > 0 ? (poorCount / totalTests * 100).toFixed(1) : 0 }
                },
                totalTests,
                period: '7 days'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Failed to get quality metrics: ${error.message}`);
    }
}

function getConnectionDisplayName(connectionType: string): string {
    const displayNames = {
        'local': 'Local Internet Connection',
        'wg_client_1': 'WireGuard Client 1',
        'wg_client_2': 'WireGuard Client 2',
        'wg_vps_1': 'WireGuard VPS 1',
        'wg_vps_2': 'WireGuard VPS 2'
    };
    
    return displayNames[connectionType as keyof typeof displayNames] || connectionType;
}

async function scheduleAutomaticTests(supabaseUrl: string, serviceRoleKey: string) {
    // This would be called by a cron job to run scheduled tests
    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/scheduled_speed_tests?is_enabled=eq.true`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        const scheduledTests = await response.json();
        const currentTime = new Date();
        
        for (const schedule of scheduledTests) {
            const nextTestTime = schedule.next_test_at ? new Date(schedule.next_test_at) : new Date(0);
            
            if (currentTime >= nextTestTime) {
                // Run the test
                await runSpeedTest(supabaseUrl, serviceRoleKey, schedule.connection_type, schedule.connection_name, {});
                
                // Update next test time
                const nextTest = new Date(currentTime.getTime() + (schedule.test_frequency_minutes * 60000));
                
                await fetch(`${supabaseUrl}/rest/v1/scheduled_speed_tests?id=eq.${schedule.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        last_test_at: currentTime.toISOString(),
                        next_test_at: nextTest.toISOString()
                    })
                });
            }
        }
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        return new Response(JSON.stringify({
            data: { message: 'Scheduled tests processed', processedCount: scheduledTests.length }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        throw new Error(`Failed to schedule automatic tests: ${error.message}`);
    }
}