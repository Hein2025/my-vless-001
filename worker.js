export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    if (url.pathname === '/vless' || url.pathname === '/') {
      const uuid = generateUUID();
      const workerDomain = 'my-vless-2.workers.dev';
      
      const vlessLink = `vless://${uuid}@${workerDomain}:443?encryption=none&security=tls&type=ws&host=${workerDomain}&path=%2Fvless#CF-VLESS-2`;
      
      const htmlResponse = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>VLESS Config Generator</title>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f0f0f0; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .config-box { background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; margin: 20px 0; }
                pre { word-wrap: break-word; white-space: pre-wrap; background: #e9ecef; padding: 10px; border-radius: 5px; }
                .qr-code { text-align: center; margin: 20px 0; }
                .info-box { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 VLESS Configuration Generator v2</h1>
                <p>Auto-generated VLESS config for Cloudflare Worker</p>
                
                <div class="config-box">
                    <h3>📋 VLESS Link:</h3>
                    <pre>${vlessLink}</pre>
                </div>
                
                <div class="qr-code">
                    <h3>📱 QR Code:</h3>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(vlessLink)}" alt="QR Code">
                    <p>Scan this QR code with your V2Ray client</p>
                </div>
                
                <div class="info-box">
                    <h3>🔧 Connection Details:</h3>
                    <p><strong>UUID:</strong> ${uuid}</p>
                    <p><strong>Server:</strong> ${workerDomain}</p>
                    <p><strong>Port:</strong> 443</p>
                    <p><strong>Path:</strong> /vless</p>
                    <p><strong>Transport:</strong> WebSocket (WS)</p>
                    <p><strong>TLS:</strong> Enabled</p>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px;">
                    <h3>📲 How to Use:</h3>
                    <ol>
                        <li>Copy the VLESS link above</li>
                        <li>Open your V2Ray client (V2RayN, Shadowrocket, etc.)</li>
                        <li>Import from clipboard or scan QR code</li>
                        <li>Connect and enjoy!</li>
                    </ol>
                </div>
            </div>
        </body>
        </html>
      `;
      
      return new Response(htmlResponse, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }
    
    if (url.pathname === '/config.json') {
      const uuid = generateUUID();
      const workerDomain = 'my-vless-2.workers.dev';
      
      const config = {
        "server": workerDomain,
        "port": "443",
        "uuid": uuid,
        "path": "/vless",
        "encryption": "none",
        "transport": "ws",
        "tls": true
      };
      
      return new Response(JSON.stringify(config, null, 2), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    if (url.pathname === '/raw') {
      const uuid = generateUUID();
      const workerDomain = 'my-vless-2.workers.dev';
      const vlessLink = `vless://${uuid}@${workerDomain}:443?encryption=none&security=tls&type=ws&host=${workerDomain}&path=%2Fvless#CF-VLESS-2`;
      
      return new Response(vlessLink);
    }
    
    return new Response('Not Found - Use /vless path for configuration', { 
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
    });
  },
};
