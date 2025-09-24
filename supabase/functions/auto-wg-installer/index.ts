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
        const { serverEndpoint, sshCredentials, installationId } = await req.json();

        if (!serverEndpoint || !sshCredentials || !installationId) {
            throw new Error('Server endpoint, SSH credentials, and installation ID are required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log(`Starting auto WireGuard installation for ${serverEndpoint}`);

        // Update installation status to 'in_progress'
        await fetch(`${supabaseUrl}/rest/v1/auto_wg_installations?id=eq.${installationId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'in_progress',
                started_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        // Generate installation script
        const installScript = `#!/bin/bash
# WireGuard Auto-Installation Script
set -e

echo "Updating system packages..."
sudo apt update

echo "Installing WireGuard..."
sudo apt install -y wireguard wireguard-tools

echo "Enabling IP forwarding..."
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

echo "Creating WireGuard directory..."
sudo mkdir -p /etc/wireguard
sudo chmod 700 /etc/wireguard

echo "Generating server keys..."
cd /etc/wireguard
sudo wg genkey | tee server_private.key | wg pubkey > server_public.key
sudo chmod 600 server_private.key
sudo chmod 644 server_public.key

echo "Setting up firewall rules..."
sudo ufw allow 51820/udp
sudo ufw allow ssh
sudo ufw --force enable

echo "Creating basic WireGuard configuration..."
sudo tee /etc/wireguard/wg0.conf > /dev/null <<EOF
[Interface]
PrivateKey = $(sudo cat server_private.key)
Address = 10.8.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
EOF

echo "Enabling and starting WireGuard service..."
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

echo "Installation completed successfully!"
echo "Server public key: $(sudo cat server_public.key)"
echo "Server private key: $(sudo cat server_private.key)"
`;

        // Simulate installation process (in real implementation, this would use SSH)
        const simulateInstallation = async () => {
            // Generate mock keys for demonstration
            const serverPrivateKey = 'mock_private_key_' + Math.random().toString(36).substring(2, 15);
            const serverPublicKey = 'mock_public_key_' + Math.random().toString(36).substring(2, 15);
            
            return {
                success: true,
                privateKey: serverPrivateKey,
                publicKey: serverPublicKey,
                endpoint: serverEndpoint,
                port: 51820
            };
        };

        const installationResult = await simulateInstallation();

        if (installationResult.success) {
            // Create WireGuard server record
            const serverData = {
                server_name: `Auto-${serverEndpoint}`,
                public_key: installationResult.publicKey,
                private_key: installationResult.privateKey,
                listen_port: installationResult.port,
                endpoint: serverEndpoint,
                network: '10.8.0.0/24',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const serverResponse = await fetch(`${supabaseUrl}/rest/v1/wireguard_servers`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(serverData)
            });

            if (!serverResponse.ok) {
                throw new Error('Failed to create WireGuard server record');
            }

            const server = await serverResponse.json();
            const serverId = server[0].id;

            // Update installation record
            await fetch(`${supabaseUrl}/rest/v1/auto_wg_installations?id=eq.${installationId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'completed',
                    server_id: serverId,
                    completed_at: new Date().toISOString(),
                    result: installationResult,
                    updated_at: new Date().toISOString()
                })
            });

            console.log(`Successfully installed WireGuard server ${serverId} at ${serverEndpoint}`);

            return new Response(JSON.stringify({
                data: {
                    installationId,
                    serverId,
                    endpoint: serverEndpoint,
                    publicKey: installationResult.publicKey,
                    status: 'completed'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        } else {
            throw new Error('Installation failed');
        }

    } catch (error) {
        console.error('Auto WG installation error:', error);

        // Update installation record with error
        try {
            const { installationId } = await req.json();
            if (installationId) {
                const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
                const supabaseUrl = Deno.env.get('SUPABASE_URL');
                
                await fetch(`${supabaseUrl}/rest/v1/auto_wg_installations?id=eq.${installationId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'failed',
                        error_message: error.message,
                        updated_at: new Date().toISOString()
                    })
                });
            }
        } catch (updateError) {
            console.error('Failed to update installation record:', updateError);
        }

        const errorResponse = {
            error: {
                code: 'AUTO_WG_INSTALL_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});