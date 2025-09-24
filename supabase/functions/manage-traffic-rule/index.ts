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
    const { action, rule, ruleId } = requestData;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    let result;

    if (action === 'create') {
      // Create new traffic rule
      // Map frontend fields to database schema
      const dbRule = {
        rule_name: rule.name || rule.rule_name,
        description: rule.description,
        user_group_id: rule.user_group_id,
        traffic_type_id: rule.traffic_type_id,
        network_path_id: rule.path_id || rule.network_path_id,
        tunnel_id: rule.tunnel_id,
        action: rule.action || 'allow',
        priority: rule.priority || 100,
        is_enabled: rule.is_enabled !== false
      };
      
      const response = await fetch(`${supabaseUrl}/rest/v1/traffic_rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dbRule)
      });
      
      let data = null;
      const responseText = await response.text();
      if (responseText) {
        data = JSON.parse(responseText);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to create rule: ${data?.message || response.statusText}`);
      }
      result = { success: true, data };
      
    } else if (action === 'update') {
      // Update existing traffic rule
      const response = await fetch(`${supabaseUrl}/rest/v1/traffic_rules?id=eq.${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rule)
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Failed to update rule: ${data.message || 'Unknown error'}`);
      }
      result = { success: true, data };
      
    } else if (action === 'delete') {
      // Delete traffic rule
      const response = await fetch(`${supabaseUrl}/rest/v1/traffic_rules?id=eq.${ruleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(`Failed to delete rule: ${data.message || 'Unknown error'}`);
      }
      result = { success: true, message: 'Rule deleted successfully' };
      
    } else {
      throw new Error('Invalid action. Must be create, update, or delete.');
    }

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