import { Router } from 'express';
import { nodeRegistry } from '../lib/nodeRegistry';

const router = Router();

/**
 * GET /api/stats/
 * Returns the total number of active residential nodes across all keys.
 */
router.get('/', (req, res) => {
  const total = nodeRegistry.getTotalCount();
  
  // Set cache headers to reduce load (cached for 5 seconds)
  res.set('Cache-Control', 'public, max-age=5');
  
  res.json({
    totalActiveNodes: total,
    status: 'operational',
    timestamp: Date.now()
  });
});

/**
 * GET /api/stats/:keyId
 * Returns the number of active residential nodes for a specific key.
 */
router.get('/:keyId', (req, res) => {
  const { keyId } = req.params;
  const count = nodeRegistry.getConnectionCount(keyId);
  
  res.json({
    activeNodes: count,
    status: count > 0 ? 'online' : 'no_nodes'
  });
});

export default router;
