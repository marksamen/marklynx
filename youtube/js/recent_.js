(() => {
  const section = document.getElementById('recentUploadsSection');
  const grid = document.getElementById('recentUploadsGrid');
  const gridBtn = document.getElementById('gridBtn');
  const listBtn = document.getElementById('listBtn');
  if (!section || !grid) return;

  section.querySelector('.recent-uploads-head a')?.remove();

  const shortTitle = value => {
    const title = String(value || '').trim();
    const firstPart = title.split('|')[0].trim();
    return firstPart || title;
  };

  const rawGames = Array.isArray(window.RAW) ? window.RAW : [];

  const hasTextGuide = value => {
    const tx = String(value || '').trim();
    const lower = tx.toLowerCase();
    return !!tx && lower !== 'no' && tx !== '-' && !lower.startsWith('no (');
  };

  const createKinectBadge = game => {
    if (!game || !game.kinect) return null;
    const badge = document.createElement('span');
    badge.className = 'kinect-badge';
    badge.textContent = 'Kinect Required';
    return badge;
  };

  const createTextGuideBadge = game => {
    if (!game || !hasTextGuide(game.tx)) return null;
    const badge = document.createElement('span');
    badge.className = 'text-guide-badge';
    badge.title = String(game.tx || '');
    badge.innerHTML = '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>';
    badge.appendChild(document.createTextNode(
      String(game.tx || '').trim().toLowerCase() !== 'yes'
        ? String(game.tx).trim()
        : 'Text Guide Included'
    ));
    return badge;
  };

  const normalizeName = value =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

  const gameByVideoId = new Map(
    rawGames
      .filter(game => game && game.v)
      .map(game => [String(game.v), game])
  );

  const gameByName = new Map();
  rawGames.forEach(game => {
    if (!game || !game.n) return;
    const key = normalizeName(game.n);
    if (!gameByName.has(key)) gameByName.set(key, game);
  });

  const findGameForVideo = video => {
    if (video && video.testPlaylistId) {
      const playlistGame = rawGames.find(game => game && String(game.pl || '') === String(video.testPlaylistId));
      if (playlistGame) return playlistGame;
    }

    const exact = gameByVideoId.get(String(video.id));
    if (exact) return exact;

    // Recent YouTube titles use "Game Name | ..." so the first segment is
    // the cleanest fallback for playlist/episode uploads that have no direct v ID.
    const titleGame = normalizeName(shortTitle(video.title));
    return gameByName.get(titleGame) || null;
  };

  const createQualityBadge = value => {
    const quality = String(value || '').trim().toLowerCase();
    if (quality !== '4k' && quality !== '1080p') return null;

    const img = document.createElement('img');
    img.className = 'quality-badge';

    if (quality === '4k') {
      img.src = 'quality-4k-60fps_.png';
      img.alt = '4K 60 FPS';
      img.title = '4K · 60 FPS';
    } else {
      img.src = 'quality-1080p_.png';
      img.alt = 'Full HD 1080p';
      img.title = 'Full HD · 1080p';
    }

    return img;
  };

  const addMeta = (button, game) => {
    if (!game) return;

    const values = [
      ['type', game.ty],
      ['time', game.t],
      ['quality', game.q],
      ['diff', game.df],
      ['gs', game.g]
    ];

    values.forEach(([kind, value]) => {
      // Match the known-good normal Videos LIST behavior for Genre only:
      // always render the Genre pill, using an em dash when the source value is empty.
      // REV40 scope: do not change any other Recent metadata behavior.
      if (!value && kind !== 'type') return;
      if (!value && kind === 'type') value = '—';

      const meta = document.createElement('span');
      meta.className = `recent-upload-meta ${kind}`;

      if (kind === 'quality') {
        const badge = createQualityBadge(value);
        if (badge) meta.appendChild(badge);
        else meta.textContent = value;
      } else if (kind === 'type' || kind === 'time') {
        const label = document.createElement('span');
        label.className = 'recent-meta-label';
        label.textContent = kind === 'type' ? 'Genre' : 'Time';
        meta.appendChild(label);
        meta.appendChild(document.createTextNode(value));
      } else {
        meta.textContent = value;
      }

      button.appendChild(meta);
    });
  };

  const applyView = view => {
    grid.classList.toggle('list-mode', view === 'list');
    grid.classList.toggle('grid-mode', view !== 'list');
  };

  const syncViewFromButtons = () => {
    applyView(listBtn?.classList.contains('active') ? 'list' : 'grid');
  };

  fetch('data/recent.json', { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      const videos = Array.isArray(data.videos) ? data.videos.slice(0, 8) : [];
      if (!videos.length) return;

      const frag = document.createDocumentFragment();

      videos.forEach(video => {
        if (!video || !video.id || !video.title) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'recent-upload-card';
        button.setAttribute('aria-label', `Play ${video.title}`);

        const thumb = document.createElement('span');
        thumb.className = 'recent-upload-thumb';

        const img = document.createElement('img');
        img.src = video.thumbnail || `https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/hqdefault.jpg`;
        img.alt = '';
        img.loading = 'lazy';

        const title = document.createElement('span');
        title.className = 'recent-upload-title';
        const game = findGameForVideo(video);
        title.textContent = game?.n || shortTitle(video.title);

        const titleBlock = document.createElement('span');
        titleBlock.className = 'recent-upload-title-block';
        titleBlock.appendChild(title);

        if (game?.p) {
          const platform = document.createElement('span');
          platform.className = 'recent-upload-platform';
          platform.textContent = game.p;
          titleBlock.appendChild(platform);
        }

        const kinect = createKinectBadge(game);
        const textGuide = createTextGuideBadge(game);
        if (kinect || textGuide) {
          const badges = document.createElement('span');
          badges.className = 'recent-upload-under-title-badges';
          if (kinect) badges.appendChild(kinect);
          if (textGuide) badges.appendChild(textGuide);
          titleBlock.appendChild(badges);
        }

        thumb.appendChild(img);

        // Desktop Recent GRID: quality badge lives inside the actual thumbnail.
        const gridQuality = createQualityBadge(game?.q);
        if (gridQuality) {
          const gridQualityWrap = document.createElement('span');
          gridQualityWrap.className = 'recent-grid-quality';
          gridQualityWrap.appendChild(gridQuality);
          thumb.appendChild(gridQualityWrap);
        }

        button.appendChild(thumb);
        button.appendChild(titleBlock);

        const metaBreak = document.createElement('span');
        metaBreak.className = 'recent-grid-meta-break';
        button.appendChild(metaBreak);

        addMeta(button, game);

        button.addEventListener('click', () => {
          if (game && game.pl && !game.adult) {
            openPlaylistModal(game.pl, game.n || video.title);
          } else {
            openVideoModal(video.id, video.title);
          }
        });
        frag.appendChild(button);
      });

      if (!frag.childNodes.length) return;
      // Render everything first, including metadata.
      grid.replaceChildren(frag);
      section.style.display = '';

      // Only after the cards exist do we apply the site's final Grid/List state.
      // site.js registered its button handlers before recent.js, so by the time
      // these handlers run the active button already reflects the new view.
      syncViewFromButtons();

      gridBtn?.addEventListener('click', syncViewFromButtons);
      listBtn?.addEventListener('click', syncViewFromButtons);
    })
    .catch(err => console.warn('Recent uploads unavailable:', err));
})();
