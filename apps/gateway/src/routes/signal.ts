import { Router } from 'express';
import { nodeRegistry } from '../lib/nodeRegistry';
import { signalingManager } from '../lib/signalingManager';
import { keyCache } from '../lib/keyCache';
import { getIceConfig } from '../lib/iceConfig';
import { supabase } from '../lib/supabase';

const router = Router();

router.post('/:keyId', async (req, res) => {
  const { keyId } = req.params;
  const { sdp, candidates } = req.body;

  if (!sdp || !candidates) {
    return res.status(400).json({ error: 'Missing sdp or candidates' });
  }

  // 1. Authenticate Key
  let actualKeyId = keyCache.get(keyId);
  if (!actualKeyId) {
    const { data, error } = await supabase
      .from('rob_keys')
      .select('id')
      .eq('key_string', keyId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Unauthorized: Invalid key' });
    }
    actualKeyId = data.id as string;
    if (actualKeyId) {
      keyCache.set(keyId, actualKeyId);
    }
  }

  // 2. Select Node
  const node = nodeRegistry.getNextNode(keyId);
  if (!node) {
    return res.status(503).json({ error: 'No active nodes available for this key' });
  }

  // 3. Create Signaling Session
  const { sessionId, promise } = signalingManager.createSession();

  // 4. Forward Offer to Node via WebSocket
  try {
    node.ws.send(JSON.stringify({
      type: 'SIGNALING_OFFER',
      sessionId,
      sdp,
      candidates
    }));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send signaling offer to node' });
  }

  // 5. Wait for Answer
  try {
    const answer = await promise;
    // Inject ICE config into the response
    const iceServers = getIceConfig();
    return res.json({
      sdp: answer.sdp,
      candidates: answer.candidates,
      iceServers
    });
  } catch (err) {
    // If signaling fails, penalize the node so it doesn't get picked again immediately
    nodeRegistry.markFailed(keyId, node.id);
    return res.status(504).json({ error: 'Signaling timeout: Node did not respond' });
  }
});

export default router;
