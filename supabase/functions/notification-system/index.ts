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
            case 'create_notification':
                return await createNotification(params, serviceRoleKey, supabaseUrl);
            case 'get_notifications':
                return await getNotifications(params, serviceRoleKey, supabaseUrl);
            case 'mark_read':
                return await markNotificationRead(params, serviceRoleKey, supabaseUrl);
            case 'delete_notification':
                return await deleteNotification(params, serviceRoleKey, supabaseUrl);
            default:
                throw new Error('Invalid action');
        }
    } catch (error) {
        console.error('Notification system error:', error);

        const errorResponse = {
            error: {
                code: 'NOTIFICATION_SYSTEM_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function createNotification(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const {
        type = 'info',
        title,
        message,
        priority = 5,
        action_url,
        action_label,
        user_id,
        is_system = false,
        expires_at
    } = params;

    if (!message) {
        throw new Error('Message is required');
    }

    const notificationData = {
        title,
        message,
        type,
        priority,
        action_url,
        action_label,
        user_id,
        is_system,
        expires_at,
        is_read: false
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create notification: ${errorText}`);
    }

    const notification = await response.json();

    return new Response(JSON.stringify({
        data: { notification: notification[0] }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function getNotifications(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const {
        limit = 50,
        offset = 0,
        type,
        priority,
        unreadOnly = false,
        user_id
    } = params;

    let query = `${supabaseUrl}/rest/v1/notifications?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;
    
    // Add filters
    if (type) {
        query += `&type=eq.${type}`;
    }
    if (priority) {
        query += `&priority=eq.${priority}`;
    }
    if (unreadOnly) {
        query += `&is_read=eq.false`;
    }
    if (user_id) {
        query += `&user_id=eq.${user_id}`;
    }

    // Only get non-expired notifications
    query += `&or=(expires_at.is.null,expires_at.gt.${new Date().toISOString()})`;

    const response = await fetch(query, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get notifications: ${errorText}`);
    }

    const notifications = await response.json();

    return new Response(JSON.stringify({
        data: { notifications, count: notifications.length }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function markNotificationRead(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const { notificationId } = params;

    if (!notificationId) {
        throw new Error('Notification ID is required');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/notifications?id=eq.${notificationId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            is_read: true,
            read_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to mark notification as read: ${errorText}`);
    }

    return new Response(JSON.stringify({
        data: { success: true }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function deleteNotification(params: any, serviceRoleKey: string, supabaseUrl: string) {
    const { notificationId } = params;

    if (!notificationId) {
        throw new Error('Notification ID is required');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/notifications?id=eq.${notificationId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete notification: ${errorText}`);
    }

    return new Response(JSON.stringify({
        data: { success: true }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}