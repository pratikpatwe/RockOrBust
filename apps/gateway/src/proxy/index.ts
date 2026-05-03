import http from 'http';
import net from 'net';
import { supabase } from '../lib/supabase';
import { nodeRegistry } from '../lib/nodeRegistry';
import { tunnelManager } from '../lib/tunnelManager';

import { keyCache } from '../lib/keyCache';

/**
 * The Proxy Engine handles incoming requests from the Playwright plugin.
 * It validates the key and selects an active node for tunneling.
 */
export function setupProxy(server: http.Server) {
  // 1. Handle HTTPS CONNECT requests (Always proxy)
  server.on('connect', (req, socket, head) => {
    handleConnectRequest(req, socket as net.Socket, head);
  });

  // 2. Handle standard HTTP proxy requests
  // We intercept the 'request' event to distinguish between local API calls and proxy calls.
  const originalListeners = server.listeners('request').slice();
  server.removeAllListeners('request');

  server.on('request', (req, res) => {
    // Proxy requests have absolute URLs (e.g., http://google.com)
    // Local API requests have relative paths (e.g., /auth/register)
    const isProxyRequest = req.url?.startsWith('http://') || req.url?.startsWith('https://');

    if (isProxyRequest) {
      handleProxyRequest(req, res);
    } else {
      // Not a proxy request, pass it to the original listeners (Express)
      for (const listener of originalListeners) {
        (listener as any)(req, res);
      }
    }
  });

  console.log(`Rock or Bust Proxy Engine multiplexed on main port`);
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

  const node = await getActiveNodeForKey(key);
  
  if (!node) {
    res.writeHead(502);
    res.end('No active residential nodes available for this key');
    return;
  }

  // Collect request body
  const bodyChunks: Buffer[] = [];
  req.on('data', chunk => bodyChunks.push(chunk));
  req.on('end', () => {
    const fullBody = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined;
    console.log(`Forwarding HTTP ${req.method} ${req.url} to node ${node.hostname}`);
    tunnelManager.forwardHttpRequest(node.ws, req, res, fullBody);
  });
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
 * Extracts the rob_ key from the Proxy-Authorization header
 */
function extractKey(req: http.IncomingMessage): string | null {
  let rawKey: string | null = null;
  
  const auth = req.headers['proxy-authorization'];
  if (auth && auth.startsWith('Basic ')) {
    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString();
    // The rawKey is everything before the last colon (which separates username from password)
    const lastColonIndex = credentials.lastIndexOf(':');
    rawKey = lastColonIndex !== -1 ? credentials.substring(0, lastColonIndex) : credentials;
  }

  const customKey = req.headers['x-rob-key'];
  if (typeof customKey === 'string') {
    rawKey = customKey;
  }

  if (!rawKey || !rawKey.startsWith('rob_')) {
    return null;
  }

  // Strip off any old fallback options like rob_key:fallback
  return rawKey.split(':')[0];
}

/**
 * Validates the key against Supabase (with in-memory cache) and picks an
 * online node from the registry. Cache TTL is 5 minutes to reduce DB load.
 */
async function getActiveNodeForKey(keyString: string) {
  // 1. Fast path: key already validated recently
  if (!keyCache.get(keyString)) {
    // 2. Slow path: verify against Supabase
    const { data, error } = await supabase
      .from('rob_keys')
      .select('id')
      .eq('key_string', keyString)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      // Unknown or revoked key — do not route
      return null;
    }

    // Cache the validated key for 5 minutes
    keyCache.set(keyString, data.id);
  }

  return nodeRegistry.getNextNode(keyString);
}
