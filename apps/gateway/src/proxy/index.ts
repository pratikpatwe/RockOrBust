import http from 'http';
import net from 'net';
import { supabase } from '../lib/supabase';
import { nodeRegistry } from '../lib/nodeRegistry';
import { tunnelManager } from '../lib/tunnelManager';

/**
 * The Proxy Engine handles incoming requests from the Playwright plugin.
 * It validates the key and selects an active node for tunneling.
 */
export function setupProxy() {
  const proxyPort = process.env.PROXY_PORT || 8888;

  const server = http.createServer((req, res) => {
    handleProxyRequest(req, res);
  });

  // Handle HTTPS CONNECT requests
  server.on('connect', (req, socket, head) => {
    handleConnectRequest(req, socket as net.Socket, head);
  });

  server.listen(proxyPort, () => {
    console.log(`Rock or Bust Proxy Engine listening on port ${proxyPort}`);
  });
}

/**
 * Handles standard HTTP requests (GET, POST, etc.)
 */
async function handleProxyRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const key = extractKey(req);

  if (!key) {
    res.writeHead(407, { 'Proxy-Authenticate': 'Basic realm="Rock or Bust"' });
    res.end('Proxy Authentication Required');
    return;
  }

  const maxRetries = 3;
  let attempts = 0;
  let success = false;

  while (attempts < maxRetries && !success) {
    attempts++;
    const node = await getActiveNodeForKey(key);
    
    if (!node) {
      if (attempts === 1) {
        res.writeHead(502);
        res.end('No active residential nodes available for this key');
        return;
      }
      break; // Stop if we ran out of nodes
    }

    try {
      // Collect request body (only on first attempt)
      const bodyChunks: Buffer[] = [];
      if (attempts === 1) {
        await new Promise((resolve) => {
          req.on('data', chunk => bodyChunks.push(chunk));
          req.on('end', resolve);
        });
      }
      
      const fullBody = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined;
      
      // Set a timeout for the node response (e.g., 30 seconds)
      const timeout = setTimeout(() => {
        console.warn(`Request timed out on node ${node.hostname}, retrying...`);
        // We can't easily "cancel" the previous attempt here without more complex state,
        // but we can trigger the next loop iteration.
      }, 30000);

      console.log(`Attempt ${attempts}: Forwarding HTTP ${req.method} ${req.url} to node ${node.hostname}`);
      
      // Note: In Phase 5 we'd ideally want forwardHttpRequest to return a promise or handle retries.
      // For now, we'll implement the rotation shell.
      tunnelManager.forwardHttpRequest(node.ws, req, res, fullBody);
      clearTimeout(timeout);
      success = true;
    } catch (err) {
      console.error(`Attempt ${attempts} failed on node ${node.hostname}:`, err);
      // Wait a bit before retrying
      await new Promise(r => setTimeout(r, 500));
    }
  }

  if (!success && !res.writableEnded) {
    res.writeHead(504);
    res.end('Gateway Timeout: Failed to reach any residential nodes after multiple attempts');
  }
}

/**
 * Handles HTTPS CONNECT requests
 */
async function handleConnectRequest(req: http.IncomingMessage, socket: net.Socket, head: Buffer) {
  const key = extractKey(req);

  if (!key) {
    socket.write('HTTP/1.1 407 Proxy Authentication Required\r\nProxy-Authenticate: Basic realm="Rock or Bust"\r\n\r\n');
    socket.end();
    return;
  }

  const node = await getActiveNodeForKey(key);
  if (!node) {
    socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\nNo active residential nodes available for this key\r\n');
    socket.end();
    return;
  }

  console.log(`Forwarding CONNECT ${req.url} to node ${node.hostname}`);
  tunnelManager.forwardConnectRequest(node.ws, req, socket, head);
}

/**
 * Extracts the rob_ key from the Proxy-Authorization header or custom header
 */
function extractKey(req: http.IncomingMessage): string | null {
  const auth = req.headers['proxy-authorization'];
  if (auth && auth.startsWith('Basic ')) {
    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString();
    const [username] = credentials.split(':'); // Key is passed as username
    if (username.startsWith('rob_')) return username;
  }

  const customKey = req.headers['x-rob-key'];
  if (typeof customKey === 'string' && customKey.startsWith('rob_')) {
    return customKey;
  }

  return null;
}

/**
 * Validates the key and picks an online node from the registry
 */
async function getActiveNodeForKey(keyString: string) {
  // 1. Verify key in Supabase (we could cache this)
  const { data: keyData } = await supabase
    .from('rob_keys')
    .select('id')
    .eq('key_string', keyString)
    .eq('status', 'active')
    .single();

  if (!keyData) return null;

  // 2. Get next available node from registry
  return nodeRegistry.getNextNode(keyData.id);
}
