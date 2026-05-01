/**
 * Stealth scripts to be injected into the browser context.
 * These patches common bot detection vectors across Chromium, Firefox, and WebKit.
 */
export const STEALTH_SCRIPT = `
(() => {
  const isChromium = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  
  // 1. Mask navigator.webdriver (All Browsers)
  try {
    const newProto = Object.getPrototypeOf(navigator);
    delete newProto.webdriver;
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  } catch (e) {}

  // 2. Mock Chrome Runtime (Only for Chromium to hide headless signals)
  if (isChromium) {
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };
  }

  // 3. Spoof Permissions
  if (navigator.permissions && navigator.permissions.query) {
    const originalQuery = navigator.permissions.query;
    navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  }

  // 4. Advanced Plugin Mocking (Standard Chrome Profile)
  const mockPlugins = [
    { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' }] },
    { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' }] },
    { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' }] },
    { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' }] },
    { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format', mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' }] }
  ];

  if (isChromium) {
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const p = [...mockPlugins];
        p.item = (i) => p[i];
        p.namedItem = (name) => p.find(i => i.name === name);
        p.refresh = () => {};
        return p;
      },
    });
  }

  // 5. Advanced WebGL Masking (Mimic a high-end GPU)
  try {
    const getParameterProxyHandler = {
      apply: function(target, ctx, args) {
        const param = args[0];
        // UNMASKED_VENDOR_WEBGL
        if (param === 37445) return 'Google Inc. (NVIDIA)';
        // UNMASKED_RENDERER_WEBGL
        if (param === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)';
        return target.apply(ctx, args);
      }
    };
    WebGLRenderingContext.prototype.getParameter = new Proxy(WebGLRenderingContext.prototype.getParameter, getParameterProxyHandler);
    WebGL2RenderingContext.prototype.getParameter = new Proxy(WebGL2RenderingContext.prototype.getParameter, getParameterProxyHandler);
  } catch (e) {}

  // 6. Hardware Signals (Cores & Memory)
  try {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
  } catch (e) {}

  // 7. Broken Image Detection (Simulate real browser placeholder behavior)
  try {
    const originalNaturalWidth = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth').get;
    const originalNaturalHeight = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalHeight').get;
    
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
      get: function() {
        const val = originalNaturalWidth.call(this);
        return (val === 0 && this.complete) ? 16 : val;
      }
    });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
      get: function() {
        const val = originalNaturalHeight.call(this);
        return (val === 0 && this.complete) ? 16 : val;
      }
    });
  } catch (e) {}

  // 8. Navigator UI Checks
  try {
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  } catch (e) {}
})();
`;
