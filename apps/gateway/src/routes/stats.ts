import { Router } from 'express';
import { nodeRegistry } from '../lib/nodeRegistry';

const router = Router();

/**
 * GET /api/stats/
 * Returns the total number of active residential nodes across all keys.
 */
router.get('/', (req, res) => {
  const total = nodeRegistry.getTotalCount();
  const nodes = nodeRegistry.getGlobalSnapshots(50); // Sample 50 nodes for landing page
  
  // Set cache headers to reduce load (cached for 5 seconds)
  res.set('Cache-Control', 'public, max-age=5');
  
  res.json({
    totalActiveNodes: total,
    nodes,
    status: 'operational',
    timestamp: Date.now()
  });
});

/**
 * GET /api/stats/:keyId
 * Returns the number of active residential nodes and their visualizer details for a specific key.
 */
router.get('/:keyId', (req, res) => {
  const { keyId } = req.params;
  const count = nodeRegistry.getConnectionCount(keyId);
  const nodes = nodeRegistry.getKeySnapshots(keyId);
  
  res.json({
    activeNodes: count,
    nodes,
    status: count > 0 ? 'online' : 'no_nodes'
  });
});

export default router;
