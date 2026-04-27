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
    
    // NOTE: Retry logic and proper async error handling will be implemented
    // in a future phase once tunnelManager.forwardHttpRequest is refactored to return a Promise.
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
 * Validates the key and picks an online node from the registry.
 * Uses an in-memory cache to reduce Supabase round-trips.
 */
async function getActiveNodeForKey(keyString: string) {
  // Check in-memory cache first
  let keyId = keyCache.get(keyString);

  if (!keyId) {
    // 1. Verify key in Supabase
    const { data: keyData } = await supabase
      .from('rob_keys')
      .select('id')
      .eq('key_string', keyString)
      .eq('status', 'active')
      .single();

    if (!keyData) {
      // If no result from Supabase, ensure it's not in cache
      keyCache.invalidate(keyString);
      return null;
    }

    keyId = keyData.id;
    keyCache.set(keyString, keyId as string);
  }

  // 2. Get next available node from registry
  return nodeRegistry.getNextNode(keyId as string);
}
