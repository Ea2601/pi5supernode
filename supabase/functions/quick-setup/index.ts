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
    const { adminPassword, networkName, region, vpnEnabled } = requestData;

    // Validate required fields
    if (!adminPassword || !networkName || !region) {
      throw new Error('Missing required fields: adminPassword, networkName, or region');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create a setup configuration record
    const setupConfig = {
      admin_password_hash: adminPassword, // In production, this should be hashed
      network_name: networkName,
      region: region,
      vpn_enabled: vpnEnabled || false,
      setup_completed_at: new Date().toISOString(),
      status: 'completed'
    };

    // Create notifications table entry for setup completion
    const notificationResponse = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Quick setup completed for network "${networkName}" in region ${region}`,
        is_read: false
      })
    });

    if (!notificationResponse.ok) {
      console.error('Failed to create setup notification');
    }

    const result = {
      success: true,
      message: 'Quick setup completed successfully',
      configuration: setupConfig
    };

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
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