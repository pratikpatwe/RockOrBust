/**
 * Stealth scripts to be injected into the browser context.
 * These patches common bot detection vectors across Chromium, Firefox, and WebKit.
 */
export const STEALTH_SCRIPT = `
(() => {
  const isChromium = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  
  // 1. Mask navigator.webdriver (All Browsers) - Handled natively by launch flags


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
  if (isChromium) {
    const mockPluginsData = [
      { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', type: 'application/pdf', suffixes: 'pdf' },
      { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', type: 'application/pdf', suffixes: 'pdf' },
      { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', type: 'application/pdf', suffixes: 'pdf' },
      { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', type: 'application/pdf', suffixes: 'pdf' },
      { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format', type: 'application/pdf', suffixes: 'pdf' }
    ];

    const generateMimeTypeArray = () => {
      const mimeTypes = [];
      Object.setPrototypeOf(mimeTypes, MimeTypeArray.prototype);
      return mimeTypes;
    };

    const generatePluginArray = () => {
      const plugins = [];
      
      mockPluginsData.forEach((p, i) => {
        const mimeType = Object.create(MimeType.prototype);
        Object.defineProperties(mimeType, {
          type: { value: p.type, enumerable: false },
          suffixes: { value: p.suffixes, enumerable: false },
          description: { value: p.description, enumerable: false },
          enabledPlugin: { value: null, writable: true, enumerable: false }
        });
        
        const plugin = Object.create(Plugin.prototype);
        Object.defineProperties(plugin, {
          name: { value: p.name, enumerable: false },
          filename: { value: p.filename, enumerable: false },
          description: { value: p.description, enumerable: false },
          length: { value: 1, enumerable: false },
          0: { value: mimeType, enumerable: true }
        });
        
        mimeType.enabledPlugin = plugin;

        plugins.push(plugin);
        Object.defineProperty(plugins, p.name, { value: plugin, enumerable: false });
      });

      Object.defineProperties(plugins, {
        item: { value: function(i) { return this[i] || null; }, enumerable: false },
        namedItem: { value: function(name) { return this[name] || null; }, enumerable: false },
        refresh: { value: function() {}, enumerable: false }
      });
      
      Object.setPrototypeOf(plugins, PluginArray.prototype);
      return plugins;
    };

    const pluginArray = generatePluginArray();
    Object.defineProperty(navigator, 'plugins', {
      get: () => pluginArray
    });
    
    const mimeTypeArray = generateMimeTypeArray();
    Object.defineProperty(navigator, 'mimeTypes', {
      get: () => mimeTypeArray
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

  // 9. User Agent Data (Client Hints) Mocking
  try {
    Object.defineProperty(navigator, 'userAgentData', {
      get: () => ({
        brands: [
          { brand: 'Not_A Brand', version: '8' },
          { brand: 'Chromium', version: '120' },
          { brand: 'Google Chrome', version: '120' }
        ],
        mobile: false,
        platform: 'Windows'
      })
    });
  } catch (e) {}
})();
`;
