import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { supabase } from '../lib/supabase';
import { URL } from 'url';
import { nodeRegistry } from '../lib/nodeRegistry';

/**
 * Sets up the WebSocket server for node signaling.
 * Nodes connect with: ws://gateway:port?key=rob_...&hostname=...
 */
export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', async (ws: WebSocket, req) => {
    const parameters = new URL(req.url || '', `http://${req.headers.host}`).searchParams;
    const key = parameters.get('key');
    const hostname = parameters.get('hostname') || 'unknown';

    if (!key || !key.startsWith('rob_')) {
      ws.close(1008, 'Invalid or missing key');
      return;
    }

    // 1. Verify key in Supabase
    const { data: keyData, error: keyError } = await supabase
      .from('rob_keys')
      .select('id')
      .eq('key_string', key)
      .eq('status', 'active')
      .single();

    if (keyError || !keyData) {
      console.warn(`Unauthorized connection attempt with key: ${key.substring(0, 8)}...`);
      ws.close(1008, 'Unauthorized key');
      return;
    }

    const keyId = keyData.id;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    // 2. Register node as online
    // We update the existing node if it exists for this key/hostname, or insert a new one
    const { data: nodeData, error: nodeError } = await supabase
      .from('rob_nodes')
      .upsert({
        key_id: keyId,
        hostname,
        ip_address: ipAddress,
        status: true,
        last_ping: new Date().toISOString()
      }, { onConflict: 'key_id, hostname' }) // Note: You might need a unique constraint in SQL for this to work perfectly
      .select()
      .single();

    if (nodeError) {
      console.error('Failed to register node:', nodeError);
      // Fallback: If upsert fails due to missing constraint, just insert
      const { data: insertData, error: insertError } = await supabase
        .from('rob_nodes')
        .insert([{
          key_id: keyId,
          hostname,
          ip_address: ipAddress,
          status: true,
          last_ping: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) {
        ws.close(1011, 'Internal server error');
        return;
      }
    }

    const currentNodeId = nodeData?.id || (nodeError ? null : null); // Handling possible null from previous block
    if (currentNodeId) {
      nodeRegistry.register(keyId, currentNodeId, hostname, ws);
    }
    
    console.log(`Node connected: ${hostname} (${ipAddress}) for key ${key.substring(0, 10)}...`);

    // 3. Heartbeat management
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('close', async () => {
      clearInterval(pingInterval);
      console.log(`Node disconnected: ${hostname}`);

      nodeRegistry.unregister(keyId, ws);

      // Update status to offline in Supabase
      if (nodeData?.id) {
        await supabase
          .from('rob_nodes')
          .update({ status: false })
          .eq('id', nodeData.id);
      }
    });

    ws.on('error', (err) => {
      console.error(`WebSocket error for node ${hostname}:`, err);
    });

    // Message handling will be implemented in Phase 4 (Tunneling)
    ws.on('message', (data) => {
      // Logic for handling tunnel responses
    });
  });

  return wss;
}
