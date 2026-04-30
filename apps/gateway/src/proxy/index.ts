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
  const { key, fallback } = extractKeyAndOptions(req);

  if (!key) {
    res.writeHead(407, { 'Proxy-Authenticate': 'Basic realm="Rock or Bust"' });
    res.end('Proxy Authentication Required');
    return;
  }

  const node = await getActiveNodeForKey(key);
  
  if (!node) {
    if (fallback) {
      console.log(`No node for ${key}, falling back to VPS IP for HTTP ${req.method} ${req.url}`);
      
      const targetUrl = new URL(req.url!);
      const proxyReq = http.request({
        hostname: targetUrl.hostname,
        port: targetUrl.port || 80,
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: req.headers
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        console.error('VPS Fallback HTTP error:', err.message);
        res.writeHead(502);
        res.end('VPS Fallback failed');
      });

      req.pipe(proxyReq);
      return;
    }
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
  const { key, fallback } = extractKeyAndOptions(req);

  if (!key) {
    socket.write('HTTP/1.1 407 Proxy Authentication Required\r\nProxy-Authenticate: Basic realm="Rock or Bust"\r\n\r\n');
    socket.end();
    return;
  }

  const node = await getActiveNodeForKey(key);
  
  if (!node) {
    if (fallback) {
      console.log(`No node for ${key}, falling back to VPS IP for CONNECT ${req.url}`);
      const [host, port] = req.url!.split(':');
      const proxySocket = net.connect(parseInt(port), host, () => {
        socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        proxySocket.write(head);
        proxySocket.pipe(socket);
        socket.pipe(proxySocket);
      });
      proxySocket.on('error', () => socket.end());
      return;
    }
    socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\nNo active residential nodes available for this key\r\n');
    socket.end();
    return;
  }

  console.log(`Forwarding CONNECT ${req.url} to node ${node.hostname}`);
  tunnelManager.forwardConnectRequest(node.ws, req, socket, head);
}

/**
 * Extracts the rob_ key and options from the Proxy-Authorization header
 * Format: rob_key:option1,option2
 */
function extractKeyAndOptions(req: http.IncomingMessage): { key: string | null; fallback: boolean } {
  let rawKey: string | null = null;
  
  const auth = req.headers['proxy-authorization'];
  if (auth && auth.startsWith('Basic ')) {
    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString();
    const [username] = credentials.split(':');
    rawKey = username;
  }

  const customKey = req.headers['x-rob-key'];
  if (typeof customKey === 'string') {
    rawKey = customKey;
  }

  if (!rawKey || !rawKey.startsWith('rob_')) {
    return { key: null, fallback: false };
  }

  // Check for fallback flag in format rob_key:fallback
  const [key, options] = rawKey.split(':');
  const fallback = options === 'fallback';

  return { key, fallback };
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
