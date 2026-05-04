import crypto from 'crypto';

export function getIceConfig() {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
  ];

  // If a TURN server is configured via env, add it
  // Assuming standard coturn deployment on the same server
  const turnSecret = process.env.TURN_SECRET;
  const turnHost = process.env.TURN_HOST || 'robapi.buildshot.xyz';
  
  if (turnSecret) {
    const ttl = 86400; // 24 hours
    const timestamp = Math.floor(Date.now() / 1000) + ttl;
    const username = `${timestamp}:rockorbust`;
    const credential = crypto
      .createHmac('sha1', turnSecret)
      .update(username)
      .digest('base64');

    servers.push({
      urls: `turn:${turnHost}:3478`,
      username,
      credential,
    } as any);
  }

  return servers;
}
