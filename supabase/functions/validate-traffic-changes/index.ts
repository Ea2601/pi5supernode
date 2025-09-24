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
        const { rules, mode = 'strict' } = await req.json();

        if (!rules || !Array.isArray(rules)) {
            throw new Error('Rules array is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log(`Validating ${rules.length} traffic rules in ${mode} mode`);

        const validationResults = [];
        const errors = [];
        const warnings = [];

        // Get existing rules for conflict detection
        const existingRulesResponse = await fetch(`${supabaseUrl}/rest/v1/traffic_rules?select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        const existingRules = existingRulesResponse.ok ? await existingRulesResponse.json() : [];

        // Get client groups for reference validation
        const groupsResponse = await fetch(`${supabaseUrl}/rest/v1/client_groups?select=id,name`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        const clientGroups = groupsResponse.ok ? await groupsResponse.json() : [];
        const validGroupIds = new Set(clientGroups.map(g => g.id));

        for (const rule of rules) {
            const ruleValidation = {
                ruleId: rule.id,
                ruleName: rule.name,
                isValid: true,
                errors: [],
                warnings: []
            };

            // Required field validation
            if (!rule.name || rule.name.trim().length === 0) {
                ruleValidation.errors.push('Rule name is required');
                ruleValidation.isValid = false;
            }

            if (!rule.actions || typeof rule.actions !== 'object') {
                ruleValidation.errors.push('Rule actions are required');
                ruleValidation.isValid = false;
            }

            if (!rule.conditions || typeof rule.conditions !== 'object') {
                ruleValidation.errors.push('Rule conditions are required');
                ruleValidation.isValid = false;
            }

            // Priority validation
            if (rule.priority !== undefined) {
                if (typeof rule.priority !== 'number' || rule.priority < 0 || rule.priority > 1000) {
                    ruleValidation.errors.push('Priority must be a number between 0 and 1000');
                    ruleValidation.isValid = false;
                }
            }

            // Client group validation
            if (rule.client_group_id) {
                if (!validGroupIds.has(rule.client_group_id)) {
                    ruleValidation.errors.push(`Client group ${rule.client_group_id} does not exist`);
                    ruleValidation.isValid = false;
                }
            }

            // Actions validation
            if (rule.actions) {
                const actions = rule.actions;
                
                if (actions.allow !== undefined && actions.block !== undefined) {
                    ruleValidation.errors.push('Rule cannot both allow and block simultaneously');
                    ruleValidation.isValid = false;
                }

                if (actions.bandwidth_limit) {
                    if (typeof actions.bandwidth_limit !== 'number' || actions.bandwidth_limit <= 0) {
                        ruleValidation.errors.push('Bandwidth limit must be a positive number');
                        ruleValidation.isValid = false;
                    }
                }

                if (actions.redirect_to) {
                    const urlPattern = /^https?:\/\/.+/;
                    if (!urlPattern.test(actions.redirect_to)) {
                        ruleValidation.errors.push('Redirect URL must be a valid HTTP/HTTPS URL');
                        ruleValidation.isValid = false;
                    }
                }
            }

            // Conditions validation
            if (rule.conditions) {
                const conditions = rule.conditions;

                if (conditions.source_ip) {
                    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:3[0-2]|[0-2]?[0-9]))?$/;
                    if (!ipPattern.test(conditions.source_ip)) {
                        ruleValidation.errors.push('Source IP must be a valid IP address or CIDR notation');
                        ruleValidation.isValid = false;
                    }
                }

                if (conditions.destination_port) {
                    const port = parseInt(conditions.destination_port);
                    if (isNaN(port) || port < 1 || port > 65535) {
                        ruleValidation.errors.push('Destination port must be between 1 and 65535');
                        ruleValidation.isValid = false;
                    }
                }

                if (conditions.protocol) {
                    const validProtocols = ['tcp', 'udp', 'icmp', 'any'];
                    if (!validProtocols.includes(conditions.protocol.toLowerCase())) {
                        ruleValidation.errors.push(`Protocol must be one of: ${validProtocols.join(', ')}`);
                        ruleValidation.isValid = false;
                    }
                }

                if (conditions.time_range) {
                    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                    if (!timePattern.test(conditions.time_range)) {
                        ruleValidation.errors.push('Time range must be in format HH:MM-HH:MM');
                        ruleValidation.isValid = false;
                    }
                }
            }

            // Conflict detection
            for (const existingRule of existingRules) {
                if (existingRule.id !== rule.id) {
                    // Check for priority conflicts
                    if (existingRule.priority === rule.priority && existingRule.enabled && rule.enabled !== false) {
                        ruleValidation.warnings.push(`Rule has same priority (${rule.priority}) as existing rule '${existingRule.name}'`);
                    }

                    // Check for conflicting conditions with opposite actions
                    const conditionsMatch = JSON.stringify(existingRule.conditions) === JSON.stringify(rule.conditions);
                    if (conditionsMatch) {
                        const existingAction = existingRule.actions.allow ? 'allow' : existingRule.actions.block ? 'block' : 'unknown';
                        const newAction = rule.actions.allow ? 'allow' : rule.actions.block ? 'block' : 'unknown';
                        
                        if (existingAction !== newAction && existingAction !== 'unknown' && newAction !== 'unknown') {
                            ruleValidation.warnings.push(`Rule conflicts with existing rule '${existingRule.name}' - same conditions but opposite actions`);
                        }
                    }
                }
            }

            // Name uniqueness check
            const nameConflict = existingRules.find(r => r.id !== rule.id && r.name === rule.name);
            if (nameConflict) {
                if (mode === 'strict') {
                    ruleValidation.errors.push(`Rule name '${rule.name}' already exists`);
                    ruleValidation.isValid = false;
                } else {
                    ruleValidation.warnings.push(`Rule name '${rule.name}' already exists`);
                }
            }

            validationResults.push(ruleValidation);

            // Collect global errors and warnings
            errors.push(...ruleValidation.errors.map(err => `${rule.name}: ${err}`));
            warnings.push(...ruleValidation.warnings.map(warn => `${rule.name}: ${warn}`));
        }

        const validRules = validationResults.filter(r => r.isValid).length;
        const invalidRules = validationResults.filter(r => !r.isValid).length;
        const overallValid = invalidRules === 0;

        // Log validation results
        try {
            await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: 'traffic_rules_validated',
                    event_category: 'network_management',
                    action: 'validate_traffic_changes',
                    details: {
                        total_rules: rules.length,
                        valid_rules: validRules,
                        invalid_rules: invalidRules,
                        errors_count: errors.length,
                        warnings_count: warnings.length,
                        validation_mode: mode
                    },
                    severity: overallValid ? 'info' : 'warning',
                    created_at: new Date().toISOString()
                })
            });
        } catch (logError) {
            console.warn('Failed to create audit log:', logError.message);
        }

        return new Response(JSON.stringify({
            data: {
                overallValid,
                validationMode: mode,
                totalRules: rules.length,
                validRules,
                invalidRules,
                errors,
                warnings,
                results: validationResults
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Validate traffic changes error:', error);

        const errorResponse = {
            error: {
                code: 'VALIDATE_TRAFFIC_CHANGES_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});