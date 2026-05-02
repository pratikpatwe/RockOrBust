import { Router } from 'express';
import { nodeRegistry } from '../lib/nodeRegistry';

const router = Router();

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
