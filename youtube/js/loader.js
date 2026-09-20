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

  const syncRecentUploadsVisibility = () => {
    const ids = ['searchInput','typeFilter','diffFilter','platformFilter','sortSelect'];
    const values = ids.map(id => document.getElementById(id));
    const [search, type, diff, platform, sort] = values;
    const active =
      (search && search.value.trim() !== '') ||
      (type && type.value !== '') ||
      (diff && diff.value !== '') ||
      (platform && platform.value !== '') ||
      (sort && sort.value !== 'az');
    document.body.classList.toggle('guide-filter-active', !!active);
  };

  const installVisibilitySync = () => {
    const ids = ['searchInput','typeFilter','diffFilter','platformFilter','sortSelect'];
    document.addEventListener('input', event => {
      if (event.target && ids.includes(event.target.id)) queueMicrotask(syncRecentUploadsVisibility);
    });
    document.addEventListener('change', event => {
      if (event.target && ids.includes(event.target.id)) queueMicrotask(syncRecentUploadsVisibility);
    });
    // iOS keeps the software keyboard open after the Search keyboard action
    // unless the text field explicitly gives up focus. Search already filters
    // live on input, so Enter/Go only needs to dismiss the keyboard.
    document.addEventListener('keydown', event => {
      if (event.key === 'Enter' && event.target && event.target.id === 'searchInput') {
        event.target.blur();
      }
    });
    document.addEventListener('click', event => {
      if (event.target && event.target.closest && event.target.closest('#clearFiltersBtn')) {
        queueMicrotask(syncRecentUploadsVisibility);
      }
    });
    syncRecentUploadsVisibility();
  };

  (async () => {
    try {
      // Main owns the stable page structure and contains the Recent Uploads mount.
      await loadHtml('sections/main.html?v=20260916-prod2', 'mainModuleMount');
      await loadHtml('sections/developer.html?v=20260917-panda', 'developerModuleMount');
      await loadHtml('sections/recent.html?v=20260916-prod2', 'recentModuleMount');
      await loadHtml('sections/footer.html?v=20260916-prod2', 'footerModuleMount');

      installVisibilitySync();

      // Production: Supabase PROD is the source of window.RAW.
      // Keep the production website independent from TEST code and TEST data.
      const gameFields = ['n','p','g','t','ty','tx','q','df','u','v','pl','kinect','adult'];
      const normalizeBooleanField = value => {
        if (value === true || value === 'true') return true;
        if (value === false || value === 'false') return false;
        return value ?? null;
      };
      const normalizeGame = game => Object.fromEntries(
        gameFields.map(field => [
          field,
          (field === 'adult' || field === 'kinect')
            ? normalizeBooleanField(game[field])
            : (game[field] ?? null)
        ])
      );

      const baseUrl = 'https://igmunmyxaskizltdvvti.supabase.co/rest/v1/games';
      const apiKey = 'sb_publishable_FwiOj7IyowVx1pvzwXx-Rw_QN_QFRdE';
      const pageSize = 1000;
      const rows = [];

      for (let offset = 0; ; offset += pageSize) {
        const params = new URLSearchParams({
          select: `id,${gameFields.join(',')}`,
          order: 'id.asc',
          limit: String(pageSize),
          offset: String(offset)
        });
        const response = await fetch(`${baseUrl}?${params}`, {
          headers: { apikey: apiKey },
          cache: 'no-store'
        });
        if (!response.ok) throw new Error(`Supabase games: HTTP ${response.status}`);
        const page = await response.json();
        if (!Array.isArray(page)) throw new Error('Supabase games: invalid response');
        rows.push(...page);
        if (page.length < pageSize) break;
      }

      if (!rows.length) throw new Error('Supabase games: no games received');
      window.RAW = rows.map(normalizeGame);

      console.info(`[PRODUCTION] Supabase PROD games loaded: ${window.RAW.length}`);

      // Read the precomputed total instead of scanning YouTube in the visitor's browser.
      const statsResponse = await fetch('data/stats.json?v=20260915-prod1', { cache: 'no-store' });
      if (!statsResponse.ok) throw new Error(`stats.json: HTTP ${statsResponse.status}`);
      const stats = await statsResponse.json();
      const totalVideos = Number(stats.totalVideos);
      if (!Number.isFinite(totalVideos) || totalVideos < 0) throw new Error('stats.json: invalid totalVideos');
      window.SITE_TOTAL_VIDEOS = totalVideos;

      await loadScript('js/youtube.js?v=20260916-prod2');
      await loadScript('js/site.js?v=20260916-prod2');
      await loadScript('js/developer.js?v=20260917-developer-submissions-rev02');
      await loadScript('js/recent.js?v=20260916-prod2');
      await loadScript('js/suggest_game.js?v=20260916-email-validation');
    } catch (error) {
      console.error('Modular site startup failed:', error);
      const empty = document.getElementById('emptyState');
      if (empty) {
        empty.style.display = 'block';
        empty.innerHTML = '<h3>Unable to load guides</h3><p>Please refresh the page and try again.</p>';
      } else {
        document.body.insertAdjacentHTML('beforeend',
          '<div style="padding:24px;color:white;background:#111">Unable to load website modules. Please refresh the page and try again.</div>');
      }
    }
  })();
})();
