(() => {
  const section = document.getElementById('recentUploadsSection');
  const grid = document.getElementById('recentUploadsGrid');
  if (!section || !grid) return;

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
        thumb.appendChild(img);

        button.appendChild(thumb);

        button.addEventListener('click', () => openVideoModal(video.id, video.title));
        frag.appendChild(button);
      });

      if (!frag.childNodes.length) return;
      grid.replaceChildren(frag);
      section.style.display = '';
    })
    .catch(err => console.warn('Recent uploads unavailable:', err));
})();
