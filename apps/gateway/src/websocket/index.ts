import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { supabase } from '../lib/supabase';
import { URL } from 'url';
import { nodeRegistry } from '../lib/nodeRegistry';
import { tunnelManager } from '../lib/tunnelManager';
import { signalingManager } from '../lib/signalingManager';

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

    // 3. Register node as online
    // We update the existing node if it exists for this key/hostname, or insert a new one.
    // This requires a UNIQUE(key_id, hostname) constraint on the rob_nodes table.
    const { data: nodeData, error: nodeError } = await supabase
      .from('rob_nodes')
      .upsert({
        key_id: keyId,
        hostname,
        ip_address: ipAddress,
        status: true,
        last_ping: new Date().toISOString()
      }, { onConflict: 'key_id, hostname' })
      .select()
      .single();

    if (nodeError || !nodeData) {
      console.error('CRITICAL: Failed to register node in Supabase.');
      console.error('Error Details:', nodeError);
      console.error('NOTE: Please confirm the UNIQUE constraint exists on rob_nodes(key_id, hostname) in your database.');
      ws.close(1011, 'Internal server error: Node registration failed');
      return;
    }

    const currentNodeId = nodeData.id;
    nodeRegistry.register(key, currentNodeId, hostname, ws, ipAddress);
    
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

      nodeRegistry.unregister(key, ws);

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

    // Message handling for tunneling responses and telemetry
    ws.on('message', (data) => {
      const messageStr = data.toString();
      
      // Check if it's a JSON message (telemetry) or raw tunneling data
      if (messageStr.startsWith('{')) {
        try {
          const msg = JSON.parse(messageStr);
          if (msg.type === 'latency' && typeof msg.ms === 'number') {
            nodeRegistry.updateLatency(key, ws, msg.ms);
            return; // Handled
          }
          if (msg.type === 'SIGNALING_ANSWER') {
            signalingManager.resolveSession(msg.sessionId, msg.sdp, msg.candidates);
            return; // Handled
          }
        } catch (e) {
          // Not valid JSON or not a telemetry message, pass to tunnelManager
        }
      }

      tunnelManager.handleNodeMessage(ws, messageStr);
    });
  });

  return wss;
}
