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

  const gameByVideoId = new Map(
    (Array.isArray(window.RAW) ? window.RAW : [])
      .filter(game => game && game.v)
      .map(game => [String(game.v), game])
  );

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
      if (!value) return;
      const meta = document.createElement('span');
      meta.className = `recent-upload-meta ${kind}`;
      meta.textContent = value;
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
        title.textContent = shortTitle(video.title);

        thumb.appendChild(img);
        button.appendChild(thumb);
        button.appendChild(title);
        addMeta(button, gameByVideoId.get(String(video.id)));

        button.addEventListener('click', () => openVideoModal(video.id, video.title));
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
