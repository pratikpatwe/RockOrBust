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
      Object.setPrototypeOf(plugins, PluginArray.prototype);
      
      mockPluginsData.forEach((p, i) => {
        const mimeType = {
          type: p.type,
          suffixes: p.suffixes,
          description: p.description,
          enabledPlugin: null
        };
        Object.setPrototypeOf(mimeType, MimeType.prototype);
        
        const plugin = {
          name: p.name,
          filename: p.filename,
          description: p.description,
          length: 1,
          0: mimeType
        };
        Object.setPrototypeOf(plugin, Plugin.prototype);
        mimeType.enabledPlugin = plugin;

        plugins.push(plugin);
        plugins[i] = plugin;
        plugins[p.name] = plugin;
      });

      plugins.item = function(i) { return this[i] || null; };
      plugins.namedItem = function(name) { return this[name] || null; };
      plugins.refresh = function() {};
      
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
})();
`;
