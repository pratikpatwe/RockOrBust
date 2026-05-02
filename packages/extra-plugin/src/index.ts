import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin';
import http from 'http';

/**
 * Configuration options for the RockOrBustExtraPlugin.
 */
interface RockOrBustOptions {
  /** The RockOrBust ROB key (starts with 'rob_'). */
  key?: string;
  /** The RockOrBust Gateway endpoint URL. */
  gatewayUrl?: string;
  /** Whether to fallback to the VPS IP if no residential nodes are available. */
  fallbackToVps?: boolean;
  /** Whether to use the local machine IP if no residential nodes are available. */
  fallbackToLocal?: boolean;
}

const DEFAULT_GATEWAY = 'http://robapi.buildshot.xyz:8080';
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * RockOrBustExtraPlugin
 * 
 * Provides automated residential proxy routing for Puppeteer and Playwright
 * via the RockOrBust decentralized gateway.
 */
class RockOrBustExtraPlugin extends PuppeteerExtraPlugin {
  constructor(opts: RockOrBustOptions = {}) {
    super(opts);
  }

  get name() {
    return 'rockorbust';
  }

  get defaults(): RockOrBustOptions {
    return {
      key: process.env.ROB_KEY,
      gatewayUrl: DEFAULT_GATEWAY,
      fallbackToVps: false,
      fallbackToLocal: false
    };
  }

  /**
   * Helper to check node availability on the gateway.
   */
  private async checkNodeAvailability(gatewayUrl: string, key: string): Promise<boolean> {
    return new Promise((resolve) => {
      const url = new URL(gatewayUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `/api/stats/${key}`,
        method: 'GET',
        timeout: 2000 // 2 second timeout for the check
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json.activeNodes > 0);
          } catch (e) {
            resolve(false);
          }
        });
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    });
  }

  /**
   * Intercepts browser launch to configure global proxy settings and base flags.
   */
  async beforeLaunch(options: any) {
    const pluginOpts = (this as any).opts || {};
    const opts = { ...this.defaults, ...pluginOpts };
    const { key, gatewayUrl, fallbackToVps, fallbackToLocal } = opts;

    if (!key || !key.startsWith('rob_')) {
      throw new Error(
        'RockOrBust: A valid ROB key (rob_*) is required. ' +
        'Specify it in the plugin constructor or via the ROB_KEY environment variable.'
      );
    }

    // Handle Local Fallback
    if (fallbackToLocal) {
      this.debug('Checking node availability for Local Fallback...');
      const hasNodes = await this.checkNodeAvailability(gatewayUrl, key);
      if (!hasNodes) {
        this.debug('No residential nodes available. Falling back to local connection.');
        return; // Skip proxy configuration
      }
    }

    const proxyUsername = fallbackToVps ? `${key}:fallback` : key;
    
    if (!options.proxy || !options.proxy.server) {
      options.proxy = {
        server: gatewayUrl,
        username: proxyUsername,
        password: 'rob',
        ...options.proxy
      };
    }

    options.args = [
      ...(options.args || []),
      '--disable-blink-features=AutomationControlled',
      '--force-device-scale-factor=1',
      '--hide-scrollbars'
    ];

    if (!options.userAgent) {
      options.userAgent = DEFAULT_USER_AGENT;
    }
  }

  async beforeContext(options: any) {
    if (!options.userAgent) {
      (this as any).debug('Setting default User-Agent for new Playwright context');
      options.userAgent = DEFAULT_USER_AGENT;
    }
  }

  async onPageCreated(page: any) {
    if (page.setUserAgent) {
      await page.setUserAgent(DEFAULT_USER_AGENT);
    }
  }
}

/**
 * Factory function for creating a new RockOrBustExtraPlugin instance.
 */
function rockorbust(options?: RockOrBustOptions) {
  return new RockOrBustExtraPlugin(options);
}

/**
 * Namespace merging to export types and classes alongside the factory function.
 */
namespace rockorbust {
  export type Options = RockOrBustOptions;
  export const Plugin = RockOrBustExtraPlugin;
}

(rockorbust as any).default = rockorbust;

export = rockorbust;
