import { Router } from 'express';
import { getLatestRelease, getAssetUrl } from '../lib/updater';

const router = Router();

/**
 * GET /api/cli/latest
 * Returns the latest CLI version and download URL for the requesting OS.
 */
router.get('/latest', (req, res) => {
  const latest = getLatestRelease();

  if (!latest) {
    return res.status(503).json({ 
      error: 'Update information currently unavailable. Please try again in a minute.' 
    });
  }

  // Detect OS and Arch from query params or User-Agent
  // Note: Current CLI doesn't send these yet, so we default to Windows
  // if not provided, to maintain backward compatibility with the current structure.
  const os = (req.query.os as string) || 'windows';
  const arch = (req.query.arch as string) || 'amd64';

  const downloadUrl = getAssetUrl(os, arch);

  if (!downloadUrl) {
    console.warn(`[CLI] Download request failed: No binary found for OS=${os}, Arch=${arch}`);
    return res.status(404).json({ 
      error: `No binary found for OS: ${os}, Arch: ${arch}` 
    });
  }

  res.json({
    version: latest.version,
    url: downloadUrl
  });
});

export default router;
