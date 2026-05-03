import { WebSocket } from 'ws';
import geoip from 'geoip-lite';

/**
 * NodeRegistry tracks the actual active WebSocket connections in memory.
 * This is used to route proxy requests to the correct Go CLI node.
 */
interface NodeConnection {
  id: string;
  ws: WebSocket;
  hostname: string;
  lastFail?: number;
  latency?: number;
  location?: {
    country: string;
    city: string;
    ll: [number, number];
  };
}

class NodeRegistry {
  // Map of KeyID -> Array of active WebSocket connections
  private connections: Map<string, Set<NodeConnection>> = new Map();

  private totalNodes: number = 0;

  register(keyId: string, nodeId: string, hostname: string, ws: WebSocket, ipAddress: string) {
    if (!this.connections.has(keyId)) {
      this.connections.set(keyId, new Set());
    }
    const keyConnections = this.connections.get(keyId);
    if (keyConnections) {
      // Perform Geo-IP lookup
      const geo = geoip.lookup(ipAddress);
      const location = geo ? {
        country: geo.country,
        city: geo.city,
        ll: geo.ll
      } : undefined;

      keyConnections.add({ 
        id: nodeId, 
        ws, 
        hostname, 
        latency: 999,
        location 
      });
      this.totalNodes++;
    }
  }

  getConnectionCount(keyId: string): number {
    return this.connections.get(keyId)?.size || 0;
  }

  getTotalCount(): number {
    return this.totalNodes;
  }

  private calculateTier(latency?: number): 'fast' | 'medium' | 'slow' {
    const l = latency || 999;
    if (l < 150) return 'fast';
    if (l < 450) return 'medium';
    return 'slow';
  }

  /**
   * Returns a sampled array of all active node locations across the entire network.
   * Useful for the landing page visualizer global state.
   */
  getGlobalSnapshots(limit: number = 100): any[] {
    const snapshots: any[] = [];
    for (const [_, keyConnections] of this.connections) {
      for (const conn of keyConnections) {
        if (conn.location) {
          snapshots.push({
            id: conn.id.substring(0, 4), // Anonymized
            latency: conn.latency,
            location: conn.location,
            tier: this.calculateTier(conn.latency)
          });
        }
        if (snapshots.length >= limit) return snapshots;
      }
    }
    return snapshots;
  }

  /**
   * Returns detailed node snapshots for a specific key.
   */
  getKeySnapshots(keyId: string): any[] {
    const keyConnections = this.connections.get(keyId);
    if (!keyConnections) return [];

    return Array.from(keyConnections).map(conn => ({
      id: conn.id.substring(0, 4),
      latency: conn.latency,
      location: conn.location,
      tier: this.calculateTier(conn.latency)
    }));
  }

  updateLatency(keyId: string, ws: WebSocket, ms: number) {
    const keyConnections = this.connections.get(keyId);
    if (keyConnections) {
      for (const conn of keyConnections) {
        if (conn.ws === ws) {
          conn.latency = ms;
          break;
        }
      }
    }
  }

  unregister(keyId: string, ws: WebSocket) {
    const keyConnections = this.connections.get(keyId);
    if (keyConnections) {
      for (const conn of keyConnections) {
        if (conn.ws === ws) {
          keyConnections.delete(conn);
          this.totalNodes = Math.max(0, this.totalNodes - 1);
          break;
        }
      }
      if (keyConnections.size === 0) {
        this.connections.delete(keyId);
      }
    }
  }

  /**
   * Temporarily penalize a node if it fails a request.
   */
  markFailed(keyId: string, nodeId: string) {
    const keyConnections = this.connections.get(keyId);
    if (keyConnections) {
      for (const conn of keyConnections) {
        if (conn.id === nodeId) {
          conn.lastFail = Date.now();
          // Also bump latency so it's deprioritized
          conn.latency = (conn.latency || 0) + 500;
          break;
        }
      }
    }
  }

  /**
   * Returns a high-speed active node for a specific key.
   * Prioritizes nodes with latency < 250ms that haven't failed recently.
   */
  getNextNode(keyId: string) {
    const keyConnections = this.connections.get(keyId);
    if (!keyConnections || keyConnections.size === 0) {
      return null;
    }
    
    const now = Date.now();
    const connectionsArr = Array.from(keyConnections);
    
    // 1. Filter out nodes that failed in the last 60 seconds
    const healthyNodes = connectionsArr.filter(c => !c.lastFail || (now - c.lastFail > 60000));
    if (healthyNodes.length === 0) return connectionsArr[Math.floor(Math.random() * connectionsArr.length)];

    // 2. Prioritize "Fast" nodes (latency < 250ms)
    const fastNodes = healthyNodes.filter(c => (c.latency || 999) < 250);
    
    const pool = fastNodes.length > 0 ? fastNodes : healthyNodes;
    
    // Pick a random node from the best available pool
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

export const nodeRegistry = new NodeRegistry();
