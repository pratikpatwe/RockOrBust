import { chromium } from './packages/playwright-plugin/src/index';

(async () => {
  console.log('🚀 Launching RockOrBust browser...');
  
  try {
    const browser = await chromium.launch({
      headless: true,
      rockorbust: {
        key: 'rob_test_key_123',
      }
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('📡 Navigating to CreepJS (Fingerprint Check)...');
    await page.goto('https://abrahamjuliot.github.io/creepjs/', { waitUntil: 'networkidle', timeout: 60000 });

    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'stealth-result.png', fullPage: true });
    
    console.log('✅ Success! Result saved to stealth-result.png');
    
    await browser.close();
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
})();
