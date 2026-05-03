export function getIceConfig() {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
  ];

  // If a TURN server is configured via env, add it
  // Assuming standard coturn deployment on the same server
  const turnSecret = process.env.TURN_SECRET;
  const turnHost = process.env.TURN_HOST || 'robapi.buildshot.xyz';
  
  if (turnSecret) {
    // Basic static auth for coturn
    servers.push({
      urls: `turn:${turnHost}:3478`,
      username: 'rockorbust', // In a production env with dynamic auth, this would be short-lived
      credential: turnSecret,
    } as any);
  }

  return servers;
}
