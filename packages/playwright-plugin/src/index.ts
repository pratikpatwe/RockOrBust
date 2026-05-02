import { 
  chromium as pwChromium, 
  firefox as pwFirefox, 
  webkit as pwWebkit,
  BrowserType
} from 'playwright';
import http from 'http';
import { LaunchOptions } from './types';
import { STEALTH_SCRIPT } from './stealth';

const DEFAULT_GATEWAY = 'http://robapi.buildshot.xyz:8080';
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Helper to check node availability on the gateway.
 */
async function checkNodeAvailability(gatewayUrl: string, key: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const url = new URL(gatewayUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `/api/stats/${key}`,
        method: 'GET',
        timeout: 2000
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
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Augments a Playwright BrowserType with RockOrBust residential proxying and stealth.
 */
function wrapBrowserType<T extends BrowserType>(browserType: T): T {
  const originalLaunch = browserType.launch.bind(browserType);

  browserType.launch = async (options: LaunchOptions = {}) => {
    const { rockorbust, ...pwOptions } = options;

    if (!rockorbust) {
      return originalLaunch(pwOptions);
    }

    const { 
      key = process.env.ROB_KEY, 
      gatewayUrl = DEFAULT_GATEWAY, 
      stealth = true,
      fallbackToVps = false,
      fallbackToLocal = false
    } = rockorbust;

    if (!key || !key.startsWith('rob_')) {
      throw new Error('RockOrBust: A valid ROB key (rob_*) is required. Provide it in launch options or via ROB_KEY env var.');
    }

    // Handle Local Fallback
    if (fallbackToLocal) {
      const hasNodes = await checkNodeAvailability(gatewayUrl, key);
      if (!hasNodes) {
        return originalLaunch(pwOptions); // Skip all proxying and just launch natively
      }
    }

    const proxyUsername = fallbackToVps ? `${key}:fallback` : key;

    // Configure Proxy Gateway
    pwOptions.proxy = {
      server: gatewayUrl,
      username: proxyUsername,
      password: 'rob',
      ...pwOptions.proxy
    };

    // Apply Stealth Launch Arguments
    if (stealth) {
      pwOptions.args = [
        ...(pwOptions.args || []),
        '--disable-blink-features=AutomationControlled',
        '--force-device-scale-factor=1',
        '--hide-scrollbars'
      ];
      pwOptions.ignoreDefaultArgs = ['--enable-automation'];
    }

    const browser = await originalLaunch(pwOptions);

    // Patch BrowserContext to inject stealth scripts, mask User-Agent, and add Smart Diagnostics
    const originalNewContext = browser.newContext.bind(browser);
    browser.newContext = async (contextOptions = {}) => {
      if (stealth && !contextOptions.userAgent) {
        contextOptions.userAgent = DEFAULT_USER_AGENT;
      }
      
      const context = await originalNewContext(contextOptions);
      
      if (stealth) {
        await context.addInitScript(STEALTH_SCRIPT);
      }

      // Smart Error Diagnostics
      context.on('requestfailed', async (request) => {
        const failure = request.failure();
        if (failure && (failure.errorText.includes('ERR_TUNNEL_CONNECTION_FAILED') || failure.errorText.includes('ERR_PROXY_CONNECTION_FAILED'))) {
          const hasNodes = await checkNodeAvailability(gatewayUrl, key);
          if (!hasNodes) {
            console.error(`\n\x1b[31m[RockOrBust] CRITICAL: Connection failed because no residential nodes are available for your key.\x1b[0m`);
            console.error(`\x1b[33m[RockOrBust] TIP: Turn on a Go CLI node or enable 'fallbackToLocal: true' in your launch options.\n\x1b[0m`);
          }
        }
      });

      return context;
    };

    return browser;
  };

  return browserType;
}

export const chromium = wrapBrowserType(pwChromium);
export const firefox = wrapBrowserType(pwFirefox);
export const webkit = wrapBrowserType(pwWebkit);

export * from './types';
