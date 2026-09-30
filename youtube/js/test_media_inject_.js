/* REV44 — TEST SITE ONLY
   Permanent test media uses the same games/recent data paths as normal content.
   /test/ controls visibility via localStorage.
   TEST CONTENT = Y means HIDDEN. N means VISIBLE. Default is Y. */
(() => {
  'use strict';

  const STORAGE_KEY = 'marklynxTestContent_TEST';
  const testContentIsHidden = () => (localStorage.getItem(STORAGE_KEY) || 'Y').toUpperCase() === 'Y';

  // Hidden means do not alter the normal site at all.
  if (testContentIsHidden()) return;

  const TEST_RECENT = [
    {
      id: 'HRtSmycjwN8', title: 'TEST VIDEO',
      thumbnail: 'https://i.ytimg.com/vi/HRtSmycjwN8/hqdefault.jpg'
    },
    {
      id: 'HRtSmycjwN8', title: 'TEST PLAYLIST',
      thumbnail: null,
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

    if (isPath(url, 'data/recent.json')) {
      const data = await response.clone().json();
      if (data && Array.isArray(data.videos)) {
        const production = data.videos.filter(video => video && video.title !== 'TEST VIDEO' && video.title !== 'TEST PLAYLIST');
        const testRecent = TEST_RECENT.map(video => ({...video}));
        const testPlaylist = testRecent.find(video => video.testPlaylistId);
        if (testPlaylist) {
          const playlistUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(testPlaylist.testPlaylistId)}`;
          const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(playlistUrl)}&format=json`;
          try {
            const oembedResponse = await nativeFetch(oembedUrl);
            if (oembedResponse.ok) {
              const oembed = await oembedResponse.json();
              if (oembed && oembed.thumbnail_url) testPlaylist.thumbnail = oembed.thumbnail_url;
            }
          } catch (_) {}
        }
        data.videos = [...testRecent, ...production];
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
