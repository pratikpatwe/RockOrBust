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

const DEFAULT_GATEWAY = 'https://robapi.buildshot.xyz/';

function wrapBrowserType<T extends BrowserType>(browserType: T): T {
  const originalLaunch = browserType.launch.bind(browserType);

  browserType.launch = async (options: LaunchOptions = {}) => {
    const { rockorbust, ...pwOptions } = options;

    if (!rockorbust) {
      return originalLaunch(pwOptions);
    }

    const { 
      key, 
      gatewayUrl = DEFAULT_GATEWAY, 
      stealth = true,
      fallbackToVps = false
    } = rockorbust;

    if (!key || !key.startsWith('rob_')) {
      throw new Error('RockOrBust: A valid API key starting with "rob_" is required.');
    }

    // Format proxy username: "rob_key:fallback" or just "rob_key"
    const proxyUsername = fallbackToVps ? `${key}:fallback` : key;

    // Configure Proxy
    pwOptions.proxy = {
      server: gatewayUrl,
      username: proxyUsername,
      password: 'rob',
      ...pwOptions.proxy
    };

    const browser = await originalLaunch(pwOptions);

    // Patch new contexts to include stealth scripts
    if (stealth) {
      const originalNewContext = browser.newContext.bind(browser);
      browser.newContext = async (contextOptions = {}) => {
        const context = await originalNewContext(contextOptions);
        await context.addInitScript(STEALTH_SCRIPT);
        return context;
      };

      // Also patch the default page if launchPersistentContext is used (handled separately if needed)
    }

    return browser;
  };

  return browserType;
}

export const chromium = wrapBrowserType(pwChromium);
export const firefox = wrapBrowserType(pwFirefox);
export const webkit = wrapBrowserType(pwWebkit);

export * from './types';
