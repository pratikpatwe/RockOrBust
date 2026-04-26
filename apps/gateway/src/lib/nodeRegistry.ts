import { WebSocket } from 'ws';

/**
 * NodeRegistry tracks the actual active WebSocket connections in memory.
 * This is used to route proxy requests to the correct Go CLI node.
 */
class NodeRegistry {
  // Map of KeyID -> Array of active WebSocket connections
  private connections: Map<string, Set<{ id: string; ws: WebSocket; hostname: string }>> = new Map();

  register(keyId: string, nodeId: string, hostname: string, ws: WebSocket) {
    if (!this.connections.has(keyId)) {
      this.connections.set(keyId, new Set());
    }
    this.connections.get(keyId)?.add({ id: nodeId, ws, hostname });
  }

  unregister(keyId: string, ws: WebSocket) {
    const keyConnections = this.connections.get(keyId);
    if (keyConnections) {
      for (const conn of keyConnections) {
        if (conn.ws === ws) {
          keyConnections.delete(conn);
          break;
        }
      }
      if (keyConnections.size === 0) {
        this.connections.delete(keyId);
      }
    }
  }

  /**
   * Returns a random active node for a specific key.
   * In the future, this can be improved with latency-based load balancing.
   */
  getNextNode(keyId: string) {
    const keyConnections = this.connections.get(keyId);
    if (!keyConnections || keyConnections.size === 0) {
      return null;
    }
    const connectionsArr = Array.from(keyConnections);
    return connectionsArr[Math.floor(Math.random() * connectionsArr.length)];
  }
}

export const nodeRegistry = new NodeRegistry();
