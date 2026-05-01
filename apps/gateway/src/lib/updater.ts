import fs from 'fs';
import path from 'path';

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  assets: ReleaseAsset[];
}

interface LatestReleaseInfo {
  version: string;
  assets: Record<string, string>;
  lastFetched: number;
}

const GITHUB_REPO = 'pratikpatwe/RockOrBust';
const FETCH_INTERVAL = 62 * 1000; // 62 seconds to stay under 60 req/hour limit
const CACHE_FILE = path.join(process.cwd(), 'latest_release.json');

let latestRelease: LatestReleaseInfo | null = null;

// Try to load initial cache from disk at startup
try {
  if (fs.existsSync(CACHE_FILE)) {
    latestRelease = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    // console.log(`[Updater] Loaded initial cache from disk: ${latestRelease?.version}`);
  }
} catch (err) {
  // console.error('[Updater] Failed to load disk cache:', err);
}

/**
 * Fetches the latest release info from GitHub API.
 */
async function fetchLatestFromGitHub() {
  try {
    // We use /releases instead of /releases/latest because GitHub hides 
    // "Pre-releases" (like beta versions) from the /latest endpoint.
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'RockOrBust-Gateway-Updater'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const releases = (await response.json()) as GitHubRelease[];
    
    if (!releases || releases.length === 0) {
      throw new Error('No releases found in the repository');
    }

    // The first item is always the most recent release (including pre-releases)
    const data = releases[0];
    const assets: Record<string, string> = {};

    data.assets.forEach(asset => {
      assets[asset.name] = asset.browser_download_url;
    });

    latestRelease = {
      version: data.tag_name,
      assets,
      lastFetched: Date.now()
    };

    // Save to disk cache for persistence
    fs.writeFileSync(CACHE_FILE, JSON.stringify(latestRelease, null, 2));

    // console.log(`[Updater] Synced latest release from GitHub: ${data.tag_name}`);
  } catch (error) {
    // console.error('[Updater] Failed to fetch latest release from GitHub:', error);
  }
}

/**
 * Starts the background polling task.
 */
export function startUpdater() {
  fetchLatestFromGitHub();
  setInterval(fetchLatestFromGitHub, FETCH_INTERVAL);
}

/**
 * Returns the latest release info from cache.
 */
export function getLatestRelease() {
  return latestRelease;
}

/**
 * Maps OS and Arch to the correct asset filename.
 * Logic based on RockOrBust/Makefile build targets.
 */
export function getAssetUrl(os: string, arch: string): string | null {
  if (!latestRelease) return null;

  let filename = '';
  const cleanOS = os.toLowerCase();
  const cleanArch = arch.toLowerCase();

  if (cleanOS === 'windows') {
    filename = 'rockorbust-windows-amd64.exe';
  } else if (cleanOS === 'linux') {
    filename = 'rockorbust-linux-amd64';
  } else if (cleanOS === 'darwin') {
    if (cleanArch === 'arm64') {
      filename = 'rockorbust-darwin-arm64';
    } else {
      filename = 'rockorbust-darwin-amd64';
    }
  }

  return latestRelease.assets[filename] || null;
}
