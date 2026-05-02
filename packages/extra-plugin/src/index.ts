import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin';

export interface RockOrBustOptions {
  /** The RockOrBust ROB key (starts with 'rob_'). */
  key?: string;
  /** The RockOrBust Gateway endpoint URL. */
  gatewayUrl?: string;
  /** Whether to fallback to the VPS IP if no residential nodes are available. */
  fallbackToVps?: boolean;
}

const DEFAULT_GATEWAY = 'http://robapi.buildshot.xyz:8080';
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * RockOrBustExtraPlugin
 * 
 * Provides automated residential proxy routing for Puppeteer and Playwright
 * via the RockOrBust decentralized gateway.
 */
export class RockOrBustExtraPlugin extends PuppeteerExtraPlugin {
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
      fallbackToVps: false
    };
  }

  /**
   * Intercepts browser launch to configure global proxy settings and base flags.
   * Supports launch(), launchPersistentContext(), and connect().
   */
  async beforeLaunch(options: any) {
    const pluginOpts = (this as any).opts || {};
    const opts = { ...this.defaults, ...pluginOpts };
    const { key, gatewayUrl, fallbackToVps } = opts;

    if (!key || !key.startsWith('rob_')) {
      throw new Error(
        'RockOrBust: A valid ROB key (rob_*) is required. ' +
        'Specify it in the plugin constructor or via the ROB_KEY environment variable.'
      );
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

  /**
   * Playwright-specific hook to ensure User-Agent persistence across new contexts.
   */
  async beforeContext(options: any) {
    if (!options.userAgent) {
      (this as any).debug('Setting default User-Agent for new Playwright context');
      options.userAgent = DEFAULT_USER_AGENT;
    }
  }

  /**
   * Puppeteer-specific hook to ensure User-Agent persistence across new pages.
   */
  async onPageCreated(page: any) {
    if (page.setUserAgent) {
      await page.setUserAgent(DEFAULT_USER_AGENT);
    }
  }
}

export default (options?: RockOrBustOptions) => new RockOrBustExtraPlugin(options);
