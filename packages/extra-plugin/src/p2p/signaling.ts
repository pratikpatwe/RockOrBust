import http from 'http';
import https from 'https';

export interface SignalingOffer {
  sdp: string;
  candidates: string[];
}

export interface SignalingAnswer {
  sdp: string;
  candidates: string[];
  iceServers: { urls: string | string[], username?: string, credential?: string }[];
}

export async function sendSignalingOffer(gatewayUrl: string, key: string, offer: SignalingOffer, timeoutMs = 10000): Promise<SignalingAnswer> {
  return new Promise((resolve, reject) => {
    try {
      const httpGatewayUrl = gatewayUrl.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://');
      const url = new URL(`${httpGatewayUrl}/api/signal/${key}`);
      const data = JSON.stringify(offer);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        timeout: timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const requestModule = url.protocol === 'https:' ? https : http;

      const req = requestModule.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(responseData));
            } catch (e) {
              reject(new Error('Invalid JSON response from gateway'));
            }
          } else {
            reject(new Error(`Signaling failed with status ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Signaling request timed out'));
      });

      req.write(data);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}
