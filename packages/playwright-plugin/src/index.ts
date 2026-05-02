import { 
  chromium as pwChromium, 
  firefox as pwFirefox, 
  webkit as pwWebkit,
  Browser,
  BrowserContext,
  BrowserType
} from 'playwright';
import { LaunchOptions, RockOrBustOptions } from './types';
import { STEALTH_SCRIPT } from './stealth';

const DEFAULT_GATEWAY = 'http://robapi.buildshot.xyz:8080';
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
      fallbackToVps = false
    } = rockorbust;

    if (!key || !key.startsWith('rob_')) {
      throw new Error('RockOrBust: A valid ROB key (rob_*) is required. Provide it in launch options or via ROB_KEY env var.');
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

    // Patch BrowserContext to inject stealth scripts and mask User-Agent
    if (stealth) {
      const originalNewContext = browser.newContext.bind(browser);
      browser.newContext = async (contextOptions = {}) => {
        if (!contextOptions.userAgent) {
          contextOptions.userAgent = DEFAULT_USER_AGENT;
        }
        const context = await originalNewContext(contextOptions);
        await context.addInitScript(STEALTH_SCRIPT);
        return context;
      };
    }

    return browser;
  };

  return browserType;
}

export const chromium = wrapBrowserType(pwChromium);
export const firefox = wrapBrowserType(pwFirefox);
export const webkit = wrapBrowserType(pwWebkit);

export * from './types';
