/* REV44 — TEST SITE ONLY
   Permanent test media uses the same games/recent data paths as normal content.
   /test/ controls visibility via localStorage.
   TEST CONTENT = Y means HIDDEN. N means VISIBLE. Default is Y. */
(() => {
  'use strict';

  const STORAGE_KEY = 'marklynxTestContent';
  const testContentIsHidden = () => (localStorage.getItem(STORAGE_KEY) || 'Y').toUpperCase() === 'Y';

  // Hidden means do not alter the normal site at all.
  if (testContentIsHidden()) return;

  const TEST_GAMES = [
    {
      n: 'TEST VIDEO', p: 'TEST', g: 'TEST', t: 'TEST', ty: 'TEST', tx: 'No', q: '4K', df: 'Easy',
      u: 'https://youtu.be/HRtSmycjwN8', v: 'HRtSmycjwN8', testContent: 'Y'
    },
    {
      n: 'TEST PLAYLIST', p: 'TEST', g: 'TEST', t: 'TEST', ty: 'TEST', tx: 'No', q: '4K', df: 'Easy',
      u: 'https://www.youtube.com/playlist?list=PLW8_g7jLVHB0', v: '', pl: 'PLW8_g7jLVHB0', testContent: 'Y'
    }
  ];

  const TEST_RECENT = [
    {
      id: 'HRtSmycjwN8', title: 'TEST VIDEO',
      thumbnail: 'https://i.ytimg.com/vi/HRtSmycjwN8/hqdefault.jpg'
    },
    {
      id: 'HRtSmycjwN8', title: 'TEST PLAYLIST',
      thumbnail: 'https://i.ytimg.com/vi/HRtSmycjwN8/hqdefault.jpg',
      testPlaylistId: 'PLW8_g7jLVHB0'
    }
  ];

  const nativeFetch = window.fetch.bind(window);
  const requestUrl = input => typeof input === 'string' ? input : (input && typeof input.url === 'string' ? input.url : '');
  const isPath = (url, path) => {
    try { return new URL(url, location.href).pathname.endsWith(path); }
    catch (_) { return url.includes(path); }
  };
  const jsonResponse = (payload, original) => {
    const headers = new Headers(original.headers);
    headers.set('content-type', 'application/json; charset=utf-8');
    headers.delete('content-length');
    return new Response(JSON.stringify(payload), {status: original.status, statusText: original.statusText, headers});
  };

  window.fetch = async function(input, init) {
    const url = requestUrl(input);
    const response = await nativeFetch(input, init);
    if (!response.ok) return response;

    if (isPath(url, 'data/games.json')) {
      const data = await response.clone().json();
      if (Array.isArray(data)) {
        for (const testGame of TEST_GAMES) {
          if (!data.some(game => game && game.n === testGame.n)) data.push(testGame);
        }
      }
      return jsonResponse(data, response);
    }

    if (isPath(url, 'data/recent.json')) {
      const data = await response.clone().json();
      if (data && Array.isArray(data.videos)) {
        const production = data.videos.filter(video => video && video.title !== 'TEST VIDEO' && video.title !== 'TEST PLAYLIST');
        data.videos = [...TEST_RECENT, ...production];
      }
      return jsonResponse(data, response);
    }


    if (isPath(url, 'sections/developer_.html')) {
      let html = await response.clone().text();
      const marker = '<div class="developer-cards">';
      if (html.includes(marker) && !html.includes('data-video-title="TEST DEVELOPER VIDEO"')) {
        const testCard = `
      <a class="developer-card" href="https://youtu.be/HRtSmycjwN8" data-video-id="HRtSmycjwN8" data-video-title="TEST DEVELOPER VIDEO">
        <div class="developer-card-thumb"><img src="https://i.ytimg.com/vi/HRtSmycjwN8/hqdefault.jpg" alt="TEST Developer walkthrough thumbnail"></div>
        <div class="developer-card-top"><strong>TEST DEVELOPER VIDEO</strong><span>TEST CONTENT</span></div>
        <div class="developer-card-meta"><span>TEST</span><span>TEST</span><span>4K</span></div>
        <div class="developer-card-link">Watch walkthrough →</div>
      </a>`;
        html = html.replace(marker, marker + testCard);
      }
      const headers = new Headers(response.headers);
      headers.set('content-type', 'text/html; charset=utf-8');
      headers.delete('content-length');
      return new Response(html, {status: response.status, statusText: response.statusText, headers});
    }

    return response;
  };
})();
