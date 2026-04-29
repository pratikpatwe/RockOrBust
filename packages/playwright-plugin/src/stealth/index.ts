/**
 * Stealth scripts to be injected into the browser context.
 * These patches common bot detection vectors across Chromium, Firefox, and WebKit.
 */
export const STEALTH_SCRIPT = `
(() => {
  const isChromium = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

  // 1. Mask navigator.webdriver (All Browsers)
  try {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  } catch (e) {}

  // 2. Mock Chrome Runtime (Only for Chromium to hide headless signals)
  if (isChromium) {
    window.chrome = window.chrome || {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };
  }

  // 3. Spoof Permissions (If applicable)
  if (navigator.permissions && navigator.permissions.query) {
    const originalQuery = navigator.permissions.query;
    navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  }

  // 4. Spoof Plugins (Browser-specific logic)
  if (isChromium) {
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          0: {type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: Plugin},
          description: "Portable Document Format",
          filename: "internal-pdf-viewer",
          length: 1,
          name: "Chrome PDF Plugin"
        },
        {
          0: {type: "application/pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: Plugin},
          description: "Portable Document Format",
          filename: "internal-pdf-viewer",
          length: 1,
          name: "Chrome PDF Viewer"
        }
      ],
    });
  }

  // 5. Spoof Languages (All Browsers)
  try {
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  } catch (e) {}

  // 6. Fix Hardware Concurrency (All Browsers - Mock as a typical 8-core machine)
  try {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
    });
  } catch (e) {}

  // 7. Canvas Fingerprinting Protection (All Browsers - Add subtle noise)
  try {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, attributes) {
      const context = originalGetContext.apply(this, [type, attributes]);
      if (type === '2d' && context) {
        const originalGetImageData = context.getImageData;
        context.getImageData = function(x, y, w, h) {
          const imageData = originalGetImageData.apply(this, [x, y, w, h]);
          // Add subtle noise to the first pixel (breaks hash-based tracking)
          imageData.data[0] = imageData.data[0] + (Math.random() > 0.5 ? 1 : -1);
          return imageData;
        };
      }
      return context;
    };
  } catch (e) {}
})();
`;
