// Field map: n=name p=platform g=gamerscore t=time ty=type tx=textguide q=quality df=difficulty u=url v=videoId
// Optional: pl = playlist ID / playlist data; kinect = true marks games that require Kinect

function hasTextGuide(tx){
  return !!tx && tx.trim() !== '' && tx.trim().toLowerCase() !== 'no' && tx.trim() !== '-' && !tx.trim().toLowerCase().startsWith('no (');
}

const DIFF_COLORS = {
  'Quick & Easy': '#4caf50',
  'Easy': '#8bc34a',
  'Moderate': '#ffc107',
  'Hard': '#f44336'
};
function diffColor(d){
  if(!d) return '#666';
  return DIFF_COLORS[d] || '#888';
}

const PAGE_SIZE = 48;
let shown = PAGE_SIZE;
let currentView = 'list';

const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const diffFilter = document.getElementById('diffFilter');
const platformFilter = document.getElementById('platformFilter');
const featuresFilter = document.getElementById('featuresFilter');
const sortSelect = document.getElementById('sortSelect');
const gridBtn = document.getElementById('gridBtn');
const listBtn = document.getElementById('listBtn');
const resultsGrid = document.getElementById('resultsGrid');
const resultsList = document.getElementById('resultsList');
const listHead = document.getElementById('listHead');
const emptyState = document.getElementById('emptyState');
const countLine = document.getElementById('countLine');
const loadMoreWrap = document.getElementById('loadMoreWrap');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
document.getElementById('copyrightYear').textContent = new Date().getFullYear();

// populate filters
function uniqueSorted(field){
  return [...new Set(RAW.map(r=>r[field]).filter(Boolean))].sort();
}
uniqueSorted('ty').forEach(v=>{
  const o=document.createElement('option'); o.value=v; o.textContent=v; typeFilter.appendChild(o);
});

// TEST REV20: Text Guide filtering lives under its own Features control.
const difficultyOrder = ['Easy', 'Moderate', 'Hard'];
const availableDifficulties = new Set(uniqueSorted('df'));
difficultyOrder.filter(v=>availableDifficulties.has(v)).forEach(v=>{
  const o=document.createElement('option'); o.value=v; o.textContent=v; document.getElementById('diffFilterByDifficulty').appendChild(o);
});
// Preserve any future/unexpected difficulty values after the standard four.
uniqueSorted('df').filter(v=>v !== 'Quick & Easy' && !difficultyOrder.includes(v)).forEach(v=>{
  const o=document.createElement('option'); o.value=v; o.textContent=v; document.getElementById('diffFilterByDifficulty').appendChild(o);
});

// Platforms are derived automatically from RAW. Entries with multiple systems
// (for example "XBOX ONE | XBOX Series S/X | Windows") contribute each system.
// Normalize obvious aliases/typos so they share one clean filter category.
function normalizePlatform(v){
  const raw = String(v || '').trim();
  const key = raw.toLowerCase().replace(/\s+/g,'');
  if(key === 'xbox360') return {key:'xbox 360', label:'XBOX 360'};
  return {key:raw.toLowerCase(), label:raw};
}
const platformNames = new Map();
RAW.forEach(r=>{
  String(r.p || '').split('|').map(v=>v.trim()).filter(Boolean).forEach(v=>{
    const normalized=normalizePlatform(v);
    if(!platformNames.has(normalized.key)) platformNames.set(normalized.key,normalized.label);
  });
});
if(RAW.some(r=>r.kinect)) platformNames.set('kinect','Kinect');
[...platformNames.entries()]
  .sort((a,b)=>a[1].localeCompare(b[1]))
  .forEach(([key,label])=>{
    const o=document.createElement('option'); o.value=key; o.textContent=label; platformFilter.appendChild(o);
  });

function gsNumber(g){
  if(!g) return 0;
  const m = g.replace(/,/g,'').match(/\d+/);
  return m ? parseInt(m[0],10) : 0;
}

function thumbUrl(vid){
  return vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : '';
}

function getFiltered(){
  const normalizeSearch = value => String(value || '').toLowerCase().replace(/[.\'’\-]/g, '').replace(/\s+/g, ' ').trim();
  const q = normalizeSearch(searchInput.value);
  const ty = typeFilter.value;
  const df = diffFilter.value;
  const platform = platformFilter.value;
  const feature = featuresFilter.value;
  let out = RAW.filter(r=>{
    const searchable = normalizeSearch(`${r.n || ''} ${r.kinect ? 'Kinect Kinect Required' : ''}`);
    if(q && !searchable.includes(q)) return false;
    if(ty && r.ty !== ty) return false;
    if(platform){
      if(platform === 'kinect'){
        if(!r.kinect) return false;
      } else {
        const platforms = String(r.p || '').split('|').map(v=>normalizePlatform(v).key);
        if(!platforms.includes(platform)) return false;
      }
    }
    if(df === '__QE_ONLY__'){
      if(r.df !== 'Quick & Easy') return false;
    } else if(df === '__NO_QE__'){
      if(r.df === 'Quick & Easy') return false;
    } else if(df){
      if(r.df !== df) return false;
    }
    if(feature === '__TEXT_GUIDE__' && !hasTextGuide(r.tx)) return false;
    return true;
  });
  const sort = sortSelect.value;
  out.sort((a,b)=>{
    if(sort==='az') return a.n.localeCompare(b.n);
    if(sort==='za') return b.n.localeCompare(a.n);
    if(sort==='gs-high') return gsNumber(b.g)-gsNumber(a.g);
    if(sort==='gs-low') return gsNumber(a.g)-gsNumber(b.g);
    return 0;
  });
  return out;
}

function textGuideBadge(r){
  if(!hasTextGuide(r.tx)) return '';
  const label = (r.tx && r.tx.trim().toLowerCase() !== 'yes') ? r.tx : 'Text Guide Included';
  return `<span class="text-guide-badge" title="${escapeHtml(r.tx)}"><svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>${escapeHtml(label)}</span>`;
}

function playlistPill(r){
  if(!r.pl) return '';
  return `<span class="playlist-pill"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h9"></path></svg>Playlist</span>`;
}

function adultPill(r){
  return r.adult ? `<span class="adult-pill" title="Age-restricted: opens directly on YouTube">18+ · YouTube</span>` : '';
}

function kinectBadge(r){
  return r.kinect ? `<span class="kinect-badge" title="Kinect hardware required">Kinect Required</span>` : '';
}


// Cache of playlist thumbnail URLs fetched via YouTube oEmbed (keyed by playlist ID)
const playlistThumbCache = {};
function fetchPlaylistThumb(playlistId){
  if(playlistThumbCache[playlistId]) return Promise.resolve(playlistThumbCache[playlistId]);
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/playlist?list='+playlistId)}&format=json`;
  return fetch(oembedUrl).then(r=>r.ok?r.json():null).then(data=>{
    const thumb = data && data.thumbnail_url ? data.thumbnail_url : null;
    playlistThumbCache[playlistId] = thumb;
    return thumb;
  }).catch(()=>{ playlistThumbCache[playlistId] = null; return null; });
}
function hydratePlaylistThumbs(container){
  container.querySelectorAll('[data-pl-thumb]').forEach(img=>{
    const pl = img.dataset.plThumb;
    fetchPlaylistThumb(pl).then(url=>{ if(url) img.src = url; });
  });
}

function qualityBadge(q){
  const quality = String(q || '').trim().toLowerCase();
  if(quality === '4k') return `<img class="quality-badge" src="quality-4k-60fps_.png" alt="4K 60 FPS" title="4K · 60 FPS">`;
  if(quality === '1080p') return `<img class="quality-badge" src="quality-1080p_.png" alt="Full HD 1080p" title="Full HD · 1080p">`;
  return escapeHtml(q || '');
}

function cardHtml(r){
  const isPlaylist = !!r.pl;
  const isAdult = !!r.adult;
  const thumb = isPlaylist
    ? `<img data-pl-thumb="${r.pl}" alt="${escapeHtml(r.n)}" loading="lazy" style="background:#1a1a1a;">`
    : (r.v ? `<img src="${thumbUrl(r.v)}" alt="${escapeHtml(r.n)}" loading="lazy">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#444;font-size:12px;">No preview</div>`);
  const usePlaylistModal = isPlaylist && !isAdult;
  const useVideoModal = !isPlaylist && !!r.v && !isAdult;
  const useModal = usePlaylistModal || useVideoModal;
  const openAttr = usePlaylistModal
    ? `data-playlist-id="${r.pl}" data-playlist-title="${escapeHtml(r.n)}"`
    : (useVideoModal ? `data-video-id="${r.v}" data-video-title="${escapeHtml(r.n)}"` : '');
  const tag = useModal ? 'div' : 'a';
  const hrefAttrs = useModal ? '' : `href="${r.u||'#'}" target="_blank" rel="noopener"`;
  return `
  <${tag} class="card${isPlaylist?' playlist-card':''}" ${hrefAttrs} ${openAttr} style="${useModal?'cursor:pointer;':''}">
    <span class="thumb-wrap">
      ${thumb}
      <span class="gs-pill">${escapeHtml(r.g||'—')}</span>
      ${playlistPill(r)}
      ${adultPill(r)}
      <span class="desktop-grid-quality">${qualityBadge(r.q)}</span>
      <span class="play-badge">
        <svg viewBox="0 0 68 48"><path d="M66.5,7.7c-0.8-2.9-2.5-5.2-5.4-6C55.8,0.1,34,0,34,0S12.2,0.1,6.9,1.7c-2.9,0.8-4.6,3.1-5.4,6C0,13.1,0,24,0,24s0,10.9,1.5,16.3c0.8,2.9,2.5,5.1,5.4,5.9C12.2,47.9,34,48,34,48s21.8-0.1,27.1-1.7c2.9-0.8,4.6-3,5.4-5.9C68,34.9,68,24,68,24S68,13.1,66.5,7.7z" fill="#e0392f"></path><polygon points="27,34 45,24 27,14" fill="#fff"></polygon></svg>
      </span>
    </span>
    <span class="card-body">
      <h3 class="card-title">${escapeHtml(r.n)}</h3>
      <div class="grid-list-sub">${escapeHtml(r.p||'')}</div>
          <div class="card-meta">
        <span class="diff-tag"><span class="diff-dot" style="background:${diffColor(r.df)}"></span>${escapeHtml(r.df||'')}</span>
        <span class="game-meta-pill genre-meta"><span class="game-meta-label">Genre</span>${escapeHtml(r.ty||'—')}</span>
        <span class="game-meta-pill time-meta"><span class="game-meta-label">Time</span>${escapeHtml(r.t||'—')}</span>
        <span class="game-meta-quality">${qualityBadge(r.q)}</span>
        ${kinectBadge(r)}
        ${textGuideBadge(r)}
      </div>
    </span>
  </${tag}>`;
}

function listRowHtml(r){
  const isPlaylist = !!r.pl;
  const isAdult = !!r.adult;
  const thumb = isPlaylist
    ? `<img data-pl-thumb="${r.pl}" alt="${escapeHtml(r.n)}" loading="lazy" style="background:#1a1a1a;">`
    : (r.v ? `<img src="${thumbUrl(r.v)}" alt="${escapeHtml(r.n)}" loading="lazy">` : '');
  const usePlaylistModal = isPlaylist && !isAdult;
  const useVideoModal = !isPlaylist && !!r.v && !isAdult;
  const useModal = usePlaylistModal || useVideoModal;
  const openAttr = usePlaylistModal
    ? `data-playlist-id="${r.pl}" data-playlist-title="${escapeHtml(r.n)}"`
    : (useVideoModal ? `data-video-id="${r.v}" data-video-title="${escapeHtml(r.n)}"` : '');
  const tag = useModal ? 'div' : 'a';
  const hrefAttrs = useModal ? '' : `href="${r.u||'#'}" target="_blank" rel="noopener"`;
  return `
  <${tag} class="list-row" ${hrefAttrs} ${openAttr} style="${useModal?'cursor:pointer;':''}">
    <span class="list-thumb">${thumb}${isPlaylist?`<span class="playlist-pill" style="top:4px;left:4px;padding:1px 5px;font-size:9.5px;">Playlist</span>`:''}${isAdult?`<span class="adult-pill" style="top:4px;right:4px;padding:1px 5px;font-size:9.5px;">18+</span>`:''}</span>
    <span>
      <div class="list-name">${escapeHtml(r.n)}${isAdult?' <span title="Age-restricted: opens directly on YouTube" style="font-size:11px;color:#ff8f86;font-weight:800;">· 18+ YouTube</span>':''}</div>
      <div class="list-sub">${escapeHtml(r.p||'')}</div>
      <div class="mobile-game-meta">
        <span class="game-meta-pill"><span class="game-meta-label">Genre</span>${escapeHtml(r.ty||'—')}</span>
        <span class="game-meta-pill"><span class="game-meta-label">Time</span>${escapeHtml(r.t||'—')}</span>
      </div>
      <div class="mobile-quality-badge">${qualityBadge(r.q)}</div>
      ${(r.kinect || hasTextGuide(r.tx)) ? `<div class="badge-row" style="margin-top:4px;">${kinectBadge(r)}${textGuideBadge(r)}</div>` : ''}
    </span>
    <span class="list-col type game-meta-pill list-meta-pill"><span class="game-meta-label">Genre</span>${escapeHtml(r.ty||'—')}</span>
    <span class="list-col time game-meta-pill list-meta-pill"><span class="game-meta-label">Time</span>${escapeHtml(r.t||'—')}</span>
    <span class="list-col quality">${qualityBadge(r.q)}</span>
    <span class="list-col diff">${escapeHtml(r.df||'')}</span>
    <span class="list-col gs">${escapeHtml(r.g||'')}</span>
  </${tag}>`;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function render(){
  const hasActiveFilters =
    searchInput.value.trim() !== '' ||
    typeFilter.value !== '' ||
    diffFilter.value !== '' ||
    platformFilter.value !== '' ||
    featuresFilter.value !== '' ||
    sortSelect.value !== 'az';
  clearFiltersBtn.classList.toggle('visible', hasActiveFilters);

  const filtered = getFiltered();
  const slice = filtered.slice(0, shown);

  countLine.innerHTML = `Showing <strong>${slice.length}</strong> of <strong>${filtered.length}</strong> guides`;

  if(filtered.length === 0){
    resultsGrid.style.display='none';
    resultsList.style.display='none';
    listHead.style.display='none';
    emptyState.style.display='block';
    loadMoreWrap.style.display='none';
    return;
  }
  emptyState.style.display='none';

  if(currentView==='grid'){
    resultsGrid.style.display='grid';
    resultsList.style.display='none';
    listHead.style.display='none';
    resultsGrid.innerHTML = slice.map(r=>cardHtml(r)).join('');
    resultsGrid.querySelectorAll('[data-playlist-id]').forEach(el=>{
      el.addEventListener('click', ()=>openPlaylistModal(el.dataset.playlistId, el.dataset.playlistTitle));
    });
    resultsGrid.querySelectorAll('[data-video-id]').forEach(el=>{
      el.addEventListener('click', ()=>openVideoModal(el.dataset.videoId, el.dataset.videoTitle));
    });
    hydratePlaylistThumbs(resultsGrid);
  } else {
    resultsGrid.style.display='none';
    resultsList.style.display='flex';
    listHead.style.display='none';
    resultsList.innerHTML = slice.map(r=>listRowHtml(r)).join('');
    resultsList.querySelectorAll('[data-playlist-id]').forEach(el=>{
      el.addEventListener('click', ()=>openPlaylistModal(el.dataset.playlistId, el.dataset.playlistTitle));
    });
    resultsList.querySelectorAll('[data-video-id]').forEach(el=>{
      el.addEventListener('click', ()=>openVideoModal(el.dataset.videoId, el.dataset.videoTitle));
    });
    hydratePlaylistThumbs(resultsList);
  }

  loadMoreWrap.style.display = shown < filtered.length ? 'flex' : 'none';
  updateFooterStats();
}

function updateFooterStats(){
  const quickEasy = RAW.filter(r=>r.df === 'Quick & Easy').length;
  const totalPlaylists = RAW.filter(r=>r.pl).length;

  // Count unique game names rather than treating every guide/playlist as a game.
  // Entries with the same name are grouped together for the game count.
  const totalGames = new Set(
    RAW.map(r => (r.n || '').trim().toLowerCase()).filter(Boolean)
  ).size;

  document.getElementById('quickEasyCount').textContent = quickEasy.toLocaleString();
  document.getElementById('totalGamesCount').textContent = totalGames.toLocaleString();
  document.getElementById('totalPlaylistsCount').textContent = totalPlaylists.toLocaleString();

  // Video count is maintained by the background playlist scanner below.
  // Direct video entries are counted immediately; playlist videos are added
  // as their playlist contents are discovered, with duplicate video IDs removed.
  updateTotalVideoCount();
}

function resetAndRender(){ shown = PAGE_SIZE; render(); }

// Populate Total Videos immediately without launching the heavy hidden-player
// playlist scanner on every visitor's device. The scanner remains available
// in youtube.js for deliberate diagnostics if we ever need it again.
updateTotalVideoCount();

clearFiltersBtn.addEventListener('click', ()=>{
  searchInput.value='';
  typeFilter.value='';
  diffFilter.value='';
  platformFilter.value='';
  featuresFilter.value='';
  sortSelect.value='az';
  resetAndRender();
});

searchInput.addEventListener('input', resetAndRender);
typeFilter.addEventListener('change', resetAndRender);
diffFilter.addEventListener('change', resetAndRender);
platformFilter.addEventListener('change', resetAndRender);
featuresFilter.addEventListener('change', resetAndRender);
sortSelect.addEventListener('change', resetAndRender);
loadMoreBtn.addEventListener('click', ()=>{ shown += PAGE_SIZE; render(); });

gridBtn.addEventListener('click', ()=>{
  currentView='grid';
  gridBtn.classList.add('active');
  listBtn.classList.remove('active');
  render();
});
listBtn.addEventListener('click', ()=>{
  currentView='list';
  listBtn.classList.add('active');
  gridBtn.classList.remove('active');
  render();
});

render();


// GLOBAL MOBILE ORIENTATION REV04 — iOS/WKWebView viewport recovery.
// Preserves field values and the existing viewport/zoom policy.
// Safari's proven REV03 behavior remains; VisualViewport settling is added
// for non-Safari iOS browsers where WKWebView can report stale dimensions
// during orientation/focus changes.
(() => {
  const ua = navigator.userAgent || '';
  const isIOSWebKit =
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!isIOSWebKit) return;

  const isEditable = (el) => {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  };

  const visualViewport = window.visualViewport;
  let rotatedRecently = false;
  let rotationTimer = 0;
  let recoveryTimer = 0;
  let lastViewportWidth = visualViewport ? visualViewport.width : 0;
  let lastViewportHeight = visualViewport ? visualViewport.height : 0;

  const refreshViewport = () => {
    const x = window.scrollX;
    const y = window.scrollY;
    window.scrollTo(x, y + 1);
    requestAnimationFrame(() => window.scrollTo(x, y));
  };

  const recoverAfterViewportSettles = () => {
    clearTimeout(recoveryTimer);

    let stableReads = 0;
    let attempts = 0;

    const check = () => {
      attempts += 1;

      if (!visualViewport) {
        refreshViewport();
        return;
      }

      const width = visualViewport.width;
      const height = visualViewport.height;
      const stable =
        Math.abs(width - lastViewportWidth) < 0.5 &&
        Math.abs(height - lastViewportHeight) < 0.5;

      lastViewportWidth = width;
      lastViewportHeight = height;
      stableReads = stable ? stableReads + 1 : 0;

      if (stableReads >= 2 || attempts >= 12) {
        refreshViewport();
        return;
      }

      recoveryTimer = setTimeout(check, 100);
    };

    recoveryTimer = setTimeout(check, 50);
  };

  const onOrientationChange = () => {
    if (!window.matchMedia('(max-width: 900px)').matches) return;

    const active = document.activeElement;
    if (isEditable(active) && typeof active.blur === 'function') active.blur();

    rotatedRecently = true;
    clearTimeout(rotationTimer);

    // Keep the REV03 recovery that already passes Safari.
    setTimeout(refreshViewport, 250);
    setTimeout(refreshViewport, 650);

    // WKWebView browsers can publish stale dimensions during the orientation
    // event and silently correct them later. Recover after VisualViewport settles.
    recoverAfterViewportSettles();

    rotationTimer = setTimeout(() => {
      rotatedRecently = false;
    }, 2500);
  };

  window.addEventListener('orientationchange', onOrientationChange);

  if (visualViewport) {
    visualViewport.addEventListener('resize', recoverAfterViewportSettles);
    visualViewport.addEventListener('scroll', recoverAfterViewportSettles);
  }

  document.addEventListener('focusin', (e) => {
    if (!isEditable(e.target)) return;

    const landscapeNow = window.matchMedia('(orientation: landscape)').matches;

    // Preserve REV03's initial-Landscape recovery.
    if (landscapeNow) {
      setTimeout(refreshViewport, 350);
      recoverAfterViewportSettles();
    }

    if (!rotatedRecently) return;

    // Preserve REV02/03's populated-field refocus recovery.
    setTimeout(refreshViewport, 350);
    recoverAfterViewportSettles();
    rotatedRecently = false;
    clearTimeout(rotationTimer);
  });
})();
