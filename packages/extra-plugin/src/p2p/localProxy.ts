import http from 'http';
import net from 'net';
import crypto from 'crypto';
import { P2PSession } from './datachannel';

export interface LocalProxy {
  port: number;
  server: http.Server;
  close: () => void;
}

export async function startLocalProxy(session: P2PSession): Promise<LocalProxy> {
  const { dataChannel } = session;
  
  const pendingRequests = new Map<string, {
    req?: http.IncomingMessage;
    res?: http.ServerResponse;
    socket?: net.Socket;
    type: 'HTTP' | 'CONNECT';
  }>();

  dataChannel.onMessage((msg) => {
    let payload;
    try {
      if (typeof msg === 'string') {
        payload = JSON.parse(msg);
      } else {
        payload = JSON.parse(Buffer.from(msg as any).toString('utf8'));
      }
    } catch (e) {
      return;
    }

    const reqData = pendingRequests.get(payload.id);
    if (!reqData) return;

    if (payload.type === 'HTTP_RESPONSE') {
      if (reqData.res && !reqData.res.headersSent) {
        reqData.res.writeHead(payload.status, payload.headers);
        if (payload.body) {
          reqData.res.end(Buffer.from(payload.body, 'base64'));
        } else {
          reqData.res.end();
        }
      }
      pendingRequests.delete(payload.id);
    } else if (payload.type === 'CONNECT_ESTABLISHED') {
      if (reqData.socket) {
        reqData.socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      }
    } else if (payload.type === 'CONNECT_DATA') {
      if (reqData.socket) {
        reqData.socket.write(Buffer.from(payload.data, 'base64'));
      }
    } else if (payload.type === 'CONNECT_CLOSE') {
      if (reqData.socket) {
        reqData.socket.end();
      }
      pendingRequests.delete(payload.id);
    } else if (payload.type === 'ERROR') {
      if (reqData.type === 'HTTP' && reqData.res && !reqData.res.headersSent) {
        reqData.res.writeHead(502);
        reqData.res.end();
      } else if (reqData.socket) {
        reqData.socket.end();
      }
      pendingRequests.delete(payload.id);
    }
  });

  const sendOverDc = (msg: any) => {
    try {
      if (dataChannel.isOpen()) {
        dataChannel.sendMessage(JSON.stringify(msg));
      }
    } catch (e) {}
  };

  const server = http.createServer((req, res) => {
    const id = crypto.randomUUID();
    pendingRequests.set(id, { req, res, type: 'HTTP' });

    const bodyChunks: Buffer[] = [];
    req.on('data', (c: Buffer) => bodyChunks.push(c));
    req.on('end', () => {
      const body = bodyChunks.length ? Buffer.concat(bodyChunks).toString('base64') : undefined;
      sendOverDc({
        type: 'HTTP_REQUEST',
        id,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body
      });
    });
  });

  server.on('connect', (req, socket, head) => {
    const id = crypto.randomUUID();
    pendingRequests.set(id, { req: req as any, socket: socket as net.Socket, type: 'CONNECT' });

    sendOverDc({
      type: 'CONNECT_REQUEST',
      id,
      url: req.url
    });

    if (head && head.length > 0) {
      sendOverDc({
        type: 'CONNECT_DATA',
        id,
        data: head.toString('base64')
      });
    }

    socket.on('data', (data: Buffer) => {
      sendOverDc({
        type: 'CONNECT_DATA',
        id,
        data: data.toString('base64')
      });
    });

    socket.on('end', () => {
      sendOverDc({
        type: 'CONNECT_CLOSE',
        id
      });
    });
    
    socket.on('error', () => {
      sendOverDc({
        type: 'CONNECT_CLOSE',
        id
      });
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as net.AddressInfo;
      resolve({
        port: address.port,
        server,
        close: () => {
          server.close();
          session.close();
        }
      });
    });
  });
}
