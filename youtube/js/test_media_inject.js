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

  const normalizeName = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

  const getAlwaysShowRecentGames = () =>
    (Array.isArray(window.RAW) ? window.RAW : []).filter(game => game && game.always_show_recent === true);


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
        const pinnedGames = getAlwaysShowRecentGames();
        const pinnedNames = new Set(pinnedGames.map(game => normalizeName(game.n)).filter(Boolean));
        const pinnedVideoIds = new Set(pinnedGames.map(game => String(game.v || '')).filter(Boolean));

        const production = data.videos.filter(video => {
          if (!video) return false;
          if (pinnedVideoIds.has(String(video.id || ''))) return false;
          return !pinnedNames.has(normalizeName(video.title));
        });

        const pinnedRecent = await Promise.all(pinnedGames.map(async game => {
          const videoId = String(game.v || '').trim();
          const playlistId = String(game.pl || '').trim();
          const recent = {
            id: videoId || playlistId,
            title: String(game.n || '').trim(),
            thumbnail: videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : null
          };

          if (playlistId) {
            recent.testPlaylistId = playlistId;
            const playlistUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(playlistUrl)}&format=json`;
            try {
              const oembedResponse = await nativeFetch(oembedUrl);
              if (oembedResponse.ok) {
                const oembed = await oembedResponse.json();
                if (oembed && oembed.thumbnail_url) recent.thumbnail = oembed.thumbnail_url;
              }
            } catch (_) {}
          }

          return recent;
        }));

        data.videos = [...pinnedRecent.filter(video => video.id && video.title), ...production];
      }
      return jsonResponse(data, response);
    }


    return response;
  };
})();
