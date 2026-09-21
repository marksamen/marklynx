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
    const ids = ['searchInput','typeFilter','diffFilter','platformFilter','featuresFilter','sortSelect'];
    const values = ids.map(id => document.getElementById(id));
    const [search, type, diff, platform, features, sort] = values;
    const active =
      (search && search.value.trim() !== '') ||
      (type && type.value !== '') ||
      (diff && diff.value !== '') ||
      (platform && platform.value !== '') ||
      (features && features.value !== '') ||
      (sort && sort.value !== 'az');
    document.body.classList.toggle('guide-filter-active', !!active);
  };

  const installVisibilitySync = () => {
    const ids = ['searchInput','typeFilter','diffFilter','platformFilter','featuresFilter','sortSelect'];
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
      await loadHtml('sections/main_.html?v=20260919-features-REV20', 'mainModuleMount');
      await loadHtml('sections/developer_.html?v=20260917-panda', 'developerModuleMount');
      await loadHtml('sections/recent_.html?v=20260916-prod2', 'recentModuleMount');
      await loadHtml('sections/footer_.html?v=20260916-prod2', 'footerModuleMount');

      installVisibilitySync();

      // DATA SOURCE TEST: one tiny config chooses Supabase TEST or static games.json.
      // Keep the rest of the website completely independent of the chosen source.
      const dataSourceResponse = await fetch('data/data-source_.json', { cache: 'no-store' });
      if (!dataSourceResponse.ok) {
        throw new Error(`data-source.json: HTTP ${dataSourceResponse.status}`);
      }
      const dataSourceConfig = await dataSourceResponse.json();
      const dataSource = String(dataSourceConfig.source || '').toLowerCase();
      const gameFields = ['n','p','g','t','ty','tx','q','df','u','v','pl','kinect','adult','testContent'];

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

      const loadGamesFromJson = async () => {
        const response = await fetch('data/games_.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`games.json: HTTP ${response.status}`);
        const rows = await response.json();
        if (!Array.isArray(rows) || !rows.length) throw new Error('games.json: no games received');
        return rows.map(normalizeGame);
      };

      const loadGamesFromSupabase = async () => {
        const baseUrl = 'https://aikifibkcjibubqegvmb.supabase.co/rest/v1/games';
        const apiKey = 'sb_publishable_AMeGQySg9vDaKqkZRz_7HQ_yveiHHV_';
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
        return rows.map(normalizeGame);
      };

      // Manual TEST override lives in Supabase site_control. If that control
      // cannot be reached, keep using the existing static data-source_.json config.
      // This control lookup is optional: automatic JSON recovery must not depend on it.
      const loadManualDataSourceOverride = async () => {
        const controlUrl = 'https://aikifibkcjibubqegvmb.supabase.co/rest/v1/site_control?id=eq.game_data_source&select=value';
        const apiKey = 'sb_publishable_AMeGQySg9vDaKqkZRz_7HQ_yveiHHV_';
        const response = await fetch(controlUrl, {
          headers: { apikey: apiKey },
          cache: 'no-store'
        });
        if (!response.ok) throw new Error(`Supabase site_control: HTTP ${response.status}`);
        const rows = await response.json();
        const value = String(rows?.[0]?.value || '').toLowerCase();
        if (value !== 'supabase' && value !== 'json') {
          throw new Error(`Supabase site_control: invalid source ${value || '(blank)'}`);
        }
        return value;
      };

      let selectedDataSource = dataSource;
      try {
        selectedDataSource = await loadManualDataSourceOverride();
        console.info(`[GAMEDEV] Manual source override: ${selectedDataSource.toUpperCase()}`);
      } catch (controlError) {
        console.warn('[GAMEDEV] Manual source override unavailable; using data-source_.json:', controlError);
      }

      let activeDataSource = selectedDataSource;

      if (selectedDataSource === 'supabase') {
        try {
          if (dataSourceConfig.testForceSupabaseFailure === true) {
            throw new Error('Supabase failure forced by TEST config');
          }
          window.RAW = await loadGamesFromSupabase();
        } catch (supabaseError) {
          console.warn('[GAMEDEV] Supabase unavailable; falling back to games.json:', supabaseError);
          window.RAW = await loadGamesFromJson();
          activeDataSource = 'json-fallback';
        }
      } else if (selectedDataSource === 'json') {
        window.RAW = await loadGamesFromJson();
      } else {
        throw new Error(`Unknown website data source: ${selectedDataSource || '(blank)'}`);
      }

      console.info(`[GAMEDEV] ${activeDataSource.toUpperCase()} loaded: ${window.RAW.length} games`);

      // Read the precomputed total instead of scanning YouTube in the visitor's browser.
      const statsResponse = await fetch('data/stats_.json?v=20260915-prod1', { cache: 'no-store' });
      if (!statsResponse.ok) throw new Error(`stats.json: HTTP ${statsResponse.status}`);
      const stats = await statsResponse.json();
      const totalVideos = Number(stats.totalVideos);
      if (!Number.isFinite(totalVideos) || totalVideos < 0) throw new Error('stats.json: invalid totalVideos');
      window.SITE_TOTAL_VIDEOS = totalVideos;

      await loadScript('js/youtube_.js?v=20260918-cache-REV07');
      await loadScript('js/site_.js?v=20260921-game-guides-align-REV05');
      await loadScript('js/developer_.js?v=20260921-dev-video-backdrop-REV01');
      await loadScript('js/recent_.js?v=rev61');
      await loadScript('js/suggest_game_.js?v=20260919-suggest-close-REV18');
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
