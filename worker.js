// VLESS Configuration Settings
// 1. UUID (from uuidgenerator.net)
const USERS_UUIDS_RAW = "3fd2a55d-2dbc-4192-aa3e-bb7b45afcaea"; 

// 2. Clean IP/Domain for Real Outbound Traffic (Port 443 open)
const PROXY_IP = "www.google.com"; 

// --------------------------------------------------------------------------------------
// Core Logic (Do not modify below this line)
// --------------------------------------------------------------------------------------

const USERS_UUIDS = USERS_UUIDS_RAW.split(',').map(uuid => uuid.trim()).filter(uuid => uuid.length > 0);
const PATH_PREFIX = '/sub/';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // VLESS Subscription Link Generator
        if (url.pathname.startsWith(PATH_PREFIX) && request.method === 'GET') {
            const uuid_from_path = url.pathname.substring(PATH_PREFIX.length);
            
            if (!uuid_from_path || !USERS_UUIDS.includes(uuid_from_path)) {
                 return new Response("Invalid UUID for subscription.", { status: 404 });
            }

            const host = url.hostname;
            const path = url.pathname; 
            
            // VLESS Link format (WS + TLS + SNI + ProxyIP)
            const vless_link = `vless://${uuid_from_path}@${PROXY_IP}:443?encryption=none&security=tls&sni=${host}&fp=chrome&type=ws&host=${host}&path=${path}#CF-VLESS-Worker`;
            
            // Base64-encoded subscription content
            const base64_content = btoa(vless_link);
            
            return new Response(base64_content, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Content-Disposition': 'attachment; filename="vless_sub.txt"'
                }
            });
        }

        // VLESS Protocol (WebSocket) Handling - Outbound Traffic Relay
        if (request.headers.get('Upgrade') === 'websocket') {
            
            const webSocketPair = new WebSocketPair();
            const [client, worker] = Object.values(webSocketPair);
            
            try {
                // Establish Real Outbound TCP connection to PROXY_IP
                const proxy_socket = connect({
                    hostname: PROXY_IP,
                    port: 443
                }, { secureTransport: 'on' }); 

                worker.accept();
                
                // Client (WebSocket) to Proxy (TCP) Relay
                worker.addEventListener('message', async (event) => {
                    try {
                        await proxy_socket.writable.write(event.data);
                    } catch (e) {
                        worker.close(1001, "Proxy write error");
                    }
                });

                // Proxy (TCP) to Client (WebSocket) Relay
                const reader = proxy_socket.readable.getReader();
                const process_data = async () => {
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            worker.send(value); 
                        }
                    } catch (e) {
                        // Read error
                    } finally {
                        worker.close();
                    }
                };
                
                ctx.waitUntil(process_data());
                
                // Respond with 101 Switching Protocols
                return new Response(null, {
                    status: 101,
                    webSocket: client
                });

            } catch (e) {
                // Handle Outbound TCP Connection failure
                return new Response("Outbound connection failed. PROXY_IP may be blocked or unreachable.", { status: 500 });
            }
        }
        
        // Default Landing/Status Page Response
        return new Response(`VLESS Worker is active. Use ${PATH_PREFIX}${USERS_UUIDS[0]} to get config.`, { status: 200 });
    }
};
