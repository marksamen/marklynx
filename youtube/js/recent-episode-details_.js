/* TEST REV01 — additive Recent episode details; frozen renderer untouched. */
(() => {
  'use strict';
  const mount = document.getElementById('mainModuleMount');
  if (!mount) return;
  const normalize = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const refresh = () => {
    const grid = document.getElementById('recentUploadsGrid');
    if (!grid || !Array.isArray(window.RAW)) return;
    const byName = new Map(), byId = new Map();
    for (const game of window.RAW) {
      if (!game) continue;
      const name = normalize(game.n);
      if (name && !byName.has(name)) byName.set(name, game);
      if (game.v) {
        const id = String(game.v), old = byId.get(id);
        if (!old || (game.testContent === true && old.testContent !== true)) byId.set(id, game);
      }
    }
    for (const card of grid.querySelectorAll('.recent-upload-card')) {
      const label = card.getAttribute('aria-label') || '';
      const title = card.querySelector('.recent-upload-title');
      const block = card.querySelector('.recent-upload-title-block');
      if (!title || !block || !label.startsWith('Play ')) continue;
      const parts = label.slice(5).split('|').map(s => s.trim());
      const src = card.querySelector('.recent-upload-thumb img')?.getAttribute('src') || '';
      const id = src.match(/\/vi\/([A-Za-z0-9_-]{11})\//)?.[1];
      const game = (id && byId.get(id)) || byName.get(normalize(parts[0]));
      const detail = game?.pl && game.adult !== true && String(game.adult).toLowerCase() !== 'true' && normalize(game.n) === normalize(title.textContent) && parts[1] && parts[2]
        ? `${parts[1]} | ${parts[2]}` : '';
      let subtitle = block.querySelector('.ml-recent-episode-details');
      if (!detail) { if (subtitle) subtitle.remove(); continue; }
      if (!subtitle) {
        subtitle = document.createElement('span');
        subtitle.className = 'ml-recent-episode-details';
        subtitle.dir = 'auto';
        subtitle.textContent = detail;
        title.after(subtitle);
      } else if (subtitle.textContent !== detail) subtitle.textContent = detail;
    }
  };
  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; refresh(); });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(mount, {childList:true, subtree:true, attributes:true, attributeFilter:['aria-label']});
  schedule();
})();
