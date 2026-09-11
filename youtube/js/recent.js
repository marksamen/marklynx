(() => {
  const section = document.getElementById('recentUploadsSection');
  const grid = document.getElementById('recentUploadsGrid');
  if (!section || !grid) return;

  const formatDate = value => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
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
        thumb.appendChild(img);

        const title = document.createElement('span');
        title.className = 'recent-upload-title';
        title.textContent = video.title;

        button.appendChild(thumb);
        button.appendChild(title);

        const dateText = formatDate(video.published);
        if (dateText) {
          const date = document.createElement('span');
          date.className = 'recent-upload-date';
          date.textContent = dateText;
          button.appendChild(date);
        }

        button.addEventListener('click', () => openVideoModal(video.id, video.title));
        frag.appendChild(button);
      });

      if (!frag.childNodes.length) return;
      grid.replaceChildren(frag);
      section.style.display = '';
    })
    .catch(err => console.warn('Recent uploads unavailable:', err));
})();
