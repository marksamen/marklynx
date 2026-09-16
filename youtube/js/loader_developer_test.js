(() => {
  const loadHtml = async (url, mountId) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    const html = await response.text();
    const mount = document.getElementById(mountId);
    if (!mount) throw new Error(`Missing mount: #${mountId}`);
    mount.innerHTML = html;
  };

  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });

  const waitForMount = id => new Promise(resolve => {
    const existing = document.getElementById(id);
    if (existing) return resolve(existing);
    const observer = new MutationObserver(() => {
      const mount = document.getElementById(id);
      if (mount) {
        observer.disconnect();
        resolve(mount);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });

  (async () => {
    try {
      await waitForMount('developerModuleMount');
      await loadHtml('sections/developer_test.html?v=20260915-devtest9', 'developerModuleMount');
      await loadScript('js/developer_test.js?v=20260916-rev17');
    } catch (error) {
      console.error('Developer module startup failed:', error);
    }
  })();
})();
