(() => {
  const section = document.getElementById('recentUploadsSection');
  const grid = document.getElementById('recentUploadsGrid');
  const gridBtn = document.getElementById('gridBtn');
  const listBtn = document.getElementById('listBtn');
  if (!section || !grid) return;

  // Keep Recent Uploads inside the site rather than sending visitors back to YouTube.
  section.querySelector('.recent-uploads-head a')?.remove();

  const shortTitle = value => {
    const title = String(value || '').trim();
    const firstPart = title.split('|')[0].trim();
    return firstPart || title;
  };

  const applyView = view => {
    grid.classList.toggle('list-mode', view === 'list');
    grid.classList.toggle('grid-mode', view !== 'list');
  };

  // Match the site's existing active Grid/List control on first load.
  applyView(gridBtn?.classList.contains('active') ? 'grid' : 'list');

  // site.js registered these buttons first, so its own view change runs first.
  // Recent Uploads then mirrors the same selection without changing site.js.
  gridBtn?.addEventListener('click', () => applyView('grid'));
  listBtn?.addEventListener('click', () => applyView('list'));

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

        button.addEventListener('click', () => openVideoModal(video.id, video.title));
        frag.appendChild(button);
      });

      if (!frag.childNodes.length) return;
      grid.replaceChildren(frag);
      section.style.display = '';
    })
    .catch(err => console.warn('Recent uploads unavailable:', err));
})();
