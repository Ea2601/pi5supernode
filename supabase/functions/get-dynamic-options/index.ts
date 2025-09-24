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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = {
      async from(table: string) {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        return { data, error: response.ok ? null : data };
      }
    };

    // Fetch all dynamic options concurrently
    const [userGroupsResult, trafficTypesResult, pathsResult, tunnelsResult] = await Promise.all([
      supabaseAdmin.from('user_groups'),
      supabaseAdmin.from('traffic_types'),
      supabaseAdmin.from('network_paths'),
      supabaseAdmin.from('tunnels')
    ]);

    // Check for errors
    if (userGroupsResult.error || trafficTypesResult.error || pathsResult.error || tunnelsResult.error) {
      throw new Error('Failed to fetch dynamic options');
    }

    const result = {
      userGroups: userGroupsResult.data || [],
      trafficTypes: trafficTypesResult.data || [],
      paths: pathsResult.data || [],
      tunnels: tunnelsResult.data || []
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