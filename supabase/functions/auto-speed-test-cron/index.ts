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
        console.log('Auto speed test cron job triggered');

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get all scheduled speed tests that are enabled
        const scheduledTestsResponse = await fetch(
            `${supabaseUrl}/rest/v1/scheduled_speed_tests?is_enabled=eq.true`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!scheduledTestsResponse.ok) {
            throw new Error('Failed to fetch scheduled tests');
        }

        const scheduledTests = await scheduledTestsResponse.json();
        const currentTime = new Date();
        let processedCount = 0;
        const results = [];

        console.log(`Found ${scheduledTests.length} scheduled tests`);

        for (const schedule of scheduledTests) {
            try {
                const nextTestTime = schedule.next_test_at ? new Date(schedule.next_test_at) : new Date(0);
                const lastTestTime = schedule.last_test_at ? new Date(schedule.last_test_at) : null;
                
                // Calculate if test should run
                const shouldRun = currentTime >= nextTestTime || 
                    (!lastTestTime && schedule.test_frequency_minutes > 0);

                console.log(`Checking ${schedule.connection_type}: shouldRun=${shouldRun}, nextTest=${nextTestTime}, current=${currentTime}`);

                if (shouldRun) {
                    console.log(`Running automatic speed test for ${schedule.connection_type}`);
                    
                    // Run the speed test by calling the network-speed-testing function
                    const speedTestResponse = await fetch(`${supabaseUrl}/functions/v1/network-speed-testing`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'run_speed_test',
                            connectionType: schedule.connection_type,
                            connectionName: schedule.connection_name,
                            testConfig: { automated: true }
                        })
                    });

                    if (speedTestResponse.ok) {
                        const speedTestResult = await speedTestResponse.json();
                        
                        // Update the schedule with new timing
                        const nextTest = new Date(currentTime.getTime() + (schedule.test_frequency_minutes * 60000));
                        
                        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/scheduled_speed_tests?id=eq.${schedule.id}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                last_test_at: currentTime.toISOString(),
                                next_test_at: nextTest.toISOString(),
                                updated_at: currentTime.toISOString()
                            })
                        });

                        if (updateResponse.ok) {
                            processedCount++;
                            results.push({
                                connectionType: schedule.connection_type,
                                success: true,
                                speedTest: speedTestResult.data,
                                nextTestAt: nextTest.toISOString()
                            });
                            console.log(`Successfully completed speed test for ${schedule.connection_type}`);
                        } else {
                            throw new Error('Failed to update schedule');
                        }
                    } else {
                        throw new Error(`Speed test failed: ${speedTestResponse.statusText}`);
                    }
                } else {
                    console.log(`Skipping ${schedule.connection_type} - not due for testing yet`);
                    results.push({
                        connectionType: schedule.connection_type,
                        success: true,
                        skipped: true,
                        reason: 'Not due for testing',
                        nextTestAt: nextTestTime.toISOString()
                    });
                }
            } catch (error) {
                console.error(`Error processing schedule for ${schedule.connection_type}:`, error);
                results.push({
                    connectionType: schedule.connection_type,
                    success: false,
                    error: error.message
                });
            }
        }

        // Clean up old speed test records (keep only last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const cleanupResponse = await fetch(
            `${supabaseUrl}/rest/v1/network_speed_tests?created_at=lt.${thirtyDaysAgo.toISOString()}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        const cleanupSuccess = cleanupResponse.ok;
        
        // Clean up old historical data (keep only last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const historyCleanupResponse = await fetch(
            `${supabaseUrl}/rest/v1/speed_test_history?date_recorded=lt.${ninetyDaysAgo.toISOString().split('T')[0]}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        const historyCleanupSuccess = historyCleanupResponse.ok;

        const cronResult = {
            data: {
                success: true,
                timestamp: currentTime.toISOString(),
                totalSchedules: scheduledTests.length,
                processedCount,
                results,
                cleanup: {
                    oldRecords: cleanupSuccess,
                    oldHistory: historyCleanupSuccess
                },
                message: `Processed ${processedCount} automatic speed tests successfully`
            }
        };

        console.log('Cron job completed:', cronResult.data.message);

        return new Response(JSON.stringify(cronResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Auto speed test cron job error:', error);
        
        const errorResponse = {
            error: {
                code: 'AUTO_SPEED_TEST_CRON_ERROR',
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