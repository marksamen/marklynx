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
    const ids = ['searchInput','typeFilter','diffFilter','platformFilter','qualityFilter','featuresFilter','sortSelect'];
    const values = ids.map(id => document.getElementById(id));
    const [search, type, diff, platform, quality, features, sort] = values;
    const active =
      (search && search.value.trim() !== '') ||
      (type && type.value !== '') ||
      (diff && diff.value !== '') ||
      (platform && platform.value !== '') ||
      (quality && quality.value !== '') ||
      (features && features.value !== '') ||
      (sort && sort.value !== 'az');
    document.body.classList.toggle('guide-filter-active', !!active);
  };

  const installVisibilitySync = () => {
    const ids = ['searchInput','typeFilter','diffFilter','platformFilter','qualityFilter','featuresFilter','sortSelect'];
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
      await loadHtml('sections/main_.html?v=quality-filter-REV04', 'mainModuleMount');
      await loadHtml('sections/developer_.html?v=developer-provided-REV12', 'developerModuleMount');
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
      const gameFields = ['id','n','p','g','t','ty','tx','q','df','u','v','pl','kinect','adult','testContent','always_show_recent'];

      const normalizeBooleanField = value => {
        if (value === true || value === 'true') return true;
        if (value === false || value === 'false') return false;
        return value ?? null;
      };

      const normalizeGame = game => Object.fromEntries(
        gameFields.map(field => [
          field,
          ['kinect','adult','testContent','always_show_recent'].includes(field)
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
            select: gameFields.join(','),
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
      const testContentHidden = (localStorage.getItem('marklynxTestContent_TEST') || 'Y').toUpperCase() === 'Y';
      if (testContentHidden) {
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

      // Public developer data: use sanitized Supabase views normally, with one
      // static recovery file for a Supabase outage. Private Admin data is never exposed.
      window.PUBLIC_DEVELOPER_SHOWCASE = null;
      window.PUBLIC_DEVELOPER_PROVIDED_GAME_IDS = [];
      window.PUBLIC_DEVELOPER_PROVIDED_GAMES = [];
      try {
        if (dataSourceConfig.testForceSupabaseFailure === true) {
          throw new Error('Public developer Supabase failure forced by TEST config');
        }
        const publicDeveloperBaseUrl = 'https://aikifibkcjibubqegvmb.supabase.co/rest/v1';
        const publicDeveloperApiKey = 'sb_publishable_AMeGQySg9vDaKqkZRz_7HQ_yveiHHV_';
        const publicDeveloperHeaders = { apikey: publicDeveloperApiKey };
        const showcaseSelect = 'company_id,public_display_name,public_description,public_display_order,public_games_sort,game_id,game_name,gamerscore,completion_time,quality,youtube_url,video_id,playlist_id';
        const [showcaseResponse, providedResponse] = await Promise.all([
          fetch(`${publicDeveloperBaseUrl}/public_developer_showcase?select=${showcaseSelect}`, { headers: publicDeveloperHeaders, cache: 'no-store' }),
          fetch(`${publicDeveloperBaseUrl}/public_developer_provided_games?select=game_id,provided_by&order=game_id.asc`, { headers: publicDeveloperHeaders, cache: 'no-store' })
        ]);
        if (!showcaseResponse.ok) throw new Error(`public_developer_showcase: HTTP ${showcaseResponse.status}`);
        if (!providedResponse.ok) throw new Error(`public_developer_provided_games: HTTP ${providedResponse.status}`);
        const showcaseRows = await showcaseResponse.json();
        const providedRows = await providedResponse.json();
        if (!Array.isArray(showcaseRows) || !Array.isArray(providedRows)) throw new Error('public developer data: invalid response');
        window.PUBLIC_DEVELOPER_SHOWCASE = showcaseRows;
        window.PUBLIC_DEVELOPER_PROVIDED_GAMES = providedRows
          .map(row => ({ game_id: Number(row.game_id), provided_by: String(row.provided_by || '').trim() }))
          .filter(row => Number.isInteger(row.game_id) && row.provided_by);
        window.PUBLIC_DEVELOPER_PROVIDED_GAME_IDS = window.PUBLIC_DEVELOPER_PROVIDED_GAMES.map(row => row.game_id);
        console.info(`[TEST] Public developer data loaded from Supabase: ${showcaseRows.length} showcase rows / ${window.PUBLIC_DEVELOPER_PROVIDED_GAME_IDS.length} provided games`);
      } catch (publicDeveloperError) {
        console.warn('[TEST] Public developer Supabase data unavailable; trying static recovery file:', publicDeveloperError);
        try {
          const recoveryResponse = await fetch('data/public-developer-data_.json', { cache: 'no-store' });
          if (!recoveryResponse.ok) throw new Error(`public-developer-data_.json: HTTP ${recoveryResponse.status}`);
          const recoveryData = await recoveryResponse.json();
          if (!recoveryData || !Array.isArray(recoveryData.showcase) || !Array.isArray(recoveryData.providedGames)) {
            throw new Error('public-developer-data_.json: invalid recovery data');
          }
          window.PUBLIC_DEVELOPER_SHOWCASE = recoveryData.showcase;
          window.PUBLIC_DEVELOPER_PROVIDED_GAMES = recoveryData.providedGames
            .map(row => ({ game_id: Number(row?.game_id), provided_by: String(row?.provided_by || '').trim() }))
            .filter(row => Number.isInteger(row.game_id) && row.provided_by);
          window.PUBLIC_DEVELOPER_PROVIDED_GAME_IDS = window.PUBLIC_DEVELOPER_PROVIDED_GAMES.map(row => row.game_id);
          console.info(`[TEST] Public developer data loaded from static recovery: ${recoveryData.showcase.length} showcase rows / ${window.PUBLIC_DEVELOPER_PROVIDED_GAME_IDS.length} provided games`);
        } catch (recoveryError) {
          console.warn('[TEST] Public developer recovery unavailable; keeping existing hard-coded Developer cards:', recoveryError);
        }
      }

      // Quality Badge Management REV20: load the small TEST badge definition map once.
      // This is independent of the game data source and does not touch Recent Uploads.
      window.QUALITY_BADGES = {};
      try {
        const qualityBaseUrl = 'https://aikifibkcjibubqegvmb.supabase.co';
        const qualityApiKey = 'sb_publishable_AMeGQySg9vDaKqkZRz_7HQ_yveiHHV_';
        const qualityParams = new URLSearchParams({
          select: 'code,display_name,storage_path',
          order: 'sort_order.asc'
        });
        const qualityResponse = await fetch(`${qualityBaseUrl}/rest/v1/quality_badges?${qualityParams}`, {
          headers: { apikey: qualityApiKey },
          cache: 'no-store'
        });
        if (!qualityResponse.ok) throw new Error(`Supabase quality_badges: HTTP ${qualityResponse.status}`);
        const qualityRows = await qualityResponse.json();
        if (!Array.isArray(qualityRows)) throw new Error('Supabase quality_badges: invalid response');

        for (const badge of qualityRows) {
          const code = String(badge?.code || '').trim();
          const storagePath = String(badge?.storage_path || '').trim();
          if (!code || !storagePath) continue;
          const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/');
          window.QUALITY_BADGES[code.toLowerCase()] = {
            code,
            displayName: String(badge?.display_name || code),
            imageUrl: `${qualityBaseUrl}/storage/v1/object/public/quality-badges/${encodedPath}`
          };
        }
        console.info(`[GAMEDEV] Quality badges loaded: ${Object.keys(window.QUALITY_BADGES).length}`);
      } catch (qualityError) {
        console.warn('[GAMEDEV] Supabase quality badge definitions unavailable; trying quality-badges_.json recovery:', qualityError);
        try {
          const recoveryResponse = await fetch('data/quality-badges_.json', { cache: 'no-store' });
          if (!recoveryResponse.ok) throw new Error(`quality-badges_.json: HTTP ${recoveryResponse.status}`);
          const recoveryRows = await recoveryResponse.json();
          if (!Array.isArray(recoveryRows)) throw new Error('quality-badges_.json: invalid recovery data');

          for (const badge of recoveryRows) {
            const code = String(badge?.code || '').trim();
            const imagePath = String(badge?.image_path || '').trim();
            if (!code || !imagePath) continue;
            window.QUALITY_BADGES[code.toLowerCase()] = {
              code,
              displayName: String(badge?.display_name || code),
              imageUrl: imagePath
            };
          }
          console.info(`[TEST] Quality badges loaded from static recovery: ${Object.keys(window.QUALITY_BADGES).length}`);
        } catch (recoveryError) {
          console.warn('[GAMEDEV] Quality badge recovery unavailable; using built-in badge fallback:', recoveryError);
        }
      }

      // Read the precomputed total instead of scanning YouTube in the visitor's browser.
      const statsResponse = await fetch('data/stats.json?v=20260921-prod-promotion-01', { cache: 'no-store' });
      if (!statsResponse.ok) throw new Error(`stats.json: HTTP ${statsResponse.status}`);
      const stats = await statsResponse.json();
      const totalVideos = Number(stats.totalVideos);
      if (!Number.isFinite(totalVideos) || totalVideos < 0) throw new Error('stats.json: invalid totalVideos');
      window.SITE_TOTAL_VIDEOS = totalVideos;

      await loadScript('js/youtube_.js?v=20260927-mobile-landscape-prime-rev01');
      await loadScript('js/site_.js?v=quality-filter-REV05');
      await loadScript('js/developer_.js?v=DEVELOPER-PROVIDED-PUBLIC-REV11');
      await loadScript('js/recent_.js?v=20260924-test-content-integrity-REV01');
      await loadScript('js/suggest_game_.js?v=REV03-suggest-authoritative-submission');
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
