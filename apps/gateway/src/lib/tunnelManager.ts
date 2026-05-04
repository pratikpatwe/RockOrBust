import { WebSocket } from 'ws';
import http from 'http';
import net from 'net';
import { nanoid } from 'nanoid';

/**
 * TunnelManager handles the multiplexing of multiple proxy requests 
 * over a single WebSocket connection to a Go CLI node.
 */
class TunnelManager {
  // Map of RequestID -> pending Response or Socket
  private pendingRequests: Map<string, { 
    res?: http.ServerResponse, 
    socket?: net.Socket,
    type: 'HTTP' | 'CONNECT'
  }> = new Map();

  /**
   * Forwards an HTTP request to a node
   */
  forwardHttpRequest(ws: WebSocket, req: http.IncomingMessage, res: http.ServerResponse, body?: Buffer) {
    const requestId = nanoid();
    
    this.pendingRequests.set(requestId, { res, type: 'HTTP' });

    // Strip proxy-specific headers before forwarding to the residential node.
    // These headers are definitive bot-detection signals and must never reach the target server.
    const {
      'proxy-authorization': _auth,
      'proxy-connection': _conn,
      ...cleanHeaders
    } = req.headers;

    // Normalize the 'host' header. When sent through a proxy, the host header
    // can arrive as an absolute URL (e.g., "http://google.com:80"). A direct
    // browser connection always sends just the hostname (e.g., "google.com").
    // Forwarding the absolute format is a detectable proxy signal.
    if (cleanHeaders.host) {
      try {
        const hostUrl = cleanHeaders.host.startsWith('http')
          ? new URL(cleanHeaders.host)
          : new URL(`http://${cleanHeaders.host}`);
        // Reconstruct: use hostname only, append port only if non-standard
        const isDefaultPort = !hostUrl.port || hostUrl.port === '80' || hostUrl.port === '443';
        cleanHeaders.host = isDefaultPort ? hostUrl.hostname : `${hostUrl.hostname}:${hostUrl.port}`;
      } catch {
        // If parsing fails, leave the host header as-is
      }
    }

    const payload = {
      type: 'HTTP_REQUEST',
      id: requestId,
      method: req.method,
      url: req.url,
      headers: cleanHeaders,
      body: body ? body.toString('base64') : null
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      res.writeHead(502);
      res.end('Node Disconnected');
      return;
    }

    // Cleanup if the client disconnects before the node responds
    res.on('close', () => {
      this.pendingRequests.delete(requestId);
    });
  }

  /**
   * Forwards an HTTPS CONNECT stream to a node
   */
  forwardConnectRequest(ws: WebSocket, req: http.IncomingMessage, socket: net.Socket, head: Buffer) {
    const requestId = nanoid();
    
    this.pendingRequests.set(requestId, { socket, type: 'CONNECT' });

    const payload = {
      type: 'CONNECT_REQUEST',
      id: requestId,
      url: req.url, // e.g., google.com:443
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      socket.end();
      return;
    }

    // Handle data coming from the Playwright client
    socket.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'CONNECT_DATA',
          id: requestId,
          data: data.toString('base64')
        }));
      }
    });

    socket.on('close', () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'CONNECT_CLOSE', id: requestId }));
      }
      this.pendingRequests.delete(requestId);
    });
  }

  /**
   * Handles incoming messages from the Go CLI node
   */
  handleNodeMessage(ws: WebSocket, data: string) {
    try {
      const message = JSON.parse(data);
      const pending = this.pendingRequests.get(message.id);

      if (!pending) return;

      switch (message.type) {
        case 'HTTP_RESPONSE':
          if (pending.res) {
            pending.res.writeHead(message.status, message.headers);
            const body = message.body ? Buffer.from(message.body, 'base64') : null;
            pending.res.end(body);
            this.pendingRequests.delete(message.id);
          }
          break;

        case 'CONNECT_ESTABLISHED':
          if (pending.socket) {
            pending.socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          }
          break;

        case 'CONNECT_DATA':
          if (pending.socket) {
            pending.socket.write(Buffer.from(message.data, 'base64'));
          }
          break;

        case 'CONNECT_CLOSE':
          if (pending.socket) {
            pending.socket.end();
          }
          this.pendingRequests.delete(message.id);
          break;

        case 'ERROR':
          if (pending.res) {
            pending.res.writeHead(502);
            pending.res.end(message.message || 'Node Error');
          } else if (pending.socket) {
            pending.socket.end();
          }
          this.pendingRequests.delete(message.id);
          break;
      }
    } catch (err) {
      console.error('Error handling node message:', err);
    }
  }
}

export const tunnelManager = new TunnelManager();
