import { WebSocket } from 'ws';

/**
 * NodeRegistry tracks the actual active WebSocket connections in memory.
 * This is used to route proxy requests to the correct Go CLI node.
 */
class NodeRegistry {
  // Map of KeyID -> Array of active WebSocket connections
  private connections: Map<string, Set<{ id: string; ws: WebSocket; hostname: string, lastFail?: number }>> = new Map();

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
   * Temporarily penalize a node if it fails a request.
   */
  markFailed(keyId: string, nodeId: string) {
    const keyConnections = this.connections.get(keyId);
    if (keyConnections) {
      for (const conn of keyConnections) {
        if (conn.id === nodeId) {
          conn.lastFail = Date.now();
          break;
        }
      }
    }
  }

  /**
   * Returns a random active node for a specific key, 
   * prioritizing nodes that haven't failed recently.
   */
  getNextNode(keyId: string) {
    const keyConnections = this.connections.get(keyId);
    if (!keyConnections || keyConnections.size === 0) {
      return null;
    }
    
    const now = Date.now();
    const connectionsArr = Array.from(keyConnections);
    
    // Filter out nodes that failed in the last 60 seconds
    const healthyNodes = connectionsArr.filter(c => !c.lastFail || (now - c.lastFail > 60000));
    
    const pool = healthyNodes.length > 0 ? healthyNodes : connectionsArr;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

export const nodeRegistry = new NodeRegistry();
