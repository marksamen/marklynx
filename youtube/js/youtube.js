// ---------- Playlist / Video Modal ----------
// YouTube no longer reliably exposes its playlist panel inside embedded players,
// so we build our own right-hand playlist using the official IFrame Player API.
const videoModalOverlay = document.getElementById('videoModalOverlay');
const videoModalPlayer = document.getElementById('videoModalPlayer');
const videoModalTitle = document.getElementById('videoModalTitle');
const videoModalClose = document.getElementById('videoModalClose');
const videoModalSidebar = document.getElementById('videoModalSidebar');
const videoModalPlaylist = document.getElementById('videoModalPlaylist');
let playlistPlayer = null;
let pendingPlaylist = null;
let playlistToken = 0;

// ---------- Site-wide video count ----------
// Adult-flag playback + fallback diagnostic build.
// Normal playlists are discovered through the YouTube IFrame API.
// Entries marked adult:true bypass embedded playback and open directly on YouTube;
// so their manually verified aggregate count is added as a fallback bucket.
const siteVideoIds = new Set();
let sitePlaylistScanStarted = false;

const AGE_RESTRICTED_PLAYLIST_IDS = new Set(RAW.filter(r=>r.adult && r.pl).map(r=>r.pl));

const AGE_RESTRICTED_MANUAL_TOTAL = 242;
const PLAYLIST_MANUAL_EXPECTED_TOTAL = 727;

// Direct videos are counted dynamically from RAW. Using a Set means the same
// YouTube video ID can never inflate the footer if it is accidentally listed twice.
function directVideoTotal(){
  return new Set(RAW.filter(r=>r.v).map(r=>r.v)).size;
}

function displayedPlaylistVideoTotal(){
  return siteVideoIds.size + AGE_RESTRICTED_MANUAL_TOTAL;
}

function displayedTotalVideoCount(){
  return directVideoTotal() + displayedPlaylistVideoTotal();
}

function updateTotalVideoCount(){
  const el = document.getElementById('totalVideosCount');
  if(el) el.textContent = displayedTotalVideoCount().toLocaleString();
}

function scanPlaylistsForVideoCount(){
  if(sitePlaylistScanStarted) return;
  sitePlaylistScanStarted = true;

  const playlistEntries = [];
  const seen = new Set();
  RAW.forEach(r=>{
    if(!r.pl || seen.has(r.pl)) return;
    seen.add(r.pl);
    playlistEntries.push({ id:r.pl, title:r.n || '(untitled playlist)' });
  });
  if(!playlistEntries.length) return;

  const restrictedEntries = playlistEntries.filter(e=>AGE_RESTRICTED_PLAYLIST_IDS.has(e.id));
  const scanEntries = playlistEntries.filter(e=>!AGE_RESTRICTED_PLAYLIST_IDS.has(e.id));
  const report = restrictedEntries.map((entry)=>({
    title: entry.title,
    playlistId: entry.id,
    status: 'MANUAL 18+',
    count: null,
    attempts: 0,
    elapsedMs: 0,
    reason: 'Skipped: age-restricted playlist; included in aggregate manual fallback of 242 videos'
  }));
  const scanStartedAt = performance.now();

  updateTotalVideoCount();
  console.clear();
  console.group('%c[SCAN] AGE-RESTRICTED FALLBACK TEST', 'font-weight:bold;color:#e0392f');
  console.log(`[SCAN] Total playlists: ${playlistEntries.length}`);
  console.log(`[SCAN] Normal playlists queued for automatic scan: ${scanEntries.length}`);
  console.log(`[SCAN] Age-restricted playlists skipped: ${restrictedEntries.length}`);
  console.log(`[SCAN] Restricted manual fallback total: ${AGE_RESTRICTED_MANUAL_TOTAL}`);
  console.log(`[SCAN] Manual playlist ground truth: ${PLAYLIST_MANUAL_EXPECTED_TOTAL}`);
  console.groupEnd();

  const finishReport = ()=>{
    updateTotalVideoCount();
    const elapsed = Math.round(performance.now() - scanStartedAt);
    const autoOk = report.filter(r=>r.status==='OK');
    const failed = report.filter(r=>r.status==='FAILED');
    const manual = report.filter(r=>r.status==='MANUAL 18+');
    const returnedTotal = autoOk.reduce((sum,r)=>sum+r.count,0);
    const finalTotal = displayedPlaylistVideoTotal();

    console.group('%c========== FALLBACK PLAYLIST SCAN FINAL REPORT ==========', 'font-weight:bold;color:#e0392f');
    console.log(`Automatic succeeded: ${autoOk.length} / ${scanEntries.length}`);
    console.log(`Automatic failed:    ${failed.length} / ${scanEntries.length}`);
    console.log(`18+ playlists skipped/manual: ${manual.length}`);
    console.log(`Automatic unique videos discovered: ${siteVideoIds.size}`);
    console.log(`Restricted manual fallback: ${AGE_RESTRICTED_MANUAL_TOTAL}`);
    console.log(`PLAYLIST VIDEO TOTAL: ${finalTotal}`);
    console.log(`Direct videos from RAW: ${directVideoTotal()}`);
    console.log(`FOOTER TOTAL VIDEOS: ${displayedTotalVideoCount()}`);
    console.log(`Manual expected total: ${PLAYLIST_MANUAL_EXPECTED_TOTAL}`);
    console.log(`Difference: ${finalTotal - PLAYLIST_MANUAL_EXPECTED_TOTAL}`);
    console.log(`Total elapsed: ${elapsed} ms`);

    console.table(report.map((r,i)=>({
      '#': i+1,
      title: r.title,
      playlistId: r.playlistId,
      status: r.status,
      videos: r.count == null ? '(aggregate)' : r.count,
      attempts: r.attempts,
      elapsedMs: r.elapsedMs,
      reason: r.reason || ''
    })));

    if(failed.length){
      console.group('%cUNEXPECTED FAILED NORMAL PLAYLISTS', 'font-weight:bold;color:#ff8a80');
      failed.forEach(r=>console.error(`[SCAN] FAILED | ${r.title} | ${r.playlistId} | ${r.reason || 'unknown reason'}`));
      console.groupEnd();
    }
    if(finalTotal === PLAYLIST_MANUAL_EXPECTED_TOTAL){
      console.log('%c[SCAN] MATCH: website playlist total equals manual ground truth (715).', 'font-weight:bold;color:#7CFC8A');
    }else{
      console.warn(`[SCAN] MISMATCH: expected ${PLAYLIST_MANUAL_EXPECTED_TOTAL}, got ${finalTotal}.`);
    }
    console.groupEnd();
  };

  if(!scanEntries.length){ finishReport(); return; }

  loadYouTubeIframeAPI().then(()=>{
    const CONCURRENCY = 8;
    const MAX_WAIT = 5000;
    const MAX_ATTEMPTS = 2;
    let nextIndex = 0;
    let active = 0;
    let finished = 0;

    const finishAllIfDone = ()=>{
      if(finished < scanEntries.length) return;
      finishReport();
    };

    const runAttempt = (entry, index, attempt, originalStart)=>{
      active++;
      let scanner = null;
      let timer = null;
      let timeout = null;
      let done = false;
      let polls = 0;
      const attemptStart = performance.now();
      const label = `${String(index).padStart(2,'0')}/${scanEntries.length}`;

      console.log(`[SCAN] ${label} START attempt ${attempt}/${MAX_ATTEMPTS} | ${entry.title} | ${entry.id}`);

      const cleanup = ()=>{
        clearInterval(timer); clearTimeout(timeout);
        if(scanner){
          try{ scanner.stopVideo(); }catch(e){}
          try{ scanner.destroy(); }catch(e){}
          scanner = null;
        }
      };

      const finalizeAttempt = (status, reason, count=0)=>{
        if(done) return;
        done = true;
        const attemptElapsed = Math.round(performance.now() - attemptStart);
        cleanup();
        active--;

        if(status !== 'OK' && attempt < MAX_ATTEMPTS){
          console.warn(`[SCAN] ${label} RETRY after ${attemptElapsed} ms | reason=${reason}`);
          runAttempt(entry, index, attempt + 1, originalStart);
          return;
        }

        const totalElapsed = Math.round(performance.now() - originalStart);
        finished++;
        report.push({ title:entry.title, playlistId:entry.id, status, count, attempts:attempt, elapsedMs:totalElapsed, reason: status==='OK' ? '' : reason });
        if(status==='OK') console.log(`[SCAN] ${label} OK | ${count} videos | unique auto total=${siteVideoIds.size}`);
        else console.error(`[SCAN] ${label} FAILED | ${entry.title} | ${reason}`);
        startMore();
        finishAllIfDone();
      };

      // getPlaylist() can briefly return a partial list while YouTube is still
      // populating the playlist.  The old scanner accepted the first non-empty
      // result, which made the footer total timing/device dependent (desktop and
      // mobile could finish two videos apart).  Wait until the same non-empty
      // playlist has been observed three consecutive times before accepting it.
      let candidateIds = [];
      let candidateSignature = '';
      let stableReads = 0;

      const collect = (source)=>{
        if(!scanner || !scanner.getPlaylist) return false;
        try{
          const ids = (scanner.getPlaylist() || []).filter(Boolean);
          if(!ids.length) return false;

          const signature = ids.join('|');
          if(signature === candidateSignature){
            stableReads++;
          }else{
            candidateSignature = signature;
            candidateIds = ids.slice();
            stableReads = 1;
          }

          console.log(`[SCAN] ${label} OBSERVE via ${source} | ${ids.length} videos | stable=${stableReads}/3`);
          if(stableReads < 3) return false;

          candidateIds.forEach(id=>siteVideoIds.add(id));
          updateTotalVideoCount();
          console.log(`[SCAN] ${label} COLLECT STABLE | ${candidateIds.length} videos`);
          finalizeAttempt('OK','',candidateIds.length);
          return true;
        }catch(e){ console.error(`[SCAN] ${label} getPlaylist() exception`, e); }
        return false;
      };

      const host = document.createElement('div');
      host.id = `videoCountScanner_${Math.random().toString(36).slice(2)}`;
      host.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:200px;height:200px;opacity:0;pointer-events:none;';
      document.body.appendChild(host);

      const beginWaiting = ()=>{
        if(collect('immediate')) return;
        timer = setInterval(()=>{ polls++; collect(`poll#${polls}`); },100);
      };

      try{
        scanner = new YT.Player(host, {
          videoId:'dQw4w9WgXcQ', width:'200', height:'200',
          playerVars:{ autoplay:0, controls:0, rel:0, playsinline:1, enablejsapi:1, origin:window.location.origin },
          events:{
            onReady:()=>{
              try{ scanner.cuePlaylist({listType:'playlist',list:entry.id,index:0}); beginWaiting(); }
              catch(e){ finalizeAttempt('FAILED',`cuePlaylist exception: ${e && e.message ? e.message : e}`); }
            },
            onStateChange:event=>{ if(event && event.data===5) collect('state=CUED'); },
            onError:event=>{ const code=event && typeof event.data!=='undefined'?event.data:'unknown'; finalizeAttempt('FAILED',`YouTube error ${code}`); }
          }
        });
      }catch(e){
        finalizeAttempt('FAILED',`YT.Player constructor exception: ${e && e.message ? e.message : e}`);
        return;
      }

      timeout = setTimeout(()=>{ if(!done) finalizeAttempt('FAILED',`timeout after ${MAX_WAIT}ms (${polls} polls)`); },MAX_WAIT);
    };

    const scanOne = (entry,index)=>runAttempt(entry,index,1,performance.now());
    function startMore(){
      while(active < CONCURRENCY && nextIndex < scanEntries.length){
        const i=nextIndex++;
        scanOne(scanEntries[i],i+1);
      }
    }
    startMore();
  }).catch(err=>{
    console.error('[SCAN] Failed to load YouTube IFrame API', err);
  });
}
function loadYouTubeIframeAPI(){
  if(window.YT && window.YT.Player) return Promise.resolve();
  if(window.__ytApiPromise) return window.__ytApiPromise;
  window.__ytApiPromise = new Promise(resolve=>{
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = ()=>{
      if(typeof previousReady === 'function') previousReady();
      resolve();
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return window.__ytApiPromise;
}

function renderPlaylistItems(videoIds, activeIndex, token){
  if(token !== playlistToken) return;
  if(!videoIds.length){
    videoModalPlaylist.innerHTML = '<div class="playlist-loading">No videos found in this playlist.</div>';
    return;
  }
  videoModalPlaylist.innerHTML = videoIds.map((id, i)=>{
    const thumb = `https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg`;
    return `<div class="playlist-item${i === activeIndex ? ' active' : ''}" data-play-index="${i}" title="Play video ${i+1}">
      <div class="playlist-item-thumb"><img src="${thumb}" alt="" loading="lazy"></div>
      <div class="playlist-item-meta">
        <div class="playlist-item-number">Part ${i+1}</div>
        <div class="playlist-item-title">Loading title…</div>
      </div>
    </div>`;
  }).join('');

  videoModalPlaylist.querySelectorAll('[data-play-index]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const index = Number(el.dataset.playIndex);
      if(playlistPlayer && Number.isFinite(index)){
        playlistPlayer.playVideoAt(index);
        videoModalPlaylist.querySelectorAll('.playlist-item').forEach(x=>x.classList.remove('active'));
        el.classList.add('active');
      }
    });
  });

  // oEmbed gives us the actual video title without needing a YouTube API key.
  videoIds.forEach((id, i)=>{
    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v='+id)}&format=json`)
      .then(r=>r.ok ? r.json() : null)
      .then(data=>{
        if(token !== playlistToken || !data) return;
        const item = videoModalPlaylist.querySelector(`[data-play-index="${i}"]`);
        const titleEl = item && item.querySelector('.playlist-item-title');
        if(titleEl && data.title) titleEl.textContent = data.title;
      })
      .catch(()=>{});
  });
}

function syncPlaylistSidebar(){
  if(!playlistPlayer) return;
  const ids = playlistPlayer.getPlaylist ? (playlistPlayer.getPlaylist() || []) : [];
  if(!ids.length) return false;
  renderPlaylistItems(ids, playlistPlayer.getPlaylistIndex ? playlistPlayer.getPlaylistIndex() : 0, playlistToken);
  return true;
}

function createPlaylistPlayer(playlistId, token){
  playlistPlayer = new YT.Player('videoModalPlayer', {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 1,
      rel: 0,
      playsinline: 1
    },
    events: {
      onReady: event=>{
        if(token !== playlistToken) return;
        event.target.loadPlaylist({listType:'playlist', list:playlistId, index:0});
        setTimeout(()=>{
          if(token === playlistToken && event.target.playVideo) event.target.playVideo();
        }, 350);
        let attempts = 0;
        const poll = setInterval(()=>{
          if(token !== playlistToken){ clearInterval(poll); return; }
          if(syncPlaylistSidebar() || ++attempts > 60) clearInterval(poll);
        }, 250);
      },
      onStateChange: ()=>{
        syncPlaylistSidebar();
      }
    }
  });
}

function openVideoModal(videoId, title){
  playlistToken++;
  pendingPlaylist = null;
  videoModalTitle.textContent = title || '';
  videoModalSidebar.style.display = 'none';
  videoModalPlaylist.innerHTML = '';
  videoModalOverlay.classList.add('open');

  loadYouTubeIframeAPI().then(()=>{
    if(playlistPlayer && playlistPlayer.loadVideoById){
      playlistPlayer.loadVideoById(videoId);
      if(playlistPlayer.playVideo) playlistPlayer.playVideo();
    } else {
      playlistPlayer = new YT.Player('videoModalPlayer', {
        width: '100%',
        height: '100%',
        videoId: videoId,
        playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: event=>{
            if(event.target.playVideo) event.target.playVideo();
          }
        }
      });
    }
  });
}

function openPlaylistModal(playlistId, title){
  playlistToken++;
  const token = playlistToken;
  pendingPlaylist = playlistId;
  videoModalTitle.textContent = title || '';
  videoModalSidebar.style.display = 'block';
  videoModalPlaylist.innerHTML = '<div class="playlist-loading">Loading playlist…</div>';
  videoModalOverlay.classList.add('open');

  loadYouTubeIframeAPI().then(()=>{
    if(token !== playlistToken) return;
    if(playlistPlayer && playlistPlayer.loadPlaylist){
      playlistPlayer.loadPlaylist({listType:'playlist', list:playlistId, index:0});
      setTimeout(syncPlaylistSidebar, 500);
    } else {
      createPlaylistPlayer(playlistId, token);
    }
  });
}

function closeVideoModal(){
  playlistToken++;
  pendingPlaylist = null;
  videoModalOverlay.classList.remove('open');
  videoModalPlaylist.innerHTML = '';
  if(playlistPlayer && playlistPlayer.stopVideo){
    playlistPlayer.stopVideo();
  }
}

videoModalClose.addEventListener('click', closeVideoModal);
videoModalOverlay.addEventListener('click', (e)=>{ if(e.target === videoModalOverlay) closeVideoModal(); });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeVideoModal(); });
