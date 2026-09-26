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
      await loadHtml('sections/main_.html?v=20260926-developer-provided-REV50', 'mainModuleMount');
      await loadHtml('sections/developer_.html?v=20260921-prod-promotion-01', 'developerModuleMount');
      await loadHtml('sections/recent_.html?v=20260921-prod-promotion-01', 'recentModuleMount');
      await loadHtml('sections/footer_.html?v=20260921-prod-promotion-01', 'footerModuleMount');

      installVisibilitySync();

      // DATA SOURCE TEST: one tiny config chooses Supabase TEST or static games_.json.
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
          ['kinect','adult','testContent'].includes(field)
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

      // Manual TEST override lives in Supabase TEST site_control. If that control
      // cannot be reached, keep using the existing static data-source.json config.
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
        console.info(`[TEST] Manual source override: ${selectedDataSource.toUpperCase()}`);
      } catch (controlError) {
        console.warn('[TEST] Manual source override unavailable; using data-source_.json:', controlError);
      }

      let activeDataSource = selectedDataSource;

      if (selectedDataSource === 'supabase') {
        try {
          if (dataSourceConfig.testForceSupabaseFailure === true) {
            throw new Error('Supabase failure forced by TEST config');
          }
          window.RAW = await loadGamesFromSupabase();
        } catch (supabaseError) {
          console.warn('[TEST] Supabase unavailable; falling back to games_.json:', supabaseError);
          window.RAW = await loadGamesFromJson();
          activeDataSource = 'json-fallback';
        }
      } else if (selectedDataSource === 'json') {
        window.RAW = await loadGamesFromJson();
      } else {
        throw new Error(`Unknown website data source: ${selectedDataSource || '(blank)'}`);
      }

      // TEST CONTENT OFF must hide the underlying TEST media, not only the row
      // carrying testContent=true. This prevents a non-TEST duplicate record from
      // exposing the same TEST YouTube video/playlist while TEST content is hidden.
      // TEST content visibility is shared through Supabase TEST so Admin and
      // youtube.marklynx.com use the same authoritative setting across subdomains/devices.
      const loadTestContentEnabled = async () => {
        const controlUrl = 'https://aikifibkcjibubqegvmb.supabase.co/rest/v1/feature_control?id=eq.test_content&select=enabled';
        const apiKey = 'sb_publishable_AMeGQySg9vDaKqkZRz_7HQ_yveiHHV_';
        const response = await fetch(controlUrl, { headers: { apikey: apiKey }, cache: 'no-store' });
        if (!response.ok) throw new Error(`Supabase feature_control: HTTP ${response.status}`);
        const rows = await response.json();
        if (!Array.isArray(rows) || rows.length !== 1 || typeof rows[0]?.enabled !== 'boolean') {
          throw new Error('Supabase feature_control: invalid test_content value');
        }
        return rows[0].enabled;
      };

      let testContentEnabled = false;
      try {
        testContentEnabled = await loadTestContentEnabled();
      } catch (controlError) {
        console.warn('[TEST] TEST content control unavailable; defaulting OFF:', controlError);
      }
      console.info(`[TEST] TEST CONTENT: ${testContentEnabled ? 'ON' : 'OFF'}`);
      if (!testContentEnabled) {
        const testVideoIds = new Set(
          window.RAW.filter(game => game?.testContent === true && game.v).map(game => String(game.v))
        );
        const testPlaylistIds = new Set(
          window.RAW.filter(game => game?.testContent === true && game.pl).map(game => String(game.pl))
        );

        window.RAW = window.RAW.filter(game =>
          game?.testContent !== true &&
          (!game?.v || !testVideoIds.has(String(game.v))) &&
          (!game?.pl || !testPlaylistIds.has(String(game.pl)))
        );
      }

      console.info(`[TEST] ${activeDataSource.toUpperCase()} loaded: ${window.RAW.length} games`);

      // Public Developer Showcase: sanitized, public-only database feed.
      // Failure here must never take down the website; developer_.js retains the
      // existing hard-coded cards as a fallback if this optional feed is unavailable.
      window.PUBLIC_DEVELOPER_SHOWCASE = null;
      try {
        const showcaseUrl = 'https://aikifibkcjibubqegvmb.supabase.co/rest/v1/public_developer_showcase?select=company_id,public_display_name,public_description,public_display_order,public_games_sort,game_id,game_name,gamerscore,completion_time,quality,youtube_url,video_id,playlist_id';
        const showcaseApiKey = 'sb_publishable_AMeGQySg9vDaKqkZRz_7HQ_yveiHHV_';
        const showcaseResponse = await fetch(showcaseUrl, {
          headers: { apikey: showcaseApiKey },
          cache: 'no-store'
        });
        if (!showcaseResponse.ok) throw new Error(`public_developer_showcase: HTTP ${showcaseResponse.status}`);
        const showcaseRows = await showcaseResponse.json();
        if (!Array.isArray(showcaseRows)) throw new Error('public_developer_showcase: invalid response');
        window.PUBLIC_DEVELOPER_SHOWCASE = showcaseRows;

        // Public game-list recognition for titles supplied directly by developers.
        // Preserve the established RAW game shape exactly; match through the existing
        // public YouTube video/playlist identifiers already present in both data paths.
        const providedByVideoId = new Map();
        const providedByPlaylistId = new Map();
        showcaseRows.forEach(row => {
          const name = String(row.public_display_name || '').trim();
          if (!name) return;
          if (row.video_id) providedByVideoId.set(String(row.video_id), name);
          if (row.playlist_id) providedByPlaylistId.set(String(row.playlist_id), name);
        });
        window.RAW.forEach(game => {
          const provider =
            (game.v ? providedByVideoId.get(String(game.v)) : null) ||
            (game.pl ? providedByPlaylistId.get(String(game.pl)) : null) ||
            '';
          game.developerProvidedBy = provider;
        });

        console.info(`[TEST] Public Developer Showcase loaded: ${showcaseRows.length} games`);
      } catch (showcaseError) {
        console.warn('[TEST] Public Developer Showcase unavailable; keeping existing fallback cards:', showcaseError);
      }

      // Read the precomputed total instead of scanning YouTube in the visitor's browser.
      const statsResponse = await fetch('data/stats.json?v=20260921-prod-promotion-01', { cache: 'no-store' });
      if (!statsResponse.ok) throw new Error(`stats.json: HTTP ${statsResponse.status}`);
      const stats = await statsResponse.json();
      const totalVideos = Number(stats.totalVideos);
      if (!Number.isFinite(totalVideos) || totalVideos < 0) throw new Error('stats.json: invalid totalVideos');
      window.SITE_TOTAL_VIDEOS = totalVideos;

      await loadScript('js/youtube_.js?v=20260921-prod-promotion-01');
      await loadScript('js/site_.js?v=20260926-developer-provided-REV50');
      await loadScript('js/developer_.js?v=20260926-db-showcase-REV46');
      await loadScript('js/recent_.js?v=20260924-test-content-integrity-REV01');
      await loadScript('js/suggest_game.js?v=20260921-prod-promotion-01');
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
