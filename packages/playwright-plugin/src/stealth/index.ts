/**
 * Stealth scripts to be injected into the browser context.
 * These patches common bot detection vectors.
 */
export const STEALTH_SCRIPT = `
(() => {
  // 1. Mask navigator.webdriver
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
  });

  // 2. Mock Chrome Runtime
  window.chrome = {
    runtime: {},
    loadTimes: function() {},
    csi: function() {},
    app: {}
  };

  // 3. Spoof Permissions
  const originalQuery = window.navigator.permissions.query;
  window.navigator.permissions.query = (parameters) => (
    parameters.name === 'notifications' ?
      Promise.resolve({ state: Notification.permission }) :
      originalQuery(parameters)
  );

  // 4. Spoof Plugins
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

  // 5. Spoof Languages
  Object.defineProperty(navigator, 'languages', {
    get: () => ['en-US', 'en'],
  });

  // 6. Fix Hardware Concurrency (Make it look like a real machine)
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    get: () => 8,
  });

  // 7. Canvas Fingerprinting Protection (Add slight noise)
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, attributes) {
    const context = originalGetContext.apply(this, [type, attributes]);
    if (type === '2d') {
      const originalGetImageData = context.getImageData;
      context.getImageData = function(x, y, w, h) {
        const imageData = originalGetImageData.apply(this, [x, y, w, h]);
        // Add subtle noise to the first pixel (indetectable to humans, breaks hash-based tracking)
        imageData.data[0] = imageData.data[0] + (Math.random() > 0.5 ? 1 : -1);
        return imageData;
      };
    }
    return context;
  };
})();
`;
