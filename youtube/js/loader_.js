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

      // GAMEDEV TEST ONLY: Firestore replaces games.json as the source of window.RAW.
      // games_TEST is public-read / admin-write during this test phase.
      const firestoreResponse = await fetch(
        'https://firestore.googleapis.com/v1/projects/mark-lynx-admin/databases/(default)/documents:runQuery',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'games_TEST' }],
              orderBy: [{ field: { fieldPath: 'order' }, direction: 'ASCENDING' }]
            }
          })
        }
      );
      if (!firestoreResponse.ok) {
        throw new Error(`games_TEST: HTTP ${firestoreResponse.status}`);
      }

      const queryRows = await firestoreResponse.json();
      const decodeFirestoreValue = value => {
        if (!value || typeof value !== 'object') return null;
        if ('stringValue' in value) return value.stringValue;
        if ('booleanValue' in value) return value.booleanValue;
        if ('integerValue' in value) return Number(value.integerValue);
        if ('doubleValue' in value) return Number(value.doubleValue);
        if ('nullValue' in value) return null;
        if ('timestampValue' in value) return value.timestampValue;
        if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeFirestoreValue);
        if ('mapValue' in value) return decodeFirestoreFields(value.mapValue.fields || {});
        return null;
      };
      const decodeFirestoreFields = fields => Object.fromEntries(
        Object.entries(fields || {}).map(([key, value]) => [key, decodeFirestoreValue(value)])
      );

      const allGames = queryRows
        .filter(row => row && row.document && row.document.fields)
        .map(row => decodeFirestoreFields(row.document.fields));

      if (allGames.length !== 322) {
        throw new Error(`games_TEST: expected 322 documents, received ${allGames.length}`);
      }
      if (allGames[0]?.order !== 1 || allGames[319]?.order !== 320 ||
          allGames[320]?.order !== 321 || allGames[321]?.order !== 322) {
        throw new Error('games_TEST: order validation failed');
      }

      // Existing TEST CONTENT convention: Y = hidden, N = visible, default = Y.
      // Firestore uses a real boolean testContent field; do not confuse the two.
      const testContentHidden =
        (localStorage.getItem('marklynxTestContent') || 'Y').toUpperCase() === 'Y';
      window.RAW = testContentHidden
        ? allGames.filter(game => game.testContent !== true)
        : allGames;

      const expectedVisibleCount = testContentHidden ? 320 : 322;
      if (window.RAW.length !== expectedVisibleCount) {
        throw new Error(`games_TEST: expected ${expectedVisibleCount} visible records, received ${window.RAW.length}`);
      }

      // Migration guard: games.json is NOT the data source here. It is read only as
      // the frozen production reference so this TEST page can prove that Firestore
      // documents 0001-0320 are byte-for-byte equivalent at the data-field level.
      // Firestore-only metadata (order/testContent) is deliberately ignored.
      const baselineGames = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'data/games.json?v=20260917-panda', true);
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(`games.json baseline: HTTP ${xhr.status}`));
            return;
          }
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (error) {
            reject(new Error(`games.json baseline: invalid JSON (${error.message})`));
          }
        };
        xhr.onerror = () => reject(new Error('games.json baseline: network error'));
        xhr.send();
      });
      if (!Array.isArray(baselineGames) || baselineGames.length !== 320) {
        throw new Error(`games.json baseline: expected 320 records, received ${Array.isArray(baselineGames) ? baselineGames.length : 'non-array'}`);
      }

      const canonicalize = value => {
        if (Array.isArray(value)) return value.map(canonicalize);
        if (value && typeof value === 'object') {
          return Object.fromEntries(
            Object.keys(value).sort().map(key => [key, canonicalize(value[key])])
          );
        }
        return value;
      };
      const productionFromFirestore = allGames.slice(0, 320).map(game => {
        const copy = { ...game };
        delete copy.order;
        delete copy.testContent;
        return copy;
      });
      const firestoreFingerprint = JSON.stringify(canonicalize(productionFromFirestore));
      const baselineFingerprint = JSON.stringify(canonicalize(baselineGames));
      if (firestoreFingerprint !== baselineFingerprint) {
        throw new Error('games_TEST: Firestore production records do not exactly match games.json baseline');
      }

      console.info(`[GAMEDEV] Firestore games_TEST loaded: ${window.RAW.length} visible / ${allGames.length} total; 320/320 production records match games.json`);

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
